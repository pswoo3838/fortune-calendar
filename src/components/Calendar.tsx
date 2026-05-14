import { useState } from "react";
import type { CSSProperties } from "react";
import type { CalendarDayData, CalendarEvent } from "../types/fortune";
import { today as todayStr, tomorrow as tomorrowStr } from "../lib/dateUtils";

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

export function Calendar({
  monthLabel, calendarDays,
  onPrevMonth, onNextMonth, onToday,
  onRequestFortune, onDaySelect, onAddEvent, onEventClick,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todayDate = todayStr();
  const tomorrowDate = tomorrowStr();

  const handleDayClick = (day: CalendarDayData) => {
    if (!day.isCurrentMonth) return;
    setSelectedDate(day.date);
    onDaySelect(day.date);
  };

  const dayNumber = (dateStr: string) => Number.parseInt(dateStr.split("-")[2], 10);

  return (
    <div style={styles.wrapper}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button type="button" onClick={onPrevMonth} style={styles.navButton}>◀</button>
        <button type="button" onClick={onToday} style={styles.monthLabel}>{monthLabel}</button>
        <button type="button" onClick={onNextMonth} style={styles.navButton}>▶</button>
      </div>

      {/* 요일 */}
      <div style={styles.weekdayRow}>
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday}
            style={{
              ...styles.weekdayCell,
              color: index === 0 ? "#F04452" : index === 6 ? "#3182F6" : "#6B7684",
            }}
          >
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
          const hasEvents = day.events.length > 0;

          // 날짜 숫자 색상
          const numColor = day.isToday
            ? "#fff"
            : !day.isCurrentMonth
              ? "#D1D6DB"
              : isHoliday
                ? "#F04452"
                : dow === 6
                  ? "#3182F6"
                  : "#1B1D1F";

          // 셀 배경
          const bgColor = day.isToday
            ? "#6B4EFF"
            : isTomorrow && day.isCurrentMonth
              ? "#EDE9FF"
              : isSelected
                ? "#F4F1FF"
                : "transparent";

          return (
            <button
              type="button"
              key={day.date}
              onClick={() => handleDayClick(day)}
              style={{
                ...styles.dayCell,
                opacity: day.isCurrentMonth ? 1 : 0.3,
                backgroundColor: bgColor,
                border: isSelected && !day.isToday ? "1px solid #6B4EFF" : "1px solid transparent",
                cursor: day.isCurrentMonth ? "pointer" : "default",
              }}
            >
              {/* 날짜 숫자 */}
              <span style={{ ...styles.dayNumber, color: numColor, fontWeight: day.isToday || isTomorrow ? 700 : 500 }}>
                {dayNumber(day.date)}
              </span>

              {/* 음력 */}
              {day.lunarLabel && day.isCurrentMonth && (
                <span style={styles.lunarLabel}>{day.lunarLabel.replace("음 ", "")}</span>
              )}

              {/* 공휴일 이름 (짧게) */}
              {day.holidayName && day.isCurrentMonth && (
                <span style={styles.holidayLabel} title={day.holidayName}>
                  {day.holidayName.length > 3 ? day.holidayName.slice(0, 3) : day.holidayName}
                </span>
              )}

              {/* 손없는 날 */}
              {day.isSonEomneun && !day.holidayName && day.isCurrentMonth && (
                <span style={styles.sonTag}>손✕</span>
              )}

              {/* 일정 도트 (최대 3개) */}
              {hasEvents && day.isCurrentMonth && (
                <div style={styles.eventDotRow}>
                  {day.events.slice(0, 3).map((evt) => (
                    <div key={evt.id} style={{ ...styles.eventDot, backgroundColor: evt.color }} />
                  ))}
                </div>
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
          <span style={{ fontSize: "10px", color: "#F04452", fontWeight: 700 }}>빨간날</span>
          <span style={styles.legendText}>공휴일</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.eventDot, backgroundColor: "#4D96FF" }} />
          <span style={styles.legendText}>일정</span>
        </div>
      </div>

      {/* 선택된 날짜 미니 패널 */}
      {selectedDate && (() => {
        const day = calendarDays.find((d) => d.date === selectedDate);
        if (!day) return null;
        const dayEvents = day.events;
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

            {dayEvents.length === 0 ? (
              <p style={styles.noEvents}>등록된 일정이 없어요</p>
            ) : (
              <div style={styles.miniEventList}>
                {dayEvents.map((evt) => (
                  <button
                    key={evt.id}
                    type="button"
                    style={styles.miniEventItem}
                    onClick={() => onEventClick(evt)}
                  >
                    <div style={{ ...styles.eventColorBar, backgroundColor: evt.color }} />
                    <div style={{ flex: 1 }}>
                      <span style={styles.miniEventTitle}>{evt.title}</span>
                      {evt.startTime && (
                        <span style={styles.miniEventTime}>{evt.startTime}</span>
                      )}
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
  wrapper: { backgroundColor: "#fff", borderRadius: "16px", padding: "16px", margin: "0 16px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
  navButton: { background: "none", border: "none", fontSize: "18px", color: "#6B7684", cursor: "pointer", padding: "8px 12px" },
  monthLabel: { background: "none", border: "none", fontSize: "18px", fontWeight: 700, color: "#1B1D1F", cursor: "pointer" },
  weekdayRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "6px" },
  weekdayCell: { textAlign: "center", fontSize: "12px", fontWeight: 600, padding: "4px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px" },
  dayCell: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "3px 1px", borderRadius: "10px",
    minHeight: "58px", position: "relative", gap: "1px",
  },
  dayNumber: { fontSize: "13px" },
  lunarLabel: { fontSize: "8px", color: "#AEB5BC", lineHeight: 1 },
  holidayLabel: { fontSize: "7px", color: "#F04452", fontWeight: 700, lineHeight: 1, textAlign: "center" },
  sonTag: { fontSize: "7px", fontWeight: 700, color: "#3182F6", backgroundColor: "#F0F7FF", borderRadius: "3px", padding: "1px 2px", lineHeight: 1.2 },
  eventDotRow: { display: "flex", gap: "2px", marginTop: "1px" },
  eventDot: { width: "5px", height: "5px", borderRadius: "50%" },
  legend: { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #F2F4F6" },
  legendItem: { display: "flex", alignItems: "center", gap: "4px" },
  legendText: { fontSize: "11px", color: "#8B95A1" },
  selectedPanel: { marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #F2F4F6" },
  selectedPanelHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" },
  selectedTitle: { fontSize: "15px", fontWeight: 700, color: "#1B1D1F", margin: 0 },
  selectedLunar: { fontSize: "12px", color: "#8B95A1", margin: "2px 0 0" },
  fortuneBtn: { background: "#F4F1FF", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontWeight: 600, color: "#6B4EFF", cursor: "pointer" },
  addEventBtn: { background: "#6B4EFF", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: "#fff", cursor: "pointer" },
  noEvents: { fontSize: "13px", color: "#AEB5BC", textAlign: "center", padding: "10px 0", margin: 0 },
  miniEventList: { display: "flex", flexDirection: "column", gap: "6px" },
  miniEventItem: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left" },
  eventColorBar: { width: "4px", height: "28px", borderRadius: "2px", flexShrink: 0 },
  miniEventTitle: { fontSize: "13px", fontWeight: 600, color: "#1B1D1F", display: "block" },
  miniEventTime: { fontSize: "11px", color: "#8B95A1", marginLeft: "4px" },
  ddayPill: { fontSize: "11px", fontWeight: 700, color: "#6B4EFF", backgroundColor: "#EDE9FF", padding: "2px 6px", borderRadius: "10px" },
};
