/**
 * 날짜 유틸리티 (dayjs 없이 순수 JS)
 */

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

/** 이번 주 일요일~토요일 범위 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0=일 ~ 6=토
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return { start: formatDate(sunday), end: formatDate(saturday) };
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

  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    grid.push(d);
  }
  return grid;
}

/** 두 날짜 문자열이 같은 날인지 */
export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/** 날짜 문자열 → Date 객체 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 해당 월의 한국어 표시 */
export function formatMonthKR(year: number, month: number): string {
  return `${year}년 ${month + 1}월`;
}
