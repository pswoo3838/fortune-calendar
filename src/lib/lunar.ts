/**
 * 음력 ↔ 양력 변환 유틸리티
 * korean-lunar-calendar 라이브러리 기반
 */
import KoreanLunarCalendar from "korean-lunar-calendar";

export interface LunarDate {
  year: number;
  month: number; // 1-indexed
  day: number;
  isLeapMonth: boolean;
  label: string; // "음 4.18" 형식
}

/**
 * 양력 → 음력 변환
 */
export function solarToLunar(year: number, month: number, day: number): LunarDate {
  const cal = new KoreanLunarCalendar();
  cal.setSolarDate(year, month, day); // month: 1-indexed
  const lunar = cal.getLunarCalendar();

  return {
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isLeapMonth: lunar.intercalation ?? false,
    label: `음 ${lunar.month}.${lunar.day}`,
  };
}

/**
 * 음력 → 양력 변환
 */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth = false,
): { year: number; month: number; day: number } | null {
  try {
    const cal = new KoreanLunarCalendar();
    cal.setLunarDate(year, month, day, isLeapMonth);
    const solar = cal.getSolarCalendar();
    return { year: solar.year, month: solar.month, day: solar.day };
  } catch {
    return null;
  }
}

/**
 * 음력 날짜를 여러 해 동안의 양력 날짜로 변환
 * (제사 등 매년 반복되는 음력 일정용)
 */
export function lunarToSolarMultiYear(
  lunarMonth: number,
  lunarDay: number,
  startYear: number,
  yearsCount: number,
  isLeapMonth = false,
): { solarYear: number; solarMonth: number; solarDay: number; solarDateStr: string }[] {
  const results: { solarYear: number; solarMonth: number; solarDay: number; solarDateStr: string }[] = [];

  for (let i = 0; i < yearsCount; i++) {
    const targetYear = startYear + i;
    const solar = lunarToSolar(targetYear, lunarMonth, lunarDay, isLeapMonth);
    if (solar) {
      const dateStr = `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}`;
      results.push({
        solarYear: solar.year,
        solarMonth: solar.month,
        solarDay: solar.day,
        solarDateStr: dateStr,
      });
    }
  }

  return results;
}

/**
 * 손없는 날 계산 (음력 기반)
 *
 * 손없는 날은 음력 날짜의 끝자리 기준:
 * - 음력 끝자리 1, 2: 동쪽 (이사, 이전에 좋음)
 * - 음력 끝자리 3, 4: 남쪽
 * - 음력 끝자리 5, 6: 서쪽
 * - 음력 끝자리 7, 8: 북쪽
 * - 음력 끝자리 9, 0: 손없는 날 (모든 방향 안전)
 */
export function isSonEomneunNal(solarYear: number, solarMonth: number, solarDay: number): boolean {
  const lunar = solarToLunar(solarYear, solarMonth, solarDay);
  const lastDigit = lunar.day % 10;
  return lastDigit === 9 || lastDigit === 0;
}

/**
 * 해당 양력 월에서 손없는 날 목록 (양력 날짜 반환)
 */
export function getSonEomneunDaysInMonth(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate(); // month: 1-indexed
  const result: number[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    if (isSonEomneunNal(year, month, d)) {
      result.push(d);
    }
  }

  return result;
}

/**
 * 해당 양력 월의 각 날짜에 대한 음력 정보 맵
 */
export function getLunarInfoForMonth(year: number, month: number): Map<number, LunarDate> {
  const daysInMonth = new Date(year, month, 0).getDate(); // month: 1-indexed
  const map = new Map<number, LunarDate>();

  for (let d = 1; d <= daysInMonth; d++) {
    map.set(d, solarToLunar(year, month, d));
  }

  return map;
}
