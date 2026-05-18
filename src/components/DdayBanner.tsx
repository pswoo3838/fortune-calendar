import type { CSSProperties } from "react";
import type { CalendarEvent } from "../types/fortune";
import { getDdayLabel, getDdayCount, formatDateKR } from "../lib/dateUtils";

interface DdayBannerProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function DdayBanner({ events, onEventClick }: DdayBannerProps) {
  // 미래 D-day만, 날짜 가까운 순 정렬 (최대 3개)
  const upcoming = events
    .filter((e) => getDdayCount(e.date) >= 0)
    .sort((a, b) => getDdayCount(a.date) - getDdayCount(b.date))
    .slice(0, 3);

  const past = events
    .filter((e) => getDdayCount(e.date) < 0)
    .sort((a, b) => getDdayCount(b.date) - getDdayCount(a.date))
    .slice(0, 1);

  const displayed = [...upcoming, ...past].slice(0, 3);

  if (displayed.length === 0) return null;

  return (
    <div style={styles.container}>
      <p style={styles.sectionTitle}>📌 D-day</p>
      <div style={styles.list}>
        {displayed.map((evt) => {
          const count = getDdayCount(evt.date);
          const label = getDdayLabel(evt.date);
          const isToday = count === 0;
          const isPast = count < 0;
          return (
            <button
              key={evt.id}
              type="button"
              style={styles.item}
              onClick={() => onEventClick(evt)}
            >
              <div style={{ ...styles.colorBar, backgroundColor: evt.color }} />
              <div style={styles.info}>
                <span style={styles.eventTitle}>{evt.title}</span>
                <span style={styles.eventDate}>{formatDateKR(evt.date)}</span>
              </div>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: isToday ? "#6B4EFF" : isPast ? "#F2F4F6" : "#EDE9FF",
                  color: isToday ? "#fff" : isPast ? "#AEB5BC" : "#6B4EFF",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { padding: "0 16px 8px" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#8B95A1", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" },
  list: { display: "flex", flexDirection: "column", gap: "6px" },
  item: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    textAlign: "left",
  },
  colorBar: { width: "4px", height: "36px", borderRadius: "2px", flexShrink: 0 },
  info: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  eventTitle: { fontSize: "14px", fontWeight: 600, color: "#1B1D1F" },
  eventDate: { fontSize: "12px", color: "#8B95A1" },
  badge: { padding: "4px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: 700, flexShrink: 0 },
};
