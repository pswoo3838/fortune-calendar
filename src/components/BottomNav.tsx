import type { CSSProperties } from "react";
import type { CalendarViewMode } from "../hooks/useCalendar";

interface BottomNavProps {
  current: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
}

const TABS: { mode: CalendarViewMode; icon: string; label: string }[] = [
  { mode: "month", icon: "📅", label: "월간" },
  { mode: "week", icon: "📆", label: "주간" },
  { mode: "list", icon: "📋", label: "목록" },
  { mode: "search", icon: "🔍", label: "검색" },
];

export function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav style={styles.nav}>
      {TABS.map((tab) => {
        const active = current === tab.mode;
        return (
          <button
            key={tab.mode}
            type="button"
            id={`nav-${tab.mode}`}
            style={styles.tab}
            onClick={() => onChange(tab.mode)}
          >
            <span style={{ fontSize: "22px", lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                ...styles.tabLabel,
                color: active ? "#6B4EFF" : "#AEB5BC",
                fontWeight: active ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
            {active && <div style={styles.indicator} />}
          </button>
        );
      })}
    </nav>
  );
}

const styles: Record<string, CSSProperties> = {
  nav: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    height: "72px",
    display: "flex",
    backgroundColor: "#fff",
    borderTop: "1px solid #F2F4F6",
    zIndex: 200,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  tab: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "3px", background: "none", border: "none", cursor: "pointer",
    position: "relative",
  },
  tabLabel: { fontSize: "11px" },
  indicator: {
    position: "absolute", top: 0,
    width: "24px", height: "3px",
    backgroundColor: "#6B4EFF", borderRadius: "0 0 3px 3px",
  },
};
