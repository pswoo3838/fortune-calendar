import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { CalendarEvent, EventCategory } from "../types/fortune";
import { formatDateKR, formatTimeKR, getDdayLabel, isEventOnDate } from "../lib/dateUtils";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../hooks/useCalendarEvents";
import { today } from "../lib/dateUtils";

interface EventListViewProps {
  events: CalendarEvent[];
  year: number;
  month: number; // 0-indexed
  onEventClick: (event: CalendarEvent) => void;
  onAddClick: () => void;
}

const ALL_CATEGORIES: (EventCategory | "all")[] = ["all", "personal", "work", "family", "anniversary", "other"];
const FILTER_LABELS: Record<string, string> = { all: "전체", ...CATEGORY_LABELS };

export function EventListView({ events, year, month, onEventClick, onAddClick }: EventListViewProps) {
  const todayStr = today();
  const [activeFilter, setActiveFilter] = useState<EventCategory | "all">("all");

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grouped = useMemo(() => {
    const result: { date: string; events: CalendarEvent[] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;
      const dayEvents = events.filter((e) => {
        if (!isEventOnDate(e, dateStr)) return false;
        if (activeFilter === "all") return true;
        return e.category === activeFilter;
      });
      if (dayEvents.length > 0) {
        result.push({ date: dateStr, events: dayEvents });
      }
    }
    return result;
  }, [events, year, month, daysInMonth, activeFilter]);

  return (
    <div style={styles.outer}>
      {/* 카테고리 필터 */}
      <div style={styles.filterScroll}>
        <div style={styles.filterRow}>
          {ALL_CATEGORIES.map((cat) => {
            const active = activeFilter === cat;
            const color = cat === "all" ? "#6B4EFF" : CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                type="button"
                id={`filter-${cat}`}
                onClick={() => setActiveFilter(cat)}
                style={{
                  ...styles.filterChip,
                  backgroundColor: active ? color : "#F2F4F6",
                  color: active ? "#fff" : "#6B7684",
                  boxShadow: active ? `0 2px 8px ${color}44` : "none",
                }}
              >
                {FILTER_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 목록 */}
      <div style={styles.container}>
        {grouped.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>📭</p>
            <p style={styles.emptyText}>
              {activeFilter === "all" ? "이번 달 일정이 없어요" : `${FILTER_LABELS[activeFilter]} 일정이 없어요`}
            </p>
            <button type="button" style={styles.addBtn} onClick={onAddClick}>
              + 일정 추가
            </button>
          </div>
        ) : (
          grouped.map(({ date, events: dayEvents }) => {
            const isToday = date === todayStr;
            const isPast = date < todayStr;
            return (
              <div key={date} style={{ ...styles.group, opacity: isPast ? 0.6 : 1 }}>
                {/* 날짜 헤더 */}
                <div style={styles.dateLabel}>
                  <div style={{
                    ...styles.dateBadge,
                    backgroundColor: isToday ? "#6B4EFF" : "transparent",
                    color: isToday ? "#fff" : "#1B1D1F",
                  }}>
                    {new Date(date + "T00:00:00").getDate()}
                  </div>
                  <p style={styles.dateText}>{formatDateKR(date)}</p>
                </div>

                {/* 일정 카드들 */}
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
                          <span style={{ color: CATEGORY_COLORS[evt.category], fontWeight: 700 }}>
                            {CATEGORY_LABELS[evt.category]}
                          </span>
                        </span>
                      </div>
                      <div style={styles.badges}>
                        {evt.isDday && <span style={styles.ddayBadge}>{getDdayLabel(evt.date)}</span>}
                        {evt.repeat && <span style={styles.iconBadge}>🔁</span>}
                        {evt.isLunarRecurring && <span style={styles.iconBadge}>🌙</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  outer: { display: "flex", flexDirection: "column" },
  filterScroll: { overflowX: "auto", padding: "10px 16px 10px", scrollbarWidth: "none" },
  filterRow: { display: "flex", gap: "8px", width: "max-content" },
  filterChip: { padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" },
  container: { padding: "12px 16px 176px" },
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
  eventInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  eventTitle: { fontSize: "14px", fontWeight: 600, color: "#1B1D1F" },
  eventMeta: { fontSize: "12px", color: "#8B95A1" },
  badges: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 },
  ddayBadge: { fontSize: "11px", fontWeight: 700, color: "#6B4EFF", backgroundColor: "#EDE9FF", padding: "3px 8px", borderRadius: "20px" },
  iconBadge: { fontSize: "13px" },
};
