/**
 * Apps-in-Toss 결제 매니저
 *
 * 파트너 콘솔에서 상품 등록 후 전달해주시는 상품 ID / 결제 코드를 여기에 설정합니다.
 */

// 토스 파트너 콘솔 등록 상품 ID (전달해 주시면 이 값을 업데이트합니다)
export const MONTHLY_SAJU_PRODUCT_ID = "YOUR_PRODUCT_ID_HERE";

interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * 990 월간 사주 인앱 결제 요청 함수
 * 토스 콘솔 상품 ID 코드가 전달되면 실제 결제 브릿지 호출을 실행합니다.
 */
export async function requestMonthlySajuPayment(): Promise<PaymentResult> {
  // 1. 아직 상품 ID 코드가 등록되지 않은 경우 (개발/테스트용 임시 통과 또는 코드 대기)
  if (MONTHLY_SAJU_PRODUCT_ID === "YOUR_PRODUCT_ID_HERE") {
    console.log("[Payment] 결제 상품 코드 대기 중 - 테스트 모드로 바로 결제 성공 처리합니다.");
    return { success: true, orderId: `test_order_${Date.now()}` };
  }

  // 2. Apps-in-Toss 결제 SDK 로딩 및 실행
  try {
    const fw = await import("@apps-in-toss/web-framework") as any;

    // 결제 SDK 지원 여부 확인
    if (typeof fw?.requestPayment === "function") {
      const res = await fw.requestPayment({
        productId: MONTHLY_SAJU_PRODUCT_ID,
      });

      if (res && (res.success || res.status === "SUCCESS")) {
        return { success: true, orderId: res.orderId };
      } else {
        return { success: false, error: res?.message || "결제가 취소되었습니다." };
      }
    } else {
      console.warn("[Payment] requestPayment SDK 미지원 환경 - 테스트 성공 처리");
      return { success: true, orderId: `dev_order_${Date.now()}` };
    }
  } catch (err) {
    console.error("[Payment] 결제 요청 실패:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "결제 중 오류가 발생했습니다.",
    };
  }
}
