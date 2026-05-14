import type { Zodiac } from "../types/fortune";

const ZODIAC_ANIMALS: Zodiac[] = [
  "원숭이",
  "닭",
  "개",
  "돼지",
  "쥐",
  "소",
  "호랑이",
  "토끼",
  "용",
  "뱀",
  "말",
  "양",
];

const ZODIAC_EMOJI: Record<Zodiac, string> = {
  쥐: "🐭",
  소: "🐮",
  호랑이: "🐯",
  토끼: "🐰",
  용: "🐲",
  뱀: "🐍",
  말: "🐴",
  양: "🐏",
  원숭이: "🐵",
  닭: "🐔",
  개: "🐶",
  돼지: "🐷",
};

/**
 * 출생연도 기반 띠 계산
 * (year % 12) 인덱스로 ZODIAC_ANIMALS 매핑
 */
export function getZodiacFromYear(year: number): Zodiac {
  return ZODIAC_ANIMALS[year % 12];
}

export function getZodiacFromBirthDate(birthDate: string): Zodiac {
  const year = new Date(birthDate).getFullYear();
  return getZodiacFromYear(year);
}

export function getZodiacEmoji(zodiac: Zodiac): string {
  return ZODIAC_EMOJI[zodiac];
}

export { ZODIAC_ANIMALS, ZODIAC_EMOJI };
