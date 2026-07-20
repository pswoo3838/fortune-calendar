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

      // ★ 모듈 전역이 아닌 호출마다 새로운 지역 변수로 관리 (다른 월 사주 혼동 및 빠른 출력 버그 완전 해결)
      let currentReport: MonthlySajuReport | null = null;

      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku: MONTHLY_SAJU_SKU,
          /**
           * ★ 앱인토스 인앱 결제 상품 지급 브릿지 콜백
           * - return true  → 지급 완료, 결제 확정
           * - return false → 지급 실패, 앱인토스가 자동 환불 (캐시 저장을 안 함)
           */
          processProductGrant: async ({ orderId }: { orderId: string }) => {
            console.log(`[IAP] processProductGrant 시작 (${year}년 ${month}월), orderId:`, orderId);
            try {
              // 해당 연/월에 맞는 사주 데이터 생성
              currentReport = await getMonthlySajuReport(profile, year, month, false);
              console.log(`[IAP] ${year}년 ${month}월 사주 생성 성공 → return true (결제 확정)`);
              return true;
            } catch (err) {
              console.error("[IAP] 사주 생성 실패 → return false (자동 환불)", err);
              return false;
            }
          },
        },
        onEvent: async (event: any) => {
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

            if (currentReport) {
              finishSuccess(currentReport);
            } else {
              getMonthlySajuReport(profile, year, month, true)
                .then(finishSuccess)
                .catch(() => resolve({ success: false, error: "운세 데이터를 불러오지 못했습니다." }));
            }
          } else if (event.type === "grantFailed") {
            // ★ 토스 샌드박스 [결제성공(서버실패)] 등 서버 인증 실패 시 미결 주문(getPendingOrders) 복구 플로우 진행!
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
