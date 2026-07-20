/**
 * oheng.ts — 오행(五行)별 행운 속성 결정 매핑 테이블
 *
 * 부족 오행에 해당하는 색상, 방향, 숫자, 조언 등을
 * 100% 결정론적으로 매핑하여 정합성을 보장합니다.
 */

export interface OhengLuckyResult {
  luckyColor: string;
  luckyDirection: string;
  luckyNumber: number;
}

/**
 * 부족 오행에 따른 행운 가이드 결정
 */
export function getOhengLucky(weakElement: string): OhengLuckyResult {
  switch (weakElement) {
    case "목":
      return {
        luckyColor: "초록색 & 연두색",
        luckyDirection: "동쪽 (East)",
        luckyNumber: 3,
      };
    case "화":
      return {
        luckyColor: "빨간색 & 주황색",
        luckyDirection: "남쪽 (South)",
        luckyNumber: 7,
      };
    case "토":
      return {
        luckyColor: "노란색 & 브라운",
        luckyDirection: "중앙 (Center)",
        luckyNumber: 5,
      };
    case "금":
      return {
        luckyColor: "흰색 & 실버",
        luckyDirection: "서쪽 (West)",
        luckyNumber: 4,
      };
    case "수":
      return {
        luckyColor: "검은색 & 네이비",
        luckyDirection: "북쪽 (North)",
        luckyNumber: 1,
      };
    default:
      return {
        luckyColor: "보라색 & 골드",
        luckyDirection: "동남쪽 (South-East)",
        luckyNumber: 8,
      };
  }
}
