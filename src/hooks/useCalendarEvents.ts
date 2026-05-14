import { useState, useCallback, useEffect } from "react";
import type { CalendarEvent } from "../types/fortune";
import { saveCalendarEvents, loadCalendarEvents } from "../lib/storage";
import { lunarToSolarMultiYear, solarToLunar } from "../lib/lunar";

const EVENT_COLORS = [
  "#FF6B6B", // 빨간
  "#FF9F43", // 주황
  "#FFD93D", // 노랑
  "#6BCB77", // 초록
  "#4D96FF", // 파랑
  "#9B59B6", // 보라
  "#1ABC9C", // 민트
  "#E84393", // 핑크
];

const LUNAR_RECURRING_YEARS = 10; // 음력 반복 일정 생성 기간

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  addEvent: (date: string, title: string, memo?: string, color?: string) => void;
  addLunarRecurringEvent: (
    date: string,
    title: string,
    memo?: string,
    color?: string,
  ) => void;
  removeEvent: (id: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  eventColors: string[];
}

export function useCalendarEvents(): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const stored = await loadCalendarEvents();
      if (!cancelled) {
        setEvents(stored);
        setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  /** 일반 일정 추가 */
  const addEvent = useCallback((date: string, title: string, memo?: string, color?: string) => {
    const newEvent: CalendarEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date,
      title,
      memo,
      color: color ?? EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)],
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => {
      const updated = [...prev, newEvent];
      void saveCalendarEvents(updated);
      return updated;
    });
  }, []);

  /**
   * 음력 반복 일정 추가 (제사 등)
   * 선택한 날짜의 음력 날짜를 기준으로 향후 10년간 양력 날짜를 자동 생성
   */
  const addLunarRecurringEvent = useCallback(
    (date: string, title: string, memo?: string, color?: string) => {
      const [y, m, d] = date.split("-").map(Number);
      const lunar = solarToLunar(y, m, d);
      const parentId = `lunar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const eventColor = color ?? EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)];

      // 향후 N년간 양력 날짜 계산
      const currentYear = new Date().getFullYear();
      const solarDates = lunarToSolarMultiYear(
        lunar.month,
        lunar.day,
        currentYear,
        LUNAR_RECURRING_YEARS,
        lunar.isLeapMonth,
      );

      const newEvents: CalendarEvent[] = solarDates.map((sd) => ({
        id: `${parentId}-${sd.solarYear}`,
        date: sd.solarDateStr,
        title: `${title} (음 ${lunar.month}.${lunar.day})`,
        memo,
        color: eventColor,
        createdAt: new Date().toISOString(),
        isLunarRecurring: true,
        lunarMonth: lunar.month,
        lunarDay: lunar.day,
        lunarParentId: parentId,
      }));

      setEvents((prev) => {
        const updated = [...prev, ...newEvents];
        void saveCalendarEvents(updated);
        return updated;
      });
    },
    [],
  );

  /** 일정 삭제 (음력 반복인 경우 같은 parentId의 모든 일정도 삭제) */
  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const target = prev.find((e) => e.id === id);
      let updated: CalendarEvent[];

      if (target?.lunarParentId) {
        // 음력 반복 일정 → 같은 parentId 전체 삭제
        updated = prev.filter((e) => e.lunarParentId !== target.lunarParentId);
      } else {
        updated = prev.filter((e) => e.id !== id);
      }

      void saveCalendarEvents(updated);
      return updated;
    });
  }, []);

  const getEventsForDate = useCallback(
    (date: string) => events.filter((e) => e.date === date),
    [events],
  );

  return {
    events,
    isLoading,
    addEvent,
    addLunarRecurringEvent,
    removeEvent,
    getEventsForDate,
    eventColors: EVENT_COLORS,
  };
}
