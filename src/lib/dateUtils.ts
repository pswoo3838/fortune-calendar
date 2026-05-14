/**
 * 날짜 유틸리티 (dayjs 없이 순수 JS)
 */

import type { CalendarEvent } from "../types/fortune";

/** "YYYY-MM-DD" 포맷 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘 날짜 문자열 */
export function today(): string {
  return formatDate(new Date());
}

/** 내일 날짜 문자열 */
export function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}

/** 날짜 문자열 → Date 객체 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 날짜에 n일 더하기 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/** 이번 주 일요일~토요일 범위 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return { start: formatDate(sunday), end: formatDate(saturday) };
}

/** 주간 뷰 그리드 (일~토, 7일) */
export function getWeekGrid(baseDate: Date): Date[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(sunday);
    dt.setDate(sunday.getDate() + i);
    return dt;
  });
}

/** 다음 토요일 자정까지 남은 ms */
export function msUntilNextSaturday(): number {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const nextSat = new Date(now);
  nextSat.setDate(now.getDate() + daysUntilSat);
  nextSat.setHours(0, 0, 0, 0);
  return nextSat.getTime() - now.getTime();
}

/** 월 캘린더 그리드 (6주 42칸) */
export function getCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
}

/** 두 날짜 문자열이 같은 날인지 */
export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/** 해당 월의 한국어 표시 */
export function formatMonthKR(year: number, month: number): string {
  return `${year}년 ${month + 1}월`;
}

/** 날짜 비교: a < b */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}

/** 날짜 비교: a > b */
export function isAfter(a: string, b: string): boolean {
  return a > b;
}

/** D-day 계산 (오늘 기준, 양수=미래, 음수=과거) */
export function getDdayCount(targetDate: string): number {
  const todayMs = parseDate(today()).getTime();
  const targetMs = parseDate(targetDate).getTime();
  return Math.round((targetMs - todayMs) / 86400000);
}

/** D-day 텍스트 ("D-3", "D+2", "D-Day") */
export function getDdayLabel(targetDate: string): string {
  const diff = getDdayCount(targetDate);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/** 반복 일정이 특정 날짜에 해당하는지 확인 */
export function isRepeatEventOnDate(event: CalendarEvent, dateStr: string): boolean {
  if (!event.repeat) return false;
  const { type, days, until } = event.repeat;
  if (dateStr < event.date) return false;
  if (until && dateStr > until) return false;
  if (dateStr === event.date) return false;

  const origin = parseDate(event.date);
  const target = parseDate(dateStr);

  switch (type) {
    case "daily":
      return true;
    case "weekly": {
      const targetDow = target.getDay();
      const sourceDow = origin.getDay();
      const activeDays = days?.length ? days : [sourceDow];
      return activeDays.includes(targetDow);
    }
    case "monthly":
      return origin.getDate() === target.getDate();
    case "yearly":
      return (
        origin.getMonth() === target.getMonth() &&
        origin.getDate() === target.getDate()
      );
    default:
      return false;
  }
}

/** 다일 일정이 특정 날짜에 포함되는지 확인 */
export function isMultiDayEventOnDate(event: CalendarEvent, dateStr: string): boolean {
  if (!event.endDate || event.endDate === event.date) return false;
  return dateStr > event.date && dateStr <= event.endDate;
}

/** 일정(반복/다일 포함)이 특정 날짜에 표시되어야 하는지 */
export function isEventOnDate(event: CalendarEvent, dateStr: string): boolean {
  if (event.date === dateStr) return true;
  if (isMultiDayEventOnDate(event, dateStr)) return true;
  if (isRepeatEventOnDate(event, dateStr)) return true;
  return false;
}

/** "HH:MM" → 분 단위 숫자 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 분 단위 → "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 시간 포맷 표시 ("오전 9:00", "오후 2:30") */
export function formatTimeKR(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const hour = h % 12 || 12;
  return `${period} ${hour}:${String(m).padStart(2, "0")}`;
}

/** 날짜를 한국어로 ("5월 15일 (목)") */
export function formatDateKR(dateStr: string): string {
  const d = parseDate(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
