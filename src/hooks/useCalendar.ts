import { useState, useMemo, useCallback } from "react";
import type { CalendarDayData, CalendarEvent, MonthlyFortune } from "../types/fortune";
import { formatDate, formatMonthKR, getCalendarGrid, getWeekGrid, today } from "../lib/dateUtils";
import { solarToLunar, isSonEomneunNal } from "../lib/lunar";
import { getHolidayMap } from "../lib/holidays";
import { isEventOnDate } from "../lib/dateUtils";

export type CalendarViewMode = "month" | "week" | "list" | "search";

interface UseCalendarReturn {
  year: number;
  month: number;
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  monthLabel: string;
  calendarDays: CalendarDayData[];
  weekDays: CalendarDayData[];
  weekLabel: string;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  selectedWeekBase: Date;
}

function buildDayData(
  date: Date,
  currentMonth: number, // 현재 표시 중인 달 (0-indexed)
  events: CalendarEvent[],
  holidayMap: Map<string, { name: string }>,
): CalendarDayData {
  const dateStr = formatDate(date);
  const isCurrentMonth = date.getMonth() === currentMonth;
  const todayStr = today();

  let lunarLabel: string | undefined;
  let isSonEomneun: boolean | undefined;

  // ⚠️ 현재 월 셀만 음력 계산 (타 월 셀은 건너뜀 — CPU 절약)
  if (isCurrentMonth) {
    try {
      const lunar = solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
      lunarLabel = lunar.label;
      isSonEomneun = isSonEomneunNal(date.getFullYear(), date.getMonth() + 1, date.getDate());
    } catch {
      // 변환 실패 시 무시
    }
  }

  const holiday = holidayMap.get(dateStr);

  return {
    date: dateStr,
    isCurrentMonth,
    isToday: dateStr === todayStr,
    auspiciousDays: [],
    events: events.filter((e) => isEventOnDate(e, dateStr)),
    lunarLabel,
    isSonEomneun,
    holidayName: holiday?.name,
  };
}

export function useCalendar(
  _monthlyFortune?: MonthlyFortune | null,
  calendarEvents?: CalendarEvent[],
): UseCalendarReturn {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");

  // 주간뷰 기준 날짜 — 연/월/일만 추적 (Date 객체 비교 이슈 방지)
  const [weekBaseStr, setWeekBaseStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const selectedWeekBase = useMemo(() => {
    const [y, m, d] = weekBaseStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [weekBaseStr]);

  const monthLabel = useMemo(() => formatMonthKR(year, month), [year, month]);

  // 공휴일 맵 — year/month가 바뀔 때만 재계산
  const holidayMap = useMemo(() => getHolidayMap(year, month), [year, month]);

  const calendarDays = useMemo(() => {
    const grid = getCalendarGrid(year, month);
    return grid.map((date) => buildDayData(date, month, calendarEvents ?? [], holidayMap));
  }, [year, month, calendarEvents, holidayMap]);

  // 주간뷰 공휴일 맵 — weekBaseStr이 바뀔 때만 재계산
  const weekHolidayMap = useMemo(() => {
    const [y, m] = weekBaseStr.split("-").map(Number);
    return getHolidayMap(y, m - 1);
  }, [weekBaseStr]);

  const weekDays = useMemo(() => {
    const grid = getWeekGrid(selectedWeekBase);
    return grid.map((date) => {
      const wMonth = selectedWeekBase.getMonth();
      return buildDayData(date, wMonth, calendarEvents ?? [], weekHolidayMap);
    });
  }, [selectedWeekBase, calendarEvents, weekHolidayMap]);

  const weekLabel = useMemo(() => {
    const grid = getWeekGrid(selectedWeekBase);
    const start = grid[0];
    const end = grid[6];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 — ${end.getDate()}일`;
    }
    return `${start.getMonth() + 1}월 ${start.getDate()}일 — ${end.getMonth() + 1}월 ${end.getDate()}일`;
  }, [selectedWeekBase]);

  const goToPrevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) { setYear((y) => y - 1); return 11; }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 11) { setYear((y) => y + 1); return 0; }
      return prev + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setWeekBaseStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);

  const goToPrevWeek = useCallback(() => {
    setWeekBaseStr((prev) => {
      const [y, m, d] = prev.split("-").map(Number);
      const dt = new Date(y, m - 1, d - 7);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekBaseStr((prev) => {
      const [y, m, d] = prev.split("-").map(Number);
      const dt = new Date(y, m - 1, d + 7);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    });
  }, []);

  return {
    year, month, viewMode, setViewMode,
    monthLabel, calendarDays,
    weekDays, weekLabel,
    goToPrevMonth, goToNextMonth, goToToday,
    goToPrevWeek, goToNextWeek,
    selectedWeekBase,
  };
}
