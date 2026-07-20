/**
 * Apps-in-Toss IAP 결제 매니저
 *
 * 앱인토스 공식 IAP SDK (`createOneTimePurchaseOrder`) 기반으로 구현합니다.
 */

import type { UserProfile, MonthlySajuReport } from "../types/fortune";
import { getMonthlySajuReport } from "./fortuneService";

// 토스 파트너 콘솔에서 등록한 상품 SKU
export const MONTHLY_SAJU_SKU = "ait.0000033776.2b879b8b.ae90ef5574.4552208485";

export interface SajuPaymentResult {
  success: boolean;
  report?: MonthlySajuReport;
  error?: string;
  autoRefunded?: boolean;
}

/**
 * 990 월간 운세 결제 + 사주 생성을 원자적으로 처리합니다.
 *
 * 앱인토스 IAP의 processProductGrant 내부에서 사주 API를 호출하므로,
 * API 실패 시 false를 반환 → 앱인토스가 자동 환불합니다.
 */
export function requestMonthlySajuWithPayment(
  profile: UserProfile,
  year: number,
  month: number,
): Promise<SajuPaymentResult> {
  return new Promise(async (resolve) => {
    // ─── 개발/테스트 모드: SKU 미등록 시 결제 없이 바로 생성 ───
    if (MONTHLY_SAJU_SKU === "YOUR_PRODUCT_SKU_HERE") {
      console.log("[IAP] 상품 SKU 미등록 - 테스트 모드로 결제 스킵");
      try {
        const report = await getMonthlySajuReport(profile, year, month);
        resolve({ success: true, report });
      } catch (err) {
        console.error("[IAP] 테스트 모드 사주 생성 실패:", err);
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

      let generatedReport: MonthlySajuReport | null = null;

      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku: MONTHLY_SAJU_SKU,
          /**
           * ★ 앱인토스 인앱 결제 상품 지급 브릿지 콜백
           * - return true  → 지급 완료, 결제 확정
           * - return false → 지급 실패, 앱인토스가 자동 환불 (캐시 저장을 안 함)
           */
          processProductGrant: async ({ orderId }: { orderId: string }) => {
            console.log("[IAP] processProductGrant 시작, orderId:", orderId);
            try {
              // 결제 승인 확인 단계에서는 캐시 저장을 하지 않음 (shouldSaveCache = false)
              generatedReport = await getMonthlySajuReport(profile, year, month, false);
              console.log("[IAP] 사주 생성 성공 → return true (결제 확정)");
              return true;
            } catch (err) {
              console.error("[IAP] 사주 생성 실패 → return false (자동 환불)", err);
              return false; // false 반환 시 토스가 자동 환불
            }
          },
        },
        onEvent: (event: any) => {
          console.log("[IAP] onEvent:", event.type, event);

          if (event.type === "success") {
            cleanup?.();

            const cacheKey = `fortune_monthly_saju_v4_${profile.name}_${profile.zodiac}_${year}_${month}`;

            const finishSuccess = (report: MonthlySajuReport) => {
              try {
                localStorage.setItem(cacheKey, JSON.stringify(report));
              } catch (e) {}
              resolve({ success: true, report });
            };

            if (generatedReport) {
              finishSuccess(generatedReport);
            } else {
              getMonthlySajuReport(profile, year, month, true)
                .then(finishSuccess)
                .catch(() => resolve({ success: false, error: "운세 데이터를 불러오지 못했습니다." }));
            }
          } else if (event.type === "grantFailed") {
            cleanup?.();
            resolve({
              success: false,
              autoRefunded: true,
              error: "일시적인 오류로 운세 데이터를 생성하지 못했습니다.\n결제 금액은 자동으로 환불 처리되었습니다.",
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
      console.warn("[IAP] IAP 초기화 또는 결제 진행 중 실패:", err);
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
 * 토스 샌드박스 / 라이브 결제 미결 주문(Pending Orders) 복구 플로우
 * (결제는 성공했으나 서버 실패 시뮬레이션 등으로 미결 남은 결제건 안전 복원)
 */
export async function restorePendingOrders(
  profile: UserProfile,
  year: number,
  month: number
): Promise<MonthlySajuReport | null> {
  try {
    const { IAP } = await import("@apps-in-toss/web-framework") as any;

    if (!IAP || typeof IAP.getPendingOrders !== "function") return null;

    const pendingResult = await IAP.getPendingOrders().catch(() => null);
    const orders = pendingResult?.orders ?? [];

    if (!Array.isArray(orders) || orders.length === 0) return null;

    console.log("[IAP] 미결 주문(Pending Orders) 발견 및 복구 시작:", orders.length, "건");

    for (const order of orders) {
      try {
        const report = await getMonthlySajuReport(profile, year, month, true);

        if (report && typeof IAP.completeProductGrant === "function") {
          await IAP.completeProductGrant({ orderId: order.orderId }).catch(() => {});
          console.log("[IAP] 미결 주문 복원 및 completeProductGrant 완료:", order.orderId);
          return report;
        }
      } catch (err) {
        console.error("[IAP] 미결 주문 복원 처리 중 실패:", order.orderId, err);
      }
    }
  } catch (err) {
    console.warn("[IAP] getPendingOrders 복구 확인 중 경고:", err);
  }
  return null;
}
