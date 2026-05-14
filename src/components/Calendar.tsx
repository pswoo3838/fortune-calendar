import { useState } from "react";
import type { CSSProperties } from "react";
import type { CalendarDayData } from "../types/fortune";
import { today as todayStr, tomorrow as tomorrowStr } from "../lib/dateUtils";

interface CalendarProps {
  monthLabel: string;
  calendarDays: CalendarDayData[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  /** 오늘/내일 클릭 시 바로 운세 요청 */
  onRequestFortune: (date: string) => void;
  /** 일반 일정 추가 */
  onAddEvent: (date: string, title: string, memo?: string, color?: string) => void;
  /** 음력 반복 일정 추가 */
  onAddLunarRecurringEvent: (date: string, title: string, memo?: string, color?: string) => void;
  onRemoveEvent: (id: string) => void;
  eventColors: string[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function Calendar({
  monthLabel,
  calendarDays,
  onPrevMonth,
  onNextMonth,
  onToday,
  onRequestFortune,
  onAddEvent,
  onAddLunarRecurringEvent,
  onRemoveEvent,
  eventColors,
}: CalendarProps) {
  const dayNumber = (dateStr: string) => Number.parseInt(dateStr.split("-")[2], 10);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventMemo, setNewEventMemo] = useState("");
  const [newEventColor, setNewEventColor] = useState(eventColors[0]);
  const [isLunarRecurring, setIsLunarRecurring] = useState(false);

  const selectedDayData = calendarDays.find((d) => d.date === selectedDate);
  const selectedEvents = selectedDayData?.events ?? [];

  const todayDate = todayStr();
  const tomorrowDate = tomorrowStr();

  const handleDayClick = (date: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;

    setSelectedDate(date);
    setShowAddEvent(false);
  };

  const handleAddEventSubmit = () => {
    if (!selectedDate || !newEventTitle.trim()) return;

    if (isLunarRecurring) {
      onAddLunarRecurringEvent(
        selectedDate,
        newEventTitle.trim(),
        newEventMemo.trim() || undefined,
        newEventColor,
      );
    } else {
      onAddEvent(
        selectedDate,
        newEventTitle.trim(),
        newEventMemo.trim() || undefined,
        newEventColor,
      );
    }

    setNewEventTitle("");
    setNewEventMemo("");
    setIsLunarRecurring(false);
    setShowAddEvent(false);
  };

  const formatSelectedDate = (date: string) => {
    const parts = date.split("-");
    return `${Number.parseInt(parts[1], 10)}월 ${Number.parseInt(parts[2], 10)}일`;
  };

  return (
    <div style={styles.wrapper}>
      {/* 달력 헤더 */}
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
          const hasEvents = day.events.length > 0;
          const isSelected = selectedDate === day.date;
          const isTodayOrTomorrow = day.date === todayDate || day.date === tomorrowDate;

          return (
            <button
              type="button"
              key={day.date}
              onClick={() => handleDayClick(day.date, day.isCurrentMonth)}
              style={{
                ...styles.dayCell,
                opacity: day.isCurrentMonth ? 1 : 0.25,
                backgroundColor: day.isToday
                  ? "#6B4EFF"
                  : day.date === tomorrowDate && day.isCurrentMonth
                    ? "#EDE9FF"
                    : isSelected
                      ? "#F4F1FF"
                      : "transparent",
                border: isSelected && !day.isToday
                  ? "1px solid #6B4EFF"
                  : "1px solid transparent",
                cursor: day.isCurrentMonth ? "pointer" : "default",
              }}
            >
              {/* 날짜 숫자 */}
              <span
                style={{
                  ...styles.dayNumber,
                  color: day.isToday
                    ? "#FFFFFF"
                    : !day.isCurrentMonth
                      ? "#AEB5BC"
                      : undefined,
                  fontWeight: isTodayOrTomorrow ? 700 : 500,
                }}
              >
                {dayNumber(day.date)}
              </span>

              {/* 음력 날짜 */}
              {day.lunarLabel && day.isCurrentMonth && (
                <span style={styles.lunarLabel}>{day.lunarLabel.replace("음 ", "")}</span>
              )}

              {/* 손없는 날 표시 */}
              {day.isSonEomneun && day.isCurrentMonth && (
                <span style={styles.sonTag}>손✕</span>
              )}

              {/* 일정 도트 */}
              {hasEvents && day.isCurrentMonth && (
                <div style={styles.eventDotRow}>
                  {day.events.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      style={{ ...styles.eventDot, backgroundColor: evt.color }}
                    />
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
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#6B4EFF" }} />
          <span style={styles.legendText}>오늘</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: "#EDE9FF" }} />
          <span style={styles.legendText}>내일</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.sonTag, fontSize: "9px" }}>손✕</span>
          <span style={styles.legendText}>손없는 날</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.eventDot, backgroundColor: "#4D96FF", width: 8, height: 8 }} />
          <span style={styles.legendText}>일정</span>
        </div>
      </div>

      {/* 오늘/내일 안내 */}
      <div style={styles.todayHint}>
        <span style={styles.hintIcon}>💡</span>
        <span style={styles.hintText}>오늘 또는 내일 날짜를 눌러 운세를 확인하세요</span>
      </div>

      {/* 선택된 날짜 상세 (오늘/내일 외) */}
      {selectedDate && (
        <div style={styles.selectedDateSection}>
          <div style={styles.selectedDateHeader}>
            <div>
              <h3 style={styles.selectedDateTitle}>{formatSelectedDate(selectedDate)}</h3>
              {selectedDayData?.lunarLabel && (
                <p style={styles.selectedLunar}>{selectedDayData.lunarLabel}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddEvent(true);
                setNewEventColor(eventColors[Math.floor(Math.random() * eventColors.length)]);
              }}
              style={styles.addEventButton}
            >
              + 일정 추가
            </button>
          </div>

          {/* 일정 목록 */}
          {selectedEvents.length === 0 && !showAddEvent && (
            <p style={styles.noEvents}>등록된 일정이 없어요</p>
          )}
          {selectedEvents.map((evt) => (
            <div key={evt.id} style={styles.eventItem}>
              <div style={{ ...styles.eventColorBar, backgroundColor: evt.color }} />
              <div style={styles.eventInfo}>
                <span style={styles.eventTitle}>{evt.title}</span>
                {evt.memo && <span style={styles.eventMemo}>{evt.memo}</span>}
                {evt.isLunarRecurring && (
                  <span style={styles.lunarBadge}>🌙 음력 반복</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveEvent(evt.id)}
                style={styles.removeEventButton}
                title={evt.isLunarRecurring ? "반복 일정 전체 삭제" : "삭제"}
              >
                ✕
              </button>
            </div>
          ))}

          {/* 일정 추가 폼 */}
          {showAddEvent && (
            <div style={styles.addEventForm}>
              <input
                type="text"
                placeholder="일정 제목"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                style={styles.eventInput}
                maxLength={30}
              />
              <input
                type="text"
                placeholder="메모 (선택)"
                value={newEventMemo}
                onChange={(e) => setNewEventMemo(e.target.value)}
                style={styles.eventInput}
                maxLength={100}
              />

              {/* 음력 반복 체크박스 */}
              <label style={styles.lunarCheckRow}>
                <input
                  type="checkbox"
                  checked={isLunarRecurring}
                  onChange={(e) => setIsLunarRecurring(e.target.checked)}
                  style={styles.lunarCheckbox}
                />
                <span style={styles.lunarCheckLabel}>
                  🌙 음력 기준 매년 반복 (제사, 기일 등)
                </span>
              </label>
              {isLunarRecurring && selectedDayData?.lunarLabel && (
                <p style={styles.lunarRecurringHint}>
                  이 날짜의 음력은 <strong>{selectedDayData.lunarLabel}</strong>입니다.
                  <br />향후 10년간 자동 등록됩니다.
                </p>
              )}

              {/* 색상 선택 */}
              <div style={styles.colorPickerRow}>
                {eventColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewEventColor(c)}
                    style={{
                      ...styles.colorPickerDot,
                      backgroundColor: c,
                      border: c === newEventColor ? "2px solid #1B1D1F" : "2px solid transparent",
                      transform: c === newEventColor ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              <div style={styles.addEventActions}>
                <button
                  type="button"
                  onClick={() => { setShowAddEvent(false); setIsLunarRecurring(false); }}
                  style={styles.cancelButton}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleAddEventSubmit}
                  style={{ ...styles.saveButton, opacity: newEventTitle.trim() ? 1 : 0.5 }}
                  disabled={!newEventTitle.trim()}
                >
                  저장
                </button>
              </div>
            </div>
          )}

          {/* 이 날의 운세 보기 */}
          <button
            type="button"
            onClick={() => onRequestFortune(selectedDate)}
            style={styles.fortuneButton}
          >
            🔮 {selectedDate === todayDate ? "오늘의 운세 보기" : selectedDate === tomorrowDate ? "내일의 운세 보기" : "이 날의 운세 보기"}
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "16px",
    margin: "0 16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  navButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "#6B7684",
    cursor: "pointer",
    padding: "8px 12px",
  },
  monthLabel: {
    background: "none",
    border: "none",
    fontSize: "18px",
    fontWeight: 700,
    color: "#1B1D1F",
    cursor: "pointer",
  },
  weekdayRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "8px",
  },
  weekdayCell: {
    textAlign: "center",
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  },
  dayCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px 1px",
    borderRadius: "10px",
    minHeight: "62px",
    position: "relative",
    gap: "1px",
  },
  dayNumber: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1B1D1F",
  },
  lunarLabel: {
    fontSize: "8px",
    color: "#AEB5BC",
    lineHeight: "1",
  },
  sonTag: {
    fontSize: "7px",
    fontWeight: 700,
    color: "#3182F6",
    backgroundColor: "#F0F7FF",
    borderRadius: "3px",
    padding: "1px 3px",
    lineHeight: "1.2",
  },
  eventDotRow: {
    display: "flex",
    gap: "2px",
    marginTop: "1px",
  },
  eventDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #F2F4F6",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  legendText: {
    fontSize: "11px",
    color: "#8B95A1",
  },
  todayHint: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "10px",
    padding: "10px 12px",
    backgroundColor: "#F9FAFB",
    borderRadius: "10px",
  },
  hintIcon: {
    fontSize: "14px",
  },
  hintText: {
    fontSize: "12px",
    color: "#6B7684",
  },
  selectedDateSection: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #F2F4F6",
  },
  selectedDateHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  selectedDateTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: 0,
  },
  selectedLunar: {
    fontSize: "12px",
    color: "#8B95A1",
    margin: "2px 0 0 0",
  },
  addEventButton: {
    background: "none",
    border: "1px solid #6B4EFF",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#6B4EFF",
    cursor: "pointer",
    flexShrink: 0,
  },
  noEvents: {
    fontSize: "13px",
    color: "#AEB5BC",
    textAlign: "center",
    padding: "12px 0",
    margin: 0,
  },
  eventItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 0",
    borderBottom: "1px solid #F2F4F6",
  },
  eventColorBar: {
    width: "4px",
    height: "32px",
    borderRadius: "2px",
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  eventTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1B1D1F",
  },
  eventMemo: {
    fontSize: "12px",
    color: "#8B95A1",
  },
  lunarBadge: {
    fontSize: "10px",
    color: "#6B4EFF",
    fontWeight: 600,
  },
  removeEventButton: {
    background: "none",
    border: "none",
    fontSize: "14px",
    color: "#AEB5BC",
    cursor: "pointer",
    padding: "4px",
  },
  addEventForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px",
    backgroundColor: "#F9FAFB",
    borderRadius: "12px",
    marginBottom: "12px",
  },
  eventInput: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #E5E8EB",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    outline: "none",
    color: "#1B1D1F",
  },
  lunarCheckRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  lunarCheckbox: {
    width: "18px",
    height: "18px",
    accentColor: "#6B4EFF",
    flexShrink: 0,
  },
  lunarCheckLabel: {
    fontSize: "13px",
    color: "#333D4B",
    fontWeight: 500,
  },
  lunarRecurringHint: {
    fontSize: "12px",
    color: "#6B4EFF",
    backgroundColor: "#F4F1FF",
    borderRadius: "8px",
    padding: "8px 12px",
    margin: 0,
    lineHeight: "1.5",
  },
  colorPickerRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  colorPickerDot: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "transform 0.15s",
  },
  addEventActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    backgroundColor: "#F2F4F6",
    color: "#6B7684",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  saveButton: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    backgroundColor: "#6B4EFF",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  fortuneButton: {
    width: "100%",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 600,
    backgroundColor: "#F4F1FF",
    color: "#6B4EFF",
    border: "1px solid #E8E1FF",
    borderRadius: "12px",
    cursor: "pointer",
    marginTop: "12px",
  },
};
