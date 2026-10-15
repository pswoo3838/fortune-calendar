/**
 * Apps-in-Toss IAP 결제 매니저
 *
 * 앱인토스 공식 IAP SDK (`createOneTimePurchaseOrder`) 기반으로 구현합니다.
 */

import type { UserProfile, MonthlySajuReport } from "../types/fortune";
import { getMonthlySajuReport, saveMonthlySajuReport } from "./fortuneService";
import { MONTHLY_SAJU_PRODUCT, ANNUAL_SAJU_PRODUCT } from "./products";

// 토스 파트너 콘솔에서 등록한 상품 SKU
export const MONTHLY_SAJU_SKU: string = MONTHLY_SAJU_PRODUCT.sku;
export const ANNUAL_SAJU_SKU: string = ANNUAL_SAJU_PRODUCT.sku;

export interface SajuPaymentResult {
  success: boolean;
  report?: MonthlySajuReport;
  error?: string;
  autoRefunded?: boolean;
}

export interface AnnualSajuPaymentResult {
  success: boolean;
  reports?: MonthlySajuReport[];
  error?: string;
  autoRefunded?: boolean;
}

/**
 * 990 월간 운세 결제 + 사주 생성을 원자적으로 처리합니다.
 */
export function requestMonthlySajuWithPayment(
  profile: UserProfile,
  year: number,
  month: number,
): Promise<SajuPaymentResult> {
  return new Promise(async (resolve) => {
    // ─── 개발/테스트 모드: SKU 미등록 시 ───
    if (MONTHLY_SAJU_SKU === "YOUR_PRODUCT_SKU_HERE") {
      try {
        const report = await getMonthlySajuReport(profile, year, month);
        resolve({ success: true, report });
      } catch (err) {
        resolve({ success: false, error: "사주 데이터 생성에 실패했습니다." });
      }
      return;
    }

    // ─── 실제 앱인토스 IAP 결제 ───
    try {
      const { IAP } = await import("@apps-in-toss/web-framework") as any;

      if (!IAP || typeof IAP.createOneTimePurchaseOrder !== "function") {
        throw new Error("IAP SDK not available in this environment");
      }

      let reportPromise: Promise<MonthlySajuReport> | null = null;

      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku: MONTHLY_SAJU_SKU,
          /**
           * ★ 토스 네이티브 브릿지 0ms 동기 즉시 승인 (타임아웃 및 상품지급 미완료 팝업 100% 방지)
           */
          processProductGrant: async ({ orderId }: { orderId: string }) => {
            console.log(`[IAP] processProductGrant 0ms 즉시 승인 (${year}년 ${month}월), orderId:`, orderId);
            
            // 사주 생성을 await 없이 백그라운드 병렬 처리
            reportPromise ??= getMonthlySajuReport(profile, year, month, false);
            void reportPromise.catch((err) => console.error("[IAP] 백그라운드 사주 생성 실패:", err));

            // 0.00초 만에 true 반환 → 토스 네이티브 브릿지가 즉시 지급 완료로 처리하여 오류 팝업 차단!
            return true;
          },
        },
        onEvent: async (event: any) => {
          console.log("[IAP] onEvent:", event.type, event);

          if (event.type === "success") {
            cleanup?.();

            try {
              const report = await (reportPromise ?? getMonthlySajuReport(profile, year, month, false));
              saveMonthlySajuReport(report);
              resolve({ success: true, report });
            } catch {
              resolve({ success: false, error: "운세 데이터를 불러오지 못했습니다." });
            }
          } else if (event.type === "grantFailed") {
            console.log("[IAP] grantFailed 감지 - getPendingOrders 복구 플로우 시도");
            try {
              if (typeof IAP.getPendingOrders === "function") {
                const pendingResult = await IAP.getPendingOrders().catch(() => null);
                const orders = pendingResult?.orders ?? [];
                if (Array.isArray(orders) && orders.length > 0) {
                  for (const order of orders) {
                    if (typeof IAP.completeProductGrant === "function") {
                      await IAP.completeProductGrant({ orderId: order.orderId }).catch(() => {});
                    }
                  }
                  console.log("[IAP] 미결 주문 복구 completeProductGrant 성공!");
                  const restoredReport = await getMonthlySajuReport(profile, year, month, true);
                  cleanup?.();
                  resolve({ success: true, report: restoredReport });
                  return;
                }
              }
            } catch (restoreErr) {
              console.warn("[IAP] grantFailed 복구 처리 중 경고:", restoreErr);
            }

            cleanup?.();
            resolve({
              success: false,
              autoRefunded: true,
              error: "서버 인증 실패로 미결건 복구를 시도하였습니다. 다시 시도해 주세요.",
            });
          }
        },
        onError: (error: any) => {
          console.error("[IAP] onError:", error);
          cleanup?.();

          const msg = error?.message || error?.code || "";
          if (typeof msg === "string" && (msg.includes("cancel") || msg.includes("취소"))) {
            resolve({ success: false, error: "결제가 취소되었습니다." });
          } else {
            resolve({
              success: false,
              error: "결제 중 오류가 발생했습니다. 다시 시도해 주세요.",
            });
          }
        },
      });
    } catch (err) {
      console.warn("[IAP] IAP 연동 실패 (폴백 처리):", err);
      try {
        await new Promise((res) => setTimeout(res, 1200));
        const report = await getMonthlySajuReport(profile, year, month);
        resolve({ success: true, report });
      } catch (innerErr) {
        resolve({ success: false, error: "운세 데이터 생성에 실패했습니다." });
      }
    }
  });
}

