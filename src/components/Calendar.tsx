import { useState, useRef, useEffect } from "react";
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
  onDaySelect: (date: string | null) => void;
  onAddEvent: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  selectedDate: string | null;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function Calendar({
  monthLabel, calendarDays,
  onPrevMonth, onNextMonth, onToday,
  onRequestFortune, onDaySelect, onAddEvent, onEventClick,
  selectedDate,
}: CalendarProps) {
  const tomorrowDate = tomorrowFn();
  const selectedPanelRef = useRef<HTMLDivElement>(null);

  // 날짜 선택 시 선택 패널이 보이도록 스크롤
  useEffect(() => {
    if (selectedDate && selectedPanelRef.current) {
      setTimeout(() => {
        selectedPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [selectedDate]);

  const handleDayClick = (day: CalendarDayData) => {
    if (!day.isCurrentMonth) return;
    if (selectedDate === day.date) {
      onDaySelect(null);
    } else {
      onDaySelect(day.date);
    }
  };

  const dayNumber = (dateStr: string) => Number.parseInt(dateStr.split("-")[2], 10);

  return (
    <div style={styles.wrapper}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button type="button" onClick={() => { onDaySelect(null); onPrevMonth(); }} style={styles.navButton}>◀</button>
        <button type="button" onClick={onToday} style={styles.monthLabel}>{monthLabel}</button>
        <button type="button" onClick={() => { onDaySelect(null); onNextMonth(); }} style={styles.navButton}>▶</button>
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

      {/* 달력 그리드 - 주(week) 행 단위로 렌더링 */}
      {(() => {
        const weeks: CalendarDayData[][] = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
          weeks.push(calendarDays.slice(i, i + 7));
        }

        const getMultiDaySpans = (week: CalendarDayData[]) => {
          const weekStart = week[0].date;
          const weekEnd = week[6].date;
          const seen = new Set<string>();
          const spans: Array<{
            event: CalendarEvent;
            startCol: number;
            endCol: number;
            lane: number;
            continuesLeft: boolean;
            continuesRight: boolean;
          }> = [];

          week.forEach((day) => {
            day.events.forEach((evt) => {
              if (seen.has(evt.id)) return;
              const evtEnd = evt.endDate || evt.date;
              if (evtEnd <= evt.date) return;
              if (evt.date > weekEnd || evtEnd < weekStart) return;
              seen.add(evt.id);

              const startCol = week.findIndex((d) => d.date >= evt.date);
              const endIdx = [...week].reverse().findIndex((d) => d.date <= evtEnd);
              const endCol = endIdx === -1 ? 6 : 6 - endIdx;

              spans.push({
                event: evt,
                startCol: Math.max(0, startCol === -1 ? 0 : startCol),
                endCol: Math.min(6, endCol),
                lane: 0,
                continuesLeft: evt.date < weekStart,
                continuesRight: evtEnd > weekEnd,
              });
            });
          });

          const laneEnds: number[] = [];
          spans.sort((a, b) => a.startCol - b.startCol);
          spans.forEach((span) => {
            let lane = 0;
            while (laneEnds[lane] !== undefined && laneEnds[lane] >= span.startCol) lane++;
            span.lane = lane;
            laneEnds[lane] = span.endCol;
          });

          return spans;
        };

        const BAR_H = 14;
        const BAR_GAP = 2;
        const BAR_TOP = 54;   // cell 2px padding + 52px 날짜 헤더 = 54px

        return weeks.map((week, weekIdx) => {
          const mdSpans = getMultiDaySpans(week);
          const maxLane = mdSpans.length > 0 ? Math.max(...mdSpans.map((s) => s.lane)) : -1;
          const reservedH = maxLane >= 0 ? BAR_TOP + (maxLane + 1) * (BAR_H + BAR_GAP) - 28 : 0;

          return (
            <div key={weekIdx} style={{ position: "relative" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "1px",
                backgroundColor: "#E5E8EB",   /* 1px gap이 회색 격자선으로 보임 */
                borderBottom: "1px solid #E5E8EB",  /* 주(week) 행 간 수평 구분선 */
              }}>
                {week.map((day, cellIdx) => {
                  const dow = new Date(day.date + "T00:00:00").getDay();
                  const isSelected = selectedDate === day.date;
                  const isHoliday = !!day.holidayName || (dow === 0 && day.isCurrentMonth);
                  const isTomorrow = day.date === tomorrowDate;

                  const singleEvts = day.events.filter((e) => !e.endDate || e.endDate <= e.date);
                  const visibleSingle = singleEvts.slice(0, 2);
                  const moreCount = singleEvts.length - visibleSingle.length;

                  // 이 셀을 실제로 지나는 다중일 스팬이 있을 때만 스페이서 추가
                  const localMaxLane = mdSpans
                    .filter(s => s.startCol <= cellIdx && cellIdx <= s.endCol)
                    .reduce((max, s) => Math.max(max, s.lane), -1);
                  // spacer = 바들이 차지하는 높이 (마지막 GAP 제외)
                  const cellReservedH = localMaxLane >= 0
                    ? (localMaxLane + 1) * (BAR_H + BAR_GAP) - BAR_GAP
                    : 0;

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
                      style={{
                        ...styles.dayCell,
                        opacity: day.isCurrentMonth ? 1 : 0.25,
                        border: "none",
                        boxShadow: isSelected && !day.isToday ? "inset 0 0 0 1.5px #6B4EFF" : "none",
                        cursor: day.isCurrentMonth ? "pointer" : "default",
                        minHeight: `${80 + Math.max(0, reservedH)}px`,
                      }}
                    >
                      {/* 날짜 헤더: 고정 52px = BAR_TOP(54) - cell padding(2). 넉넉하게 잡아 글씨가 잘리지 않게 함 */}
                      <div style={{ height: 52, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ ...styles.dateNumWrap, backgroundColor: bgColor }}>
                          <span style={{ ...styles.dayNumber, color: numColor, fontWeight: day.isToday ? 800 : 500 }}>
                            {dayNumber(day.date)}
                          </span>
                        </div>
                        {day.lunarLabel && day.isCurrentMonth && (
                          <span style={styles.lunarLabel}>{day.lunarLabel.replace("음 ", "")}</span>
                        )}
                        {day.holidayName && day.isCurrentMonth && (
                          <span style={styles.holidayLabel} title={day.holidayName}>
                            {day.holidayName.length > 4 ? day.holidayName.slice(0, 4) + "…" : day.holidayName}
                          </span>
                        )}
                        {day.isSonEomneun && !day.holidayName && day.isCurrentMonth && (
                          <span style={styles.sonTag}>손✕</span>
                        )}
                      </div>

                      {/* 다중일 오버레이 예약 공간 - 실제 스팬이 있는 셀에만 */}
                      {cellReservedH > 0 && <div style={{ height: cellReservedH, flexShrink: 0 }} />}

                      {day.isCurrentMonth && visibleSingle.map((evt) => (
                        <button
                          key={evt.id}
                          type="button"
                          // 셀 이벤트 바 클릭 → 날짜 선택(패널 오픈), 패널의 목록 클릭 시 상세 오픈
                          onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                          style={{ ...styles.eventBar, backgroundColor: evt.color }}
                          title={evt.title}
                        >
                          <span style={styles.eventBarText}>{evt.title}</span>
                        </button>
                      ))}

                      {moreCount > 0 && day.isCurrentMonth && (
                        <span style={styles.moreLabel}>+{moreCount}개</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 다중일 이벤트 연속 바 오버레이 */}
              {mdSpans.map((span) => {
                const colPct = 100 / 7;
                const leftPct = span.startCol * colPct;
                const widthPct = (span.endCol - span.startCol + 1) * colPct;
                const topPx = BAR_TOP + span.lane * (BAR_H + BAR_GAP);

                return (
                  <div
                    key={`${span.event.id}-w${weekIdx}`}
                    onClick={(e) => { e.stopPropagation(); const d = week[span.startCol]; if (d) handleDayClick(d); }}
                    style={{
                      position: "absolute",
                      left: `calc(${leftPct}% + ${span.continuesLeft ? 0 : 2}px)`,
                      width: `calc(${widthPct}% - ${(span.continuesLeft ? 0 : 2) + (span.continuesRight ? 0 : 2)}px)`,
                      top: topPx,
                      height: BAR_H,
                      backgroundColor: span.event.color,
                      borderRadius: `${span.continuesLeft ? 0 : 3}px ${span.continuesRight ? 0 : 3}px ${span.continuesRight ? 0 : 3}px ${span.continuesLeft ? 0 : 3}px`,
                      cursor: "pointer",
                      zIndex: 10,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title={span.event.title}
                  >
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#fff",
                      paddingLeft: "4px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      visibility: span.continuesLeft ? "hidden" : "visible",
                    }}>
                      {span.event.title}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        });
      })()}


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


      {/* 선택 날짜 패널 */}
      {selectedDate && (() => {
        const day = calendarDays.find((d) => d.date === selectedDate);
        if (!day) return null;
        return (
          <div ref={selectedPanelRef} style={styles.selectedPanel}>
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
    padding: "2px", borderRadius: "0",
    minHeight: "80px",
    position: "relative",
    backgroundColor: "#fff",
    gap: 0,   /* gap 제거 - 오버레이 좌표 계산과 정확히 일치시키기 위해 */
  },
  dateNumWrap: {
    width: "26px", height: "26px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "4px auto 3px",
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
    marginTop: "2px",   /* 다중일 이벤트의 BAR_GAP(2px)과 동일한 간격 */
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
};

