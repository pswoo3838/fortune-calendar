import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { CalendarEvent } from "../types/fortune";
import { formatDateKR, formatTimeKR, getDdayLabel } from "../lib/dateUtils";
import { CATEGORY_LABELS } from "../hooks/useCalendarEvents";

interface SearchViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function SearchView({ events, onEventClick }: SearchViewProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return events
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.memo?.toLowerCase().includes(q),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, query]);

  return (
    <div style={styles.container}>
      <div style={styles.searchBar}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="일정 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.input}
          autoFocus
        />
        {query && (
          <button type="button" style={styles.clearBtn} onClick={() => setQuery("")}>✕</button>
        )}
      </div>

      {query && results.length === 0 && (
        <div style={styles.noResult}>
          <p style={styles.noResultIcon}>🔎</p>
          <p style={styles.noResultText}>"{query}" 검색 결과가 없어요</p>
        </div>
      )}

      {!query && (
        <div style={styles.placeholder}>
          <p style={styles.placeholderText}>제목이나 메모로 일정을 검색하세요</p>
        </div>
      )}

      <div style={styles.results}>
        {results.map((evt) => (
          <button
            key={evt.id}
            type="button"
            style={styles.item}
            onClick={() => onEventClick(evt)}
          >
            <div style={{ ...styles.colorBar, backgroundColor: evt.color }} />
            <div style={styles.info}>
              <span style={styles.title}>{highlightMatch(evt.title, query)}</span>
              <span style={styles.meta}>
                {formatDateKR(evt.date)}
                {evt.startTime ? ` · ${formatTimeKR(evt.startTime)}` : " · 종일"}
                {" · "}
                {CATEGORY_LABELS[evt.category]}
              </span>
              {evt.memo && (
                <span style={styles.memo}>{highlightMatch(evt.memo, query)}</span>
              )}
            </div>
            {evt.isDday && (
              <span style={styles.ddayBadge}>{getDdayLabel(evt.date)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 검색어 매칭 부분을 강조 (React element 반환) */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ backgroundColor: "#EDE9FF", color: "#6B4EFF", borderRadius: "2px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { padding: "16px 16px 176px" },
  searchBar: {
    display: "flex", alignItems: "center", gap: "10px",
    backgroundColor: "#F2F4F6", borderRadius: "14px",
    padding: "12px 16px", marginBottom: "16px",
  },
  searchIcon: { fontSize: "18px" },
  input: { flex: 1, fontSize: "16px", border: "none", backgroundColor: "transparent", outline: "none", color: "#1B1D1F" },
  clearBtn: { background: "none", border: "none", fontSize: "16px", color: "#AEB5BC", cursor: "pointer", padding: "0" },
  noResult: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" },
  noResultIcon: { fontSize: "40px", margin: "0 0 8px" },
  noResultText: { fontSize: "14px", color: "#8B95A1", margin: 0 },
  placeholder: { display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" },
  placeholderText: { fontSize: "14px", color: "#AEB5BC" },
  results: { display: "flex", flexDirection: "column", gap: "8px" },
  item: { display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", backgroundColor: "#fff", borderRadius: "14px", border: "none", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "left" },
  colorBar: { width: "4px", height: "40px", borderRadius: "2px", flexShrink: 0, marginTop: "2px" },
  info: { flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  title: { fontSize: "15px", fontWeight: 600, color: "#1B1D1F" },
  meta: { fontSize: "12px", color: "#8B95A1" },
  memo: { fontSize: "13px", color: "#6B7684" },
  ddayBadge: { fontSize: "12px", fontWeight: 700, color: "#6B4EFF", backgroundColor: "#EDE9FF", padding: "3px 8px", borderRadius: "20px", flexShrink: 0, marginTop: "2px" },
};
