/**
 * oheng.ts — 오행(五行) 기반 행운 코드 결정론적 매핑
 *
 * 부족 오행을 보충하는 행운의 숫자/색상/방향을 산출합니다.
 * LLM 랜덤이 아니라 명리학 오행 논리로 확정됩니다.
 */

export interface OhengLucky {
  luckyNumber: number;
  luckyColor: string;
  luckyDirection: string;
}

/** 부족 오행 → 보충 행운 코드 매핑 */
const OHENG_MAP: Record<string, OhengLucky> = {
  "목": { luckyNumber: 3, luckyColor: "청색 & 녹색", luckyDirection: "동쪽" },
  "화": { luckyNumber: 7, luckyColor: "적색 & 자색", luckyDirection: "남쪽" },
  "토": { luckyNumber: 5, luckyColor: "황색 & 갈색", luckyDirection: "중앙" },
  "금": { luckyNumber: 4, luckyColor: "백색 & 금색", luckyDirection: "서쪽" },
  "수": { luckyNumber: 6, luckyColor: "흑색 & 남색", luckyDirection: "북쪽" },
};

/**
 * 부족 오행에 기반한 행운 코드를 반환합니다.
 * @param weakElement  부족 오행 ("목"|"화"|"토"|"금"|"수")
 */
export function getOhengLucky(weakElement: string): OhengLucky {
  return OHENG_MAP[weakElement] ?? OHENG_MAP["토"]; // fallback: 토
}
