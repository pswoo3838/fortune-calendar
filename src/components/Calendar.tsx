import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import type { CalendarDayData, CalendarEvent } from "../types/fortune";
import { tomorrow as tomorrowFn } from "../lib/dateUtils";

interface CalendarProps {
  monthLabel: string;
  calendarDays: CalendarDayData[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onRequestFortune: (date: string) => void;
  onDaySelect: (date: string) => void;
  onAddEvent: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const LONG_PRESS_MS = 500;

export function Calendar({
  monthLabel, calendarDays,
  onPrevMonth, onNextMonth, onToday,
  onRequestFortune, onDaySelect, onAddEvent, onEventClick,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const tomorrowDate = tomorrowFn();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDayClick = (day: CalendarDayData) => {
    if (!day.isCurrentMonth) return;
    if (selectedDate === day.date) {
      // 이미 선택된 날 다시 탭 → 선택 해제 (빠른 추가는 롱프레스)
      setSelectedDate(null);
    } else {
      setSelectedDate(day.date);
      onDaySelect(day.date);
    }
  };

  const handleLongPressStart = (day: CalendarDayData) => {
    if (!day.isCurrentMonth) return;
    longPressTimer.current = setTimeout(() => {
      setQuickAddDate(day.date);
      setQuickAddTitle("");
    }, LONG_PRESS_MS);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAddTitle.trim() && quickAddDate) {
      onAddEvent(quickAddDate + "?title=" + encodeURIComponent(quickAddTitle.trim()));
    }
    setQuickAddDate(null);
    setQuickAddTitle("");
  };

  const dayNumber = (dateStr: string) => Number.parseInt(dateStr.split("-")[2], 10);

  return (
    <div style={styles.wrapper}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button type="button" onClick={() => { setSelectedDate(null); onPrevMonth(); }} style={styles.navButton}>◀</button>
        <button type="button" onClick={onToday} style={styles.monthLabel}>{monthLabel}</button>
        <button type="button" onClick={() => { setSelectedDate(null); onNextMonth(); }} style={styles.navButton}>▶</button>
      </div>

      {/* 요일 헤더 */}
      <div style={styles.weekdayRow}>
        {WEEKDAYS.map((weekday, index) => (
          <div key={weekday} style={{
            ...styles.weekdayCell,
            color: index === 0 ? "#F04452" : index === 6 ? "#3182F6" : "#6B7684",
          }}>
            {weekday}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div style={styles.grid}>
        {calendarDays.map((day) => {
          const dow = new Date(day.date + "T00:00:00").getDay();
          const isSelected = selectedDate === day.date;
          const isHoliday = !!day.holidayName || (dow === 0 && day.isCurrentMonth);
          const isTomorrow = day.date === tomorrowDate;
          const visibleEvents = day.events.slice(0, 2);
          const moreCount = day.events.length - 2;

          const numColor = day.isToday
            ? "#fff"
            : !day.isCurrentMonth ? "#D1D6DB"
            : isHoliday ? "#F04452"
            : dow === 6 ? "#3182F6"
            : "#1B1D1F";

          const bgColor = day.isToday
            ? "#6B4EFF"
            : isTomorrow && day.isCurrentMonth ? "#EDE9FF"
            : isSelected ? "#F4F1FF"
            : "transparent";

          return (
            <button
              type="button"
              key={day.date}
              onClick={() => handleDayClick(day)}
              onMouseDown={() => handleLongPressStart(day)}
              onMouseUp={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(day)}
              onTouchEnd={handleLongPressEnd}
              style={{
                ...styles.dayCell,
                opacity: day.isCurrentMonth ? 1 : 0.25,
                border: isSelected && !day.isToday ? "1.5px solid #6B4EFF" : "1.5px solid transparent",
                cursor: day.isCurrentMonth ? "pointer" : "default",
              }}
            >
              {/* 날짜 숫자 */}
              <div style={{ ...styles.dateNumWrap, backgroundColor: bgColor }}>
                <span style={{ ...styles.dayNumber, color: numColor, fontWeight: day.isToday ? 800 : 500 }}>
                  {dayNumber(day.date)}
                </span>
              </div>

              {/* 음력 */}
              {day.lunarLabel && day.isCurrentMonth && (
                <span style={styles.lunarLabel}>{day.lunarLabel.replace("음 ", "")}</span>
              )}

              {/* 공휴일 이름 */}
              {day.holidayName && day.isCurrentMonth && (
                <span style={styles.holidayLabel} title={day.holidayName}>
                  {day.holidayName.length > 4 ? day.holidayName.slice(0, 4) + "…" : day.holidayName}
                </span>
              )}

              {/* 손없는 날 */}
              {day.isSonEomneun && !day.holidayName && day.isCurrentMonth && (
                <span style={styles.sonTag}>손✕</span>
              )}

              {/* 이벤트 바 */}
              {day.isCurrentMonth && visibleEvents.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                  style={{ ...styles.eventBar, backgroundColor: evt.color }}
                  title={evt.title}
                >
                  <span style={styles.eventBarText}>{evt.title}</span>
                </button>
              ))}

              {/* +N개 더 */}
              {moreCount > 0 && day.isCurrentMonth && (
                <span style={styles.moreLabel}>+{moreCount}개</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#6B4EFF" }} />
          <span style={styles.legendText}>오늘</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "#EDE9FF", border: "1px solid #6B4EFF" }} />
          <span style={styles.legendText}>내일</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ fontSize: "10px", color: "#F04452", fontWeight: 700 }}>공휴일</span>
        </div>
        <div style={styles.legendItem}>
          <div style={styles.eventBar}>
            <span style={styles.eventBarText}>일정</span>
          </div>
        </div>
      </div>

      {/* 빠른 일정 추가 인라인 입력 */}
      {quickAddDate && (
        <div style={styles.quickAddOverlay} onClick={() => setQuickAddDate(null)}>
          <form
            style={styles.quickAddBox}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleQuickAddSubmit}
          >
            <p style={styles.quickAddDate}>{quickAddDate.replace(/-/g, ".")} 일정 추가</p>
            <div style={styles.quickAddRow}>
              <input
                autoFocus
                type="text"
                placeholder="일정 제목..."
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                style={styles.quickAddInput}
                maxLength={50}
              />
              <button type="submit" style={styles.quickAddOk} disabled={!quickAddTitle.trim()}>추가</button>
            </div>
            <button
              type="button"
              style={styles.quickAddFull}
              onClick={() => { setQuickAddDate(null); onAddEvent(quickAddDate); }}
            >
              상세 설정으로 추가 →
            </button>
          </form>
        </div>
      )}

      {/* 선택 날짜 패널 */}
      {selectedDate && !quickAddDate && (() => {
        const day = calendarDays.find((d) => d.date === selectedDate);
        if (!day) return null;
        return (
          <div style={styles.selectedPanel}>
            <div style={styles.selectedPanelHeader}>
              <div>
                <p style={styles.selectedTitle}>
                  {Number(selectedDate.split("-")[1])}월 {Number(selectedDate.split("-")[2])}일
                  {day.holidayName ? ` · 🎌 ${day.holidayName}` : ""}
                </p>
                {day.lunarLabel && <p style={styles.selectedLunar}>{day.lunarLabel}</p>}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" style={styles.fortuneBtn} onClick={() => onRequestFortune(selectedDate)}>
                  🔮 운세보기
                </button>
                <button type="button" style={styles.addEventBtn} onClick={() => onAddEvent(selectedDate)}>
                  + 일정
                </button>
              </div>
            </div>

            {day.events.length === 0 ? (
              <p style={styles.noEvents}>등록된 일정이 없어요</p>
            ) : (
              <div style={styles.miniEventList}>
                {day.events.map((evt) => (
                  <button
                    key={evt.id}
                    type="button"
                    style={styles.miniEventItem}
                    onClick={() => onEventClick(evt)}
                  >
                    <div style={{ ...styles.eventColorBar, backgroundColor: evt.color }} />
                    <div style={{ flex: 1 }}>
                      <span style={styles.miniEventTitle}>{evt.title}</span>
                      {evt.startTime && <span style={styles.miniEventTime}> · {evt.startTime}</span>}
                    </div>
                    {evt.isDday && <span style={styles.ddayPill}>D-day</span>}
                    {evt.repeat && <span style={{ fontSize: "12px" }}>🔁</span>}
                    {evt.isLunarRecurring && <span style={{ fontSize: "12px" }}>🌙</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: { backgroundColor: "#fff", borderRadius: "16px", padding: "12px 8px", margin: "0 8px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
  navButton: { background: "none", border: "none", fontSize: "18px", color: "#6B7684", cursor: "pointer", padding: "8px 12px" },
  monthLabel: { background: "none", border: "none", fontSize: "18px", fontWeight: 700, color: "#1B1D1F", cursor: "pointer" },
  weekdayRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px" },
  weekdayCell: { textAlign: "center", fontSize: "12px", fontWeight: 600, padding: "4px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px" },
  dayCell: {
    display: "flex", flexDirection: "column", alignItems: "stretch",
    padding: "2px", borderRadius: "8px",
    minHeight: "80px",             // ← 넓혀서 이벤트 바 표시
    position: "relative",
    background: "none",
    gap: "1px",
  },
  dateNumWrap: {
    width: "26px", height: "26px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "2px auto 1px",
    flexShrink: 0,
  },
  dayNumber: { fontSize: "13px" },
  lunarLabel: { fontSize: "8px", color: "#AEB5BC", textAlign: "center", lineHeight: 1, flexShrink: 0 },
  holidayLabel: { fontSize: "9px", color: "#F04452", fontWeight: 700, textAlign: "center", lineHeight: 1.2, flexShrink: 0 },
  sonTag: { fontSize: "7px", fontWeight: 700, color: "#3182F6", backgroundColor: "#F0F7FF", borderRadius: "3px", padding: "1px 2px", textAlign: "center", flexShrink: 0 },
  // 이벤트 바
  eventBar: {
    width: "100%", borderRadius: "3px",
    backgroundColor: "#6B4EFF",
    border: "none", cursor: "pointer",
    padding: "1px 3px",
    textAlign: "left",
    flexShrink: 0,
    overflow: "hidden",
  },
  eventBarText: { fontSize: "9px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" },
  moreLabel: { fontSize: "8px", color: "#8B95A1", textAlign: "center", paddingTop: "1px" },
  // 범례
  legend: { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #F2F4F6" },
  legendItem: { display: "flex", alignItems: "center", gap: "4px" },
  legendText: { fontSize: "11px", color: "#8B95A1" },
  // 선택 패널
  selectedPanel: { marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #F2F4F6" },
  selectedPanelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" },
  selectedTitle: { fontSize: "15px", fontWeight: 700, color: "#1B1D1F", margin: 0 },
  selectedLunar: { fontSize: "12px", color: "#8B95A1", margin: "2px 0 0" },
  fortuneBtn: { background: "#F4F1FF", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontWeight: 600, color: "#6B4EFF", cursor: "pointer", whiteSpace: "nowrap" },
  addEventBtn: { background: "#6B4EFF", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" },
  noEvents: { fontSize: "12px", color: "#AEB5BC", textAlign: "center", padding: "10px 0", margin: 0 },
  miniEventList: { display: "flex", flexDirection: "column", gap: "6px" },
  miniEventItem: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left" },
  eventColorBar: { width: "4px", height: "28px", borderRadius: "2px", flexShrink: 0 },
  miniEventTitle: { fontSize: "13px", fontWeight: 600, color: "#1B1D1F" },
  miniEventTime: { fontSize: "11px", color: "#8B95A1" },
  ddayPill: { fontSize: "11px", fontWeight: 700, color: "#6B4EFF", backgroundColor: "#EDE9FF", padding: "2px 6px", borderRadius: "10px" },
  // 빠른 일정 추가
  quickAddOverlay: { position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-end" },
  quickAddBox: { width: "100%", backgroundColor: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px" },
  quickAddDate: { fontSize: "13px", color: "#8B95A1", margin: "0 0 10px", fontWeight: 600 },
  quickAddRow: { display: "flex", gap: "8px", marginBottom: "10px" },
  quickAddInput: { flex: 1, fontSize: "16px", padding: "10px 14px", border: "1.5px solid #6B4EFF", borderRadius: "10px", outline: "none" },
  quickAddOk: { padding: "10px 16px", backgroundColor: "#6B4EFF", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  quickAddFull: { width: "100%", padding: "12px", background: "none", border: "1px solid #E5E8EB", borderRadius: "10px", fontSize: "13px", color: "#6B7684", cursor: "pointer" },
};
