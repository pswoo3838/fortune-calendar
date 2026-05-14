/**
 * 한국 공휴일 데이터
 * 고정 공휴일 + 음력 기반 공휴일 (설날/추석 연휴 포함)
 * 대체공휴일 규칙 적용
 */

import { lunarToSolarMultiYear } from "./lunar";

export interface Holiday {
  date: string; // "YYYY-MM-DD"
  name: string;
  isSubstitute?: boolean;
}

// ─────────────────────────────────────────
// 고정 공휴일 (양력)
// ─────────────────────────────────────────
const FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "새해" },
  { month: 3, day: 1, name: "삼일절" },
  { month: 5, day: 5, name: "어린이날" },
  { month: 6, day: 6, name: "현충일" },
  { month: 8, day: 15, name: "광복절" },
  { month: 10, day: 3, name: "개천절" },
  { month: 10, day: 9, name: "한글날" },
  { month: 12, day: 25, name: "성탄절" },
];

// ─────────────────────────────────────────
// 날짜 헬퍼
// ─────────────────────────────────────────
function dateAdd(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

// ─────────────────────────────────────────
// 음력 기반 공휴일 (설날·부처님오신날·추석)
// ─────────────────────────────────────────
interface LunarHolidayDef {
  lunarMonth: number;
  lunarDay: number;
  offsets: number[];
  names: string[];
}

const LUNAR_HOLIDAY_DEFS: LunarHolidayDef[] = [
  { lunarMonth: 1, lunarDay: 1, offsets: [-1, 0, 1], names: ["설날 연휴", "설날", "설날 연휴"] },
  { lunarMonth: 4, lunarDay: 8, offsets: [0], names: ["부처님오신날"] },
  { lunarMonth: 8, lunarDay: 15, offsets: [-1, 0, 1], names: ["추석 연휴", "추석", "추석 연휴"] },
];

function getLunarHolidaysForYear(year: number): Holiday[] {
  const result: Holiday[] = [];
  for (const def of LUNAR_HOLIDAY_DEFS) {
    try {
      const solarDates = lunarToSolarMultiYear(def.lunarMonth, def.lunarDay, year, 1);
      if (solarDates.length === 0) continue;
      const baseDate = solarDates[0].solarDateStr;
      for (let i = 0; i < def.offsets.length; i++) {
        const dateStr = dateAdd(baseDate, def.offsets[i]);
        if (!dateStr.startsWith(String(year))) continue;
        result.push({ date: dateStr, name: def.names[i] });
      }
    } catch {
      // 음력 변환 실패 시 무시
    }
  }
  return result;
}

// ─────────────────────────────────────────
// 대체공휴일 (최대 7일만 탐색 — 무한루프 방지)
// ─────────────────────────────────────────
function findSubstituteDate(baseDate: string, occupied: Set<string>): string | null {
  const dow = dayOfWeek(baseDate);
  if (dow !== 0 && dow !== 6) return null; // 평일이면 대체 없음

  let candidate = dateAdd(baseDate, 1);
  let safetyCount = 0;
  while (safetyCount < 14) { // 최대 14일 탐색
    const cdow = dayOfWeek(candidate);
    if (cdow !== 0 && cdow !== 6 && !occupied.has(candidate)) {
      return candidate;
    }
    candidate = dateAdd(candidate, 1);
    safetyCount++;
  }
  return null;
}

// ─────────────────────────────────────────
// 연도별 공휴일 캐시
// ─────────────────────────────────────────
const holidayCache = new Map<number, Holiday[]>();

export function getHolidaysForYear(year: number): Holiday[] {
  if (holidayCache.has(year)) return holidayCache.get(year)!;

  const holidays: Holiday[] = [];

  // 1. 고정 공휴일
  for (const fh of FIXED_HOLIDAYS) {
    const mm = String(fh.month).padStart(2, "0");
    const dd = String(fh.day).padStart(2, "0");
    holidays.push({ date: `${year}-${mm}-${dd}`, name: fh.name });
  }

  // 2. 음력 기반 공휴일
  holidays.push(...getLunarHolidaysForYear(year));

  // 3. 대체공휴일
  const occupied = new Set(holidays.map((h) => h.date));
  const substitutes: Holiday[] = [];

  for (const h of holidays) {
    const sub = findSubstituteDate(h.date, occupied);
    if (sub) {
      substitutes.push({ date: sub, name: `${h.name} 대체공휴일`, isSubstitute: true });
      occupied.add(sub);
    }
  }

  holidays.push(...substitutes);

  // 정렬 + 중복 제거
  const seen = new Set<string>();
  const result = holidays
    .filter((h) => {
      if (seen.has(h.date)) return false;
      seen.add(h.date);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  holidayCache.set(year, result);
  return result;
}

/** 연/월에 해당하는 공휴일 맵 반환 (해당 월만) */
export function getHolidayMap(year: number, month: number): Map<string, Holiday> {
  const map = new Map<string, Holiday>();

  // 해당 연도 + 인접 연도만 (달력 경계 대응)
  const yearsToCheck = new Set<number>();
  yearsToCheck.add(year);
  if (month === 0) yearsToCheck.add(year - 1);
  if (month === 11) yearsToCheck.add(year + 1);

  for (const y of yearsToCheck) {
    for (const h of getHolidaysForYear(y)) {
      // 달력에 표시되는 날짜 범위만 (해당 월 ± 6일)
      const hYear = Number(h.date.slice(0, 4));
      const hMonth = Number(h.date.slice(5, 7)) - 1;
      const monthDiff = (hYear - year) * 12 + (hMonth - month);
      if (monthDiff >= -1 && monthDiff <= 1) {
        map.set(h.date, h);
      }
    }
  }

  return map;
}
