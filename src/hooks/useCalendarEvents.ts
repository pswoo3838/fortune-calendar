import { useState, useCallback, useEffect } from "react";
import type { CalendarEvent, EventCategory, RepeatRule } from "../types/fortune";
import { saveCalendarEvents, loadCalendarEvents } from "../lib/storage";
import { lunarToSolarMultiYear, solarToLunar } from "../lib/lunar";
import { isEventOnDate } from "../lib/dateUtils";

export const EVENT_COLORS = [
  "#FF6B6B", // 빨간
  "#FF9F43", // 주황
  "#FFD93D", // 노랑
  "#6BCB77", // 초록
  "#4D96FF", // 파랑
  "#9B59B6", // 보라
  "#1ABC9C", // 민트
  "#E84393", // 핑크
];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  personal: "개인",
  work: "업무",
  family: "가족",
  anniversary: "기념일",
  other: "기타",
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  personal: "#4D96FF",
  work: "#FF9F43",
  family: "#6BCB77",
  anniversary: "#E84393",
  other: "#9B59B6",
};

const LUNAR_RECURRING_YEARS = 10;

export interface NewEventInput {
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  title: string;
  memo?: string;
  color?: string;
  category?: EventCategory;
  isDday?: boolean;
  repeat?: RepeatRule;
  isLunarRecurring?: boolean;
}

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  addEvent: (input: NewEventInput) => void;
  updateEvent: (id: string, changes: Partial<NewEventInput>) => void;
  removeEvent: (id: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  getDdayEvents: () => CalendarEvent[];
  eventColors: string[];
}

export function useCalendarEvents(): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 스토리지에서 불러오기 + 기존 데이터 마이그레이션
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const stored = await loadCalendarEvents();
      if (!cancelled) {
        // 기존 이벤트에 category 없으면 기본값 부여 (마이그레이션)
        const migrated = stored.map((e) => ({
          ...e,
          category: e.category ?? ("personal" as EventCategory),
        }));
        setEvents(migrated);
        setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((updated: CalendarEvent[]) => {
    void saveCalendarEvents(updated);
  }, []);

  /** 일정 추가 (일반 + 음력반복 통합) */
  const addEvent = useCallback((input: NewEventInput) => {
    const {
      date, endDate, startTime, endTime,
      title, memo, color, category = "personal",
      isDday, repeat, isLunarRecurring,
    } = input;

    const baseColor = color ?? CATEGORY_COLORS[category];

    if (isLunarRecurring) {
      // 음력 반복 일정 처리
      const [y, m, d] = date.split("-").map(Number);
      const lunar = solarToLunar(y, m, d);
      const parentId = `lunar-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const currentYear = new Date().getFullYear();
      const solarDates = lunarToSolarMultiYear(
        lunar.month, lunar.day, currentYear, LUNAR_RECURRING_YEARS, lunar.isLeapMonth,
      );

      const newEvents: CalendarEvent[] = solarDates.map((sd) => ({
        id: `${parentId}-${sd.solarYear}`,
        date: sd.solarDateStr,
        title: `${title} (음 ${lunar.month}.${lunar.day})`,
        memo,
        color: baseColor,
        category,
        isDday,
        createdAt: new Date().toISOString(),
        isLunarRecurring: true,
        lunarMonth: lunar.month,
        lunarDay: lunar.day,
        lunarParentId: parentId,
      }));

      setEvents((prev) => {
        const updated = [...prev, ...newEvents];
        persist(updated);
        return updated;
      });
      return;
    }

    const newEvent: CalendarEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      date,
      endDate: endDate && endDate !== date ? endDate : undefined,
      startTime,
      endTime,
      title,
      memo,
      color: baseColor,
      category,
      isDday,
      repeat,
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => {
      const updated = [...prev, newEvent];
      persist(updated);
      return updated;
    });
  }, [persist]);

  /** 일정 수정 */
  const updateEvent = useCallback((id: string, changes: Partial<NewEventInput>) => {
    setEvents((prev) => {
      const updated = prev.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          ...changes,
          color: changes.color ?? (changes.category ? CATEGORY_COLORS[changes.category] : e.color),
          updatedAt: new Date().toISOString(),
        };
      });
      persist(updated);
      return updated;
    });
  }, [persist]);

  /** 일정 삭제 (음력 반복이면 같은 parentId 전체 삭제) */
  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const target = prev.find((e) => e.id === id);
      const updated = target?.lunarParentId
        ? prev.filter((e) => e.lunarParentId !== target.lunarParentId)
        : prev.filter((e) => e.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  /** 특정 날짜의 일정 반환 (반복/다일 포함) */
  const getEventsForDate = useCallback(
    (date: string) => events.filter((e) => isEventOnDate(e, date)),
    [events],
  );

  /** D-day 지정 일정 목록 */
  const getDdayEvents = useCallback(
    () => events.filter((e) => e.isDday && !e.isLunarRecurring),
    [events],
  );

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    removeEvent,
    getEventsForDate,
    getDdayEvents,
    eventColors: EVENT_COLORS,
  };
}
