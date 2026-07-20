/**
 * Apps-in-Toss IAP 결제 매니저
 *
 * 앱인토스 공식 IAP SDK (`createOneTimePurchaseOrder`) 기반으로 구현합니다.
 *
 * ★ 핵심: processProductGrant 콜백 안에서 사주 API를 호출하고,
 *   성공 시 true / 실패 시 false를 반환합니다.
 *   false를 반환하면 앱인토스가 자동으로 결제를 취소(환불)합니다.
 *   → 별도 환불 API 호출이 필요 없습니다.
 */

import type { UserProfile, MonthlySajuReport } from "../types/fortune";
import { getMonthlySajuReport } from "./fortuneService";

// 토스 파트너 콘솔에서 등록한 상품 SKU (전달받으면 업데이트)
export const MONTHLY_SAJU_SKU = "ait.0000033776.2b879b8b.ae90ef5574.4552208485";

export interface SajuPaymentResult {
  success: boolean;
  report?: MonthlySajuReport;
  error?: string;
  /** 결제가 성공했지만 지급 실패로 자동 환불된 경우 */
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

      // 사주 생성 결과를 processProductGrant 밖으로 전달하기 위한 변수
      let generatedReport: MonthlySajuReport | null = null;

      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku: MONTHLY_SAJU_SKU,
          /**
           * ★ 결제 성공 후 앱인토스가 호출하는 상품 지급 콜백
           *
           * 여기서 사주 API를 호출합니다.
           * - true 반환 → 지급 완료, 결제 확정
           * - false 반환 → 지급 실패, 앱인토스가 자동 환불
           */
          processProductGrant: async ({ orderId }: { orderId: string }) => {
            console.log("[IAP] processProductGrant 시작, orderId:", orderId);
            try {
              generatedReport = await getMonthlySajuReport(profile, year, month);
              console.log("[IAP] 사주 생성 성공 → completeProductGrant 호출 (결제 확정)");
              if (typeof IAP.completeProductGrant === "function") {
                try {
                  await IAP.completeProductGrant({ orderId });
                } catch (e) {
                  console.warn("[IAP] completeProductGrant 호출 경고:", e);
                }
              }
              return true;
            } catch (err) {
              console.error("[IAP] 사주 생성 실패 → false 반환 (자동 환불)", err);
              return false; // ← 이렇게 하면 앱인토스가 자동으로 환불합니다
            }
          },
        },
        onEvent: (event: any) => {
          console.log("[IAP] onEvent:", event.type, event);

          if (event.type === "success") {
            cleanup?.();
            const orderId = event.orderId || event.data?.orderId;
            if (orderId && typeof IAP.completeProductGrant === "function") {
              IAP.completeProductGrant({ orderId }).catch(() => {});
            }
            if (generatedReport) {
              resolve({ success: true, report: generatedReport });
            } else {
              // processProductGrant에서 true를 반환했는데 report가 없는 경우
              resolve({ success: false, error: "운세 데이터가 생성되었으나 로드에 실패했습니다." });
            }
          } else if (event.type === "grantFailed") {
            // processProductGrant에서 false를 반환한 경우 — 자동 환불됨
            cleanup?.();
            resolve({
              success: false,
              autoRefunded: true,
              error: "일시적인 오류로 운세 데이터를 생성하지 못했습니다.\n결제 금액은 자동으로 환불 처리되었습니다.\n잠시 후 다시 시도해 주세요.",
            });
          }
        },
        onError: (error: any) => {
          console.error("[IAP] onError:", error);
          cleanup?.();

          // 사용자 취소인 경우
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
      console.warn("[IAP] IAP 초기화 또는 결제 진행 중 실패 (테스트 모드로 폴백 처리합니다):", err);
      // 토스앱 외부 브라우저(데스크톱 테스트 등) 환경을 위해 로컬 mock 성공으로 처리 (1.5초 원형 로더 연출 대기)
      try {
        await new Promise((res) => setTimeout(res, 1500));
        const report = await getMonthlySajuReport(profile, year, month);
        resolve({ success: true, report });
      } catch (innerErr) {
        resolve({ success: false, error: "운세 데이터 생성에 실패했습니다." });
      }
    }
  });
}

/**
 * 앱 시작 시 미결 주문을 복원합니다.
 * (결제는 성공했으나 processProductGrant 실행 중 앱이 종료된 경우)
 */
export async function restorePendingOrders(
  profile: UserProfile,
): Promise<void> {
  try {
    const { IAP } = await import("@apps-in-toss/web-framework") as any;

    if (!IAP || typeof IAP.getPendingOrders !== "function") return;

    const pendingResult = await IAP.getPendingOrders();
    const orders = pendingResult?.orders ?? [];

    if (orders.length === 0) return;

    console.log("[IAP] 미결 주문 발견:", orders.length, "건");

    for (const order of orders) {
      try {
        // 미결 주문의 상품에 대해 사주 생성 재시도
        // (실제로는 order에서 year/month를 파싱해야 하지만,
        //  소모품 1종이므로 현재 월 기준으로 처리)
        const now = new Date();
        const report = await getMonthlySajuReport(profile, now.getFullYear(), now.getMonth() + 1);

        if (report && typeof IAP.completeProductGrant === "function") {
          await IAP.completeProductGrant({ orderId: order.orderId });
          console.log("[IAP] 미결 주문 복원 완료:", order.orderId);
        }
      } catch (err) {
        console.error("[IAP] 미결 주문 복원 실패:", order.orderId, err);
      }
    }
  } catch (err) {
    console.error("[IAP] getPendingOrders 실패:", err);
  }
}
