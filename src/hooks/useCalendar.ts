import { useState, useMemo, useCallback } from "react";
import type {
  CalendarDayData,
  CalendarEvent,
  MonthlyFortune,
} from "../types/fortune";
import { formatDate, formatMonthKR, getCalendarGrid, today } from "../lib/dateUtils";
import { solarToLunar, isSonEomneunNal } from "../lib/lunar";

interface UseCalendarReturn {
  year: number;
  month: number; // 0-indexed
  monthLabel: string; // "2026년 5월"
  calendarDays: CalendarDayData[];
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
}

/**
 * 캘린더 데이터 빌드 — 음력 날짜 + 손없는 날 + 사용자 일정
 */
function buildCalendarWithLunar(
  year: number,
  month: number,
  events: CalendarEvent[],
): CalendarDayData[] {
  const grid = getCalendarGrid(year, month);
  const todayStr = today();

  return grid.map((date) => {
    const dateStr = formatDate(date);
    const isCurrentMonth = date.getMonth() === month;

    // 음력 정보 (현재 월의 날짜만 계산 — 성능 최적화)
    let lunarLabel: string | undefined;
    let isSonEomneun: boolean | undefined;

    if (isCurrentMonth) {
      try {
        const lunar = solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
        lunarLabel = lunar.label;
        isSonEomneun = isSonEomneunNal(date.getFullYear(), date.getMonth() + 1, date.getDate());
      } catch {
        // 변환 실패 시 무시
      }
    }

    return {
      date: dateStr,
      isCurrentMonth,
      isToday: dateStr === todayStr,
      auspiciousDays: [],
      events: events.filter((e) => e.date === dateStr),
      lunarLabel,
      isSonEomneun,
    };
  });
}

export function useCalendar(
  _monthlyFortune?: MonthlyFortune | null,
  calendarEvents?: CalendarEvent[],
): UseCalendarReturn {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthLabel = useMemo(() => formatMonthKR(year, month), [year, month]);

  const calendarDays = useMemo(() => {
    return buildCalendarWithLunar(year, month, calendarEvents ?? []);
  }, [year, month, calendarEvents]);

  const goToPrevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const todayDate = new Date();
    setYear(todayDate.getFullYear());
    setMonth(todayDate.getMonth());
  }, []);

  return { year, month, monthLabel, calendarDays, goToPrevMonth, goToNextMonth, goToToday };
}
