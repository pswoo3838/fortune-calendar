import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { CalendarEvent } from "../types/fortune";
import { formatDateKR, formatTimeKR, getDdayLabel, isEventOnDate, parseDate } from "../lib/dateUtils";
import { CATEGORY_LABELS } from "../hooks/useCalendarEvents";
import { today } from "../lib/dateUtils";

interface EventListViewProps {
  events: CalendarEvent[];
  year: number;
  month: number; // 0-indexed
  onEventClick: (event: CalendarEvent) => void;
  onAddClick: () => void;
}

export function EventListView({ events, year, month, onEventClick, onAddClick }: EventListViewProps) {
  const todayStr = today();

  // 이번 달 모든 날짜 생성
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grouped = useMemo(() => {
    const result: { date: string; events: CalendarEvent[] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;
      const dayEvents = events.filter((e) => isEventOnDate(e, dateStr));
      if (dayEvents.length > 0) {
        result.push({ date: dateStr, events: dayEvents });
      }
    }
    return result;
  }, [events, year, month, daysInMonth]);

  if (grouped.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyIcon}>📭</p>
        <p style={styles.emptyText}>이번 달 일정이 없어요</p>
        <button type="button" style={styles.addBtn} onClick={onAddClick}>
          + 일정 추가
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {grouped.map(({ date, events: dayEvents }) => {
        const isToday = date === todayStr;
        const isPast = date < todayStr;
        return (
          <div key={date} style={styles.group}>
            <div style={{ ...styles.dateLabel, opacity: isPast ? 0.5 : 1 }}>
              <div
                style={{
                  ...styles.dateBadge,
                  backgroundColor: isToday ? "#6B4EFF" : "transparent",
                  color: isToday ? "#fff" : "#1B1D1F",
                }}
              >
                {new Date(date + "T00:00:00").getDate()}
              </div>
              <div>
                <p style={styles.dateText}>{formatDateKR(date)}</p>
              </div>
            </div>
            <div style={styles.eventList}>
              {dayEvents.map((evt) => (
                <button
                  key={`${evt.id}-${date}`}
                  type="button"
                  style={styles.eventItem}
                  onClick={() => onEventClick(evt)}
                >
                  <div style={{ ...styles.colorBar, backgroundColor: evt.color }} />
                  <div style={styles.eventInfo}>
                    <span style={styles.eventTitle}>{evt.title}</span>
                    <span style={styles.eventMeta}>
                      {evt.startTime ? formatTimeKR(evt.startTime) : "종일"}
                      {evt.endTime ? ` — ${formatTimeKR(evt.endTime)}` : ""}
                      {" · "}
                      {CATEGORY_LABELS[evt.category]}
                    </span>
                  </div>
                  {evt.isDday && (
                    <span style={styles.ddayBadge}>{getDdayLabel(evt.date)}</span>
                  )}
                  {evt.repeat && <span style={styles.repeatIcon}>🔁</span>}
                  {evt.isLunarRecurring && <span style={styles.repeatIcon}>🌙</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { padding: "16px 16px 176px" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" },
  emptyIcon: { fontSize: "48px", margin: "0 0 12px" },
  emptyText: { fontSize: "15px", color: "#8B95A1", margin: "0 0 20px" },
  addBtn: { padding: "12px 24px", backgroundColor: "#6B4EFF", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
  group: { marginBottom: "20px" },
  dateLabel: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" },
  dateBadge: { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 700, flexShrink: 0 },
  dateText: { fontSize: "13px", color: "#6B7684", margin: 0 },
  eventList: { display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "48px" },
  eventItem: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", backgroundColor: "#fff", borderRadius: "12px", border: "none", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "left" },
  colorBar: { width: "4px", height: "36px", borderRadius: "2px", flexShrink: 0 },
  eventInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  eventTitle: { fontSize: "14px", fontWeight: 600, color: "#1B1D1F" },
  eventMeta: { fontSize: "12px", color: "#8B95A1" },
  ddayBadge: { fontSize: "12px", fontWeight: 700, color: "#6B4EFF", backgroundColor: "#EDE9FF", padding: "3px 8px", borderRadius: "20px", flexShrink: 0 },
  repeatIcon: { fontSize: "14px", flexShrink: 0 },
};
