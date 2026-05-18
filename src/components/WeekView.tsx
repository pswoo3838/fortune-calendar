import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { CalendarDayData, CalendarEvent } from "../types/fortune";
import { formatTimeKR, timeToMinutes, today } from "../lib/dateUtils";

interface WeekViewProps {
  weekLabel: string;
  weekDays: CalendarDayData[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onDayClick: (date: string) => void;
  onTimeSlotClick: (date: string, hour: number) => void; // 시간 칸 탭
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_HEIGHT = 60; // 1시간 = 60px
const LEFT_WIDTH = 44;

export function WeekView({
  weekLabel, weekDays, onPrevWeek, onNextWeek, onToday, onDayClick, onTimeSlotClick, onEventClick,
}: WeekViewProps) {
  const todayStr = today();
  const WEEKDAY_SHORT = ["일", "월", "화", "수", "목", "금", "토"];
  const timelineRef = useRef<HTMLDivElement>(null);

  // 현재 시각 라인 위치 (px)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentLineTop = (currentMinutes / 60) * CELL_HEIGHT;

  // 주간뷰 열릴 때 현재 시각으로 자동 스크롤
  useEffect(() => {
    if (timelineRef.current) {
      const scrollTarget = Math.max(0, currentLineTop - 150); // 현재 시각 위 150px 여유
      timelineRef.current.scrollTop = scrollTarget;
    }
  }, [currentLineTop]);

  return (
    <div style={styles.wrapper}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button type="button" style={styles.navBtn} onClick={onPrevWeek}>◀</button>
        <button type="button" style={styles.weekLabel} onClick={onToday}>{weekLabel}</button>
        <button type="button" style={styles.navBtn} onClick={onNextWeek}>▶</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: "flex", paddingLeft: `${LEFT_WIDTH}px` }}>
        {weekDays.map((day) => {
          const dow = new Date(day.date + "T00:00:00").getDay();
          const isToday = day.date === todayStr;
          const isHoliday = !!day.holidayName || dow === 0;
          return (
            <button
              key={day.date}
              type="button"
              style={styles.dayHeader}
              onClick={() => onDayClick(day.date)}
            >
              <span style={{
                ...styles.dowLabel,
                color: isHoliday ? "#F04452" : dow === 6 ? "#3182F6" : "#6B7684",
              }}>
                {WEEKDAY_SHORT[dow]}
              </span>
              <span style={{
                ...styles.dayNum,
                backgroundColor: isToday ? "#6B4EFF" : "transparent",
                color: isToday ? "#fff" : isHoliday ? "#F04452" : "#1B1D1F",
              }}>
                {new Date(day.date + "T00:00:00").getDate()}
              </span>
              {day.holidayName && (
                <span style={styles.holidayDot} title={day.holidayName} />
              )}
            </button>
          );
        })}
      </div>

      {/* 종일 일정 바 */}
      <AllDayRow weekDays={weekDays} onEventClick={onEventClick} />

      {/* 타임라인 */}
      <div ref={timelineRef} style={styles.timeline}>
        {/* 시간 라벨 (좌측) */}
        <div style={{ ...styles.hourLabels }}>
          {HOURS.map((h) => (
            <div key={h} style={{ height: `${CELL_HEIGHT}px`, display: "flex", alignItems: "flex-start", paddingTop: "2px" }}>
              <span style={styles.hourText}>{h === 0 ? "" : `${h}시`}</span>
            </div>
          ))}
        </div>

        {/* 그리드 + 일정 */}
        <div style={styles.gridArea}>
          {/* 가로 구분선 */}
          {HOURS.map((h) => (
            <div key={h} style={{ ...styles.hourLine, top: `${h * CELL_HEIGHT}px` }} />
          ))}

          {/* 현재 시간 라인 */}
          <div style={{ ...styles.currentTimeLine, top: `${currentLineTop}px` }}>
            <div style={styles.currentTimeDot} />
          </div>

          {/* 요일별 이벤트 열 */}
          {weekDays.map((day, colIdx) => {
            const timedEvents = day.events.filter((e) => e.startTime && !isAllDay(e));
            return (
              <div
                key={day.date}
                style={{
                  ...styles.dayColumn,
                  left: `${(colIdx / 7) * 100}%`,
                  width: `${100 / 7}%`,
                  borderRight: colIdx < 6 ? "1px solid #F2F4F6" : "none",
                }}
              >
                {/* 빈 시간 칸 클릭 레이어 */}
                {HOURS.map((h) => (
                  <button
                    key={`slot-${h}`}
                    type="button"
                    onClick={() => onTimeSlotClick(day.date, h)}
                    style={{
                      position: "absolute",
                      top: `${h * CELL_HEIGHT}px`,
                      left: 0, right: 0,
                      height: `${CELL_HEIGHT}px`,
                      background: "none",
                      border: "none",
                      cursor: "cell",
                      zIndex: 0,
                    }}
                    aria-label={`${day.date} ${h}시 일정 추가`}
                  />
                ))}
                {timedEvents.map((evt) => {
                  const top = timeToMinutes(evt.startTime!) / 60 * CELL_HEIGHT;
                  const endMin = evt.endTime
                    ? timeToMinutes(evt.endTime)
                    : timeToMinutes(evt.startTime!) + 60;
                  const height = Math.max(
                    ((endMin - timeToMinutes(evt.startTime!)) / 60) * CELL_HEIGHT,
                    28,
                  );
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      style={{
                        ...styles.eventBlock,
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: evt.color + "CC",
                        borderLeft: `3px solid ${evt.color}`,
                      }}
                      onClick={() => onEventClick(evt)}
                    >
                      <span style={styles.eventBlockTitle}>{evt.title}</span>
                      {height > 40 && (
                        <span style={styles.eventBlockTime}>
                          {formatTimeKR(evt.startTime!)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function isAllDay(evt: CalendarEvent): boolean {
  return !evt.startTime || !!evt.endDate;
}

function AllDayRow({ weekDays, onEventClick }: { weekDays: CalendarDayData[]; onEventClick: (e: CalendarEvent) => void }) {
  const allDayEvents = weekDays.flatMap((day) =>
    day.events.filter(isAllDay).map((e) => ({ ...e, _displayDate: day.date })),
  );
  if (allDayEvents.length === 0) return null;

  return (
    <div style={styles.allDayRow}>
      <div style={{ width: LEFT_WIDTH, fontSize: "10px", color: "#AEB5BC", flexShrink: 0 }}>종일</div>
      <div style={{ flex: 1, display: "flex", gap: "2px", flexWrap: "wrap" }}>
        {allDayEvents.map((evt) => (
          <button
            key={`${evt.id}-${evt._displayDate}`}
            type="button"
            style={{ ...styles.allDayChip, backgroundColor: evt.color }}
            onClick={() => onEventClick(evt)}
          >
            {evt.title}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: { backgroundColor: "#fff" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F2F4F6" },
  navBtn: { background: "none", border: "none", fontSize: "18px", color: "#6B7684", cursor: "pointer", padding: "8px" },
  weekLabel: { fontSize: "14px", fontWeight: 700, color: "#1B1D1F", background: "none", border: "none", cursor: "pointer" },
  dayHeader: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px 0", background: "none", border: "none", cursor: "pointer", borderRight: "1px solid #F2F4F6" },
  dowLabel: { fontSize: "11px", fontWeight: 600 },
  dayNum: { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 },
  holidayDot: { width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#F04452" },
  allDayRow: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderBottom: "1px solid #F2F4F6", minHeight: "32px" },
  allDayChip: { fontSize: "11px", color: "#fff", padding: "2px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: 600, maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  timeline: { display: "flex", overflowY: "auto", maxHeight: "calc(100vh - 280px)", position: "relative" },
  hourLabels: { width: `${LEFT_WIDTH}px`, flexShrink: 0, paddingTop: "0" },
  hourText: { fontSize: "10px", color: "#AEB5BC", paddingLeft: "4px" },
  gridArea: { flex: 1, position: "relative", height: `${24 * CELL_HEIGHT}px` },
  hourLine: { position: "absolute", left: 0, right: 0, borderTop: "1px solid #F2F4F6", zIndex: 0 },
  currentTimeLine: { position: "absolute", left: 0, right: 0, zIndex: 5, display: "flex", alignItems: "center" },
  currentTimeDot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F04452", marginLeft: "-4px", flexShrink: 0 },
  dayColumn: { position: "absolute", top: 0, bottom: 0, zIndex: 1 },
  eventBlock: {
    position: "absolute", left: "2px", right: "2px",
    borderRadius: "6px", padding: "3px 5px",
    cursor: "pointer", border: "none",
    display: "flex", flexDirection: "column", justifyContent: "flex-start",
    overflow: "hidden", zIndex: 2, textAlign: "left",
  },
  eventBlockTitle: { fontSize: "11px", fontWeight: 700, color: "#1B1D1F", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  eventBlockTime: { fontSize: "10px", color: "#333D4B", marginTop: "2px" },
};
