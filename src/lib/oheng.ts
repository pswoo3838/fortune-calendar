/**
 * oheng.ts — 오행(五行) 및 연/월 시드 기반 행운 속성 결정 매핑
 *
 * 부족 오행과 조회 연도/월(year, month)을 조합하여,
 * 매달 다른 행운의 색상, 방향, 숫자, 아이템이 결정론적으로 연산되도록 합니다.
 */

export interface OhengLuckyResult {
  luckyColor: string;
  luckyDirection: string;
  luckyNumber: number;
  luckyItem: string;
}

const OHENG_DATA: Record<string, {
  colors: string[];
  directions: string[];
  numbers: number[];
  items: string[];
}> = {
  "목": {
    colors: ["초록색 & 연두색", "올리브 그린 & 카키", "민트색 & 에메랄드", "포레스트 그린 & 베이지"],
    directions: ["동쪽 (East)", "동남쪽 (South-East)", "북동쪽 (North-East)"],
    numbers: [3, 8, 38, 13, 28],
    items: ["소형 반려식물", "나무 재질의 북마크", "그린 계열 에코백", "허브 티백", "원목 컵받침(코스터)", "종이 다이어리"],
  },
  "화": {
    colors: ["빨간색 & 주황색", "코랄 & 베이비 핑크", "와인 레드 & 로즈골드", "다홍색 & 옐로우"],
    directions: ["남쪽 (South)", "동남쪽 (South-East)", "남서쪽 (South-West)"],
    numbers: [2, 7, 27, 17, 22],
    items: ["은은한 시트러스 디퓨저", "아로마 향초", "붉은색 가죽 카드홀더", "조명 스탠드", "화려한 스마트폰 케이스"],
  },
  "토": {
    colors: ["황토색 & 베이지", "골드 & 브라운", "옐로우 & 크림화이트", "머스타드 & 카멜"],
    directions: ["중앙 (Center)", "남서쪽 (South-West)", "북동쪽 (North-East)"],
    numbers: [5, 10, 50, 15, 25],
    items: ["도자기 머그컵", "황토 찜질 팩", "가죽 재질 머니클립", "천연 원석 액세서리", "베이지 톤 장우산"],
  },
  "금": {
    colors: ["흰색 & 실버", "라이트 그레이 & 메탈릭", "플래티넘 & 차콜", "실버 & 투명 화이트"],
    directions: ["서쪽 (West)", "남서쪽 (South-West)", "북서쪽 (North-West)"],
    numbers: [4, 9, 49, 19, 29],
    items: ["메탈 프레임 안경", "은제 반지 또는 팔찌", "스테인리스 텀블러", "스마트 워치 메탈 스트랩", "손거울"],
  },
  "수": {
    colors: ["검은색 & 네이비", "다크 블루 & 실버 블루", "인디고 & 미드나잇 블루", "블랙 & 메탈릭 그레이"],
    directions: ["북쪽 (North)", "북동쪽 (North-East)", "북서쪽 (North-West)"],
    numbers: [1, 6, 16, 26, 36],
    items: ["우디향 핸드크림", "네이비 컬러 손수건", "가죽 만년필", "스마트폰 방수 팩", "푸른 빛 머그컵"],
  },
};

// 기본 오행 매핑 폴백 데이터 (오행 데이터 누락 시)
const DEFAULT_LUCKY = {
  colors: ["보라색 & 골드", "자주색 & 실버", "라벤더 & 브론즈"],
  directions: ["동남쪽 (South-East)", "북서쪽 (North-West)"],
  numbers: [8, 18, 28],
  items: ["가죽 다이어리", "고급 볼펜", "미니 가습기"],
};

/**
 * 부족 오행 및 연/월 정보를 기반으로 결정론적으로 매달 다른 행운의 요소들을 조합해 반환합니다.
 */
export function getOhengLucky(
  weakElement: string,
  year: number,
  month: number
): OhengLuckyResult {
  const data = OHENG_DATA[weakElement] || DEFAULT_LUCKY;

  // 연/월 정보와 오행 글자의 유니코드 값을 이용해 시드 성격의 인덱스 생성
  const seed = year * 12 + month + (weakElement ? weakElement.charCodeAt(0) : 7);

  const colorIdx = seed % data.colors.length;
  const dirIdx = (seed + 2) % data.directions.length;
  const numIdx = (seed + 5) % data.numbers.length;
  const itemIdx = (seed + 9) % data.items.length;

  return {
    luckyColor: data.colors[colorIdx],
    luckyDirection: data.directions[dirIdx],
    luckyNumber: data.numbers[numIdx],
    luckyItem: data.items[itemIdx],
  };
}