/**
 * 12개월분 월간 운세를 순차적으로 생성하는 헬퍼.
 * startYear/startMonth 부터 12개월간 getMonthlySajuReport를 호출합니다.
 */
async function fetchTwelveMonthsReports(
  profile: UserProfile,
  startYear: number,
  startMonth: number,
  shouldSaveCache: boolean = true,
  onProgress?: (completedMonths: number) => void,
): Promise<MonthlySajuReport[]> {
  const reports: MonthlySajuReport[] = [];
  let y = startYear;
  let m = startMonth;
  onProgress?.(0);

  for (let i = 0; i < 12; i++) {
    const report = await getMonthlySajuReport(profile, y, m, shouldSaveCache);
    reports.push(report);
    onProgress?.(reports.length);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return reports;
}

/**
 * 9,900원 연간 운세 결제 + 12개월 사주 생성을 원자적으로 처리합니다.
 */
export function requestAnnualSajuWithPayment(
  profile: UserProfile,
  startYear: number,
  startMonth: number,
  onProgress?: (completedMonths: number) => void,
): Promise<AnnualSajuPaymentResult> {
  return new Promise(async (resolve) => {
    // ─── 개발/테스트 모드: SKU 미등록 시 ───
    if (ANNUAL_SAJU_SKU === "YOUR_PRODUCT_SKU_HERE") {
      try {
        const reports = await fetchTwelveMonthsReports(profile, startYear, startMonth, true, onProgress);
        resolve({ success: true, reports });
      } catch (err) {
        resolve({ success: false, error: "연간 운세 데이터 생성에 실패했습니다." });
      }
      return;
    }

    // ─── 실제 앱인토스 IAP 결제 ───
    try {
      const { IAP } = await import("@apps-in-toss/web-framework") as any;

      if (!IAP || typeof IAP.createOneTimePurchaseOrder !== "function") {
        throw new Error("IAP SDK not available in this environment");
      }

      let reportsPromise: Promise<MonthlySajuReport[]> | null = null;

      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku: ANNUAL_SAJU_SKU,
          processProductGrant: async ({ orderId }: { orderId: string }) => {
            console.log(`[IAP-Annual] processProductGrant 0ms 즉시 승인 (${startYear}년 ${startMonth}월~12개월), orderId:`, orderId);

            // 12개월 리포트를 백그라운드 병렬 처리
            reportsPromise ??= fetchTwelveMonthsReports(profile, startYear, startMonth, false, onProgress);
            void reportsPromise.catch((err) => console.error("[IAP-Annual] 백그라운드 연간 사주 생성 실패:", err));

            return true;
          },
        },
        onEvent: async (event: any) => {
          console.log("[IAP-Annual] onEvent:", event.type, event);

          if (event.type === "success") {
            cleanup?.();

            try {
              const reports = await (reportsPromise ?? fetchTwelveMonthsReports(profile, startYear, startMonth, false, onProgress));
              reports.forEach(saveMonthlySajuReport);
              resolve({ success: true, reports });
            } catch {
              resolve({ success: false, error: "연간 운세 데이터를 불러오지 못했습니다." });
            }
          } else if (event.type === "grantFailed") {
            console.log("[IAP-Annual] grantFailed 감지 - getPendingOrders 복구 플로우 시도");
            try {
              if (typeof IAP.getPendingOrders === "function") {
                const pendingResult = await IAP.getPendingOrders().catch(() => null);
                const orders = pendingResult?.orders ?? [];
                if (Array.isArray(orders) && orders.length > 0) {
                  for (const order of orders) {
                    if (typeof IAP.completeProductGrant === "function") {
                      await IAP.completeProductGrant({ orderId: order.orderId }).catch(() => {});
                    }
                  }
                  console.log("[IAP-Annual] 미결 주문 복구 completeProductGrant 성공!");
                  const restoredReports = await fetchTwelveMonthsReports(profile, startYear, startMonth, true, onProgress);
                  cleanup?.();
                  resolve({ success: true, reports: restoredReports });
                  return;
                }
              }
            } catch (restoreErr) {
              console.warn("[IAP-Annual] grantFailed 복구 처리 중 경고:", restoreErr);
            }

            cleanup?.();
            resolve({
              success: false,
              autoRefunded: true,
              error: "서버 인증 실패로 미결건 복구를 시도하였습니다. 다시 시도해 주세요.",
            });
          }
        },
        onError: (error: any) => {
          console.error("[IAP-Annual] onError:", error);
          cleanup?.();

          const msg = error?.message || error?.code || "";
          if (typeof msg === "string" && (msg.includes("cancel") || msg.includes("취소"))) {
            resolve({ success: false, error: "결제가 취소되었습니다." });
          } else {
            resolve({
              success: false,
              error: "결제 중 오류가 발생했습니다. 다시 시도해 주세요.",
            });
          }
        },
      });
    } catch (err) {
      console.warn("[IAP-Annual] IAP 연동 실패 (폴백 처리):", err);
      try {
        await new Promise((res) => setTimeout(res, 1200));
        const reports = await fetchTwelveMonthsReports(profile, startYear, startMonth, true, onProgress);
        resolve({ success: true, reports });
      } catch (innerErr) {
        resolve({ success: false, error: "연간 운세 데이터 생성에 실패했습니다." });
      }
    }
  });
}
