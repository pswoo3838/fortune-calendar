import type { CSSProperties } from "react";
import type { CalendarViewMode } from "../hooks/useCalendar";

interface BottomNavProps {
  current: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
}

const TABS: { mode: CalendarViewMode; label: string }[] = [
  { mode: "month", label: "월간" },
  { mode: "week", label: "주간" },
  { mode: "list", label: "목록" },
  { mode: "search", label: "검색" },
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
            <span
              style={{
                ...styles.tabLabel,
                color: active ? "#6B4EFF" : "#AEB5BC",
                fontWeight: active ? 700 : 500,
                fontSize: active ? "15px" : "14px",
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
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: "480px",
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
  tabLabel: { fontSize: "14px" },
  indicator: {
    position: "absolute", top: 0,
    width: "24px", height: "3px",
    backgroundColor: "#6B4EFF", borderRadius: "0 0 3px 3px",
  },
};
