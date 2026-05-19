import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { CalendarEvent, EventCategory, RepeatRule } from "../types/fortune";
import type { NewEventInput } from "../hooks/useCalendarEvents";
import { CATEGORY_LABELS, CATEGORY_COLORS, EVENT_COLORS } from "../hooks/useCalendarEvents";

interface EventModalProps {
  event?: CalendarEvent | null;
  defaultDate?: string;
  defaultTitle?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSave: (input: NewEventInput) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const REPEAT_LABELS = {
  none: "반복 없음",
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
} as const;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function EventModal({ event, defaultDate, defaultTitle, defaultStartTime, defaultEndTime, onSave, onDelete, onClose }: EventModalProps) {
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title ?? defaultTitle ?? "");
  const now = new Date();
  const defaultStart = `${String((now.getHours() + 1) % 24).padStart(2, "0")}:00`;
  const defaultEnd = `${String((now.getHours() + 2) % 24).padStart(2, "0")}:00`;

  const [date, setDate] = useState(event?.date ?? defaultDate ?? "");
  const [endDate, setEndDate] = useState(event?.endDate ?? event?.date ?? defaultDate ?? "");
  const [startTime, setStartTime] = useState(event?.startTime ?? defaultStartTime ?? defaultStart);
  const [endTime, setEndTime] = useState(event?.endTime ?? defaultEndTime ?? defaultEnd);
  const [memo, setMemo] = useState(event?.memo ?? "");
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "personal");
  const [color, setColor] = useState(event?.color ?? CATEGORY_COLORS.personal);
  const [isDday, setIsDday] = useState(event?.isDday ?? false);
  const [repeatType, setRepeatType] = useState<keyof typeof REPEAT_LABELS>(event?.repeat?.type ?? "none");
  const [repeatDays, setRepeatDays] = useState<number[]>(event?.repeat?.days ?? []);
  const [repeatUntil, setRepeatUntil] = useState(event?.repeat?.until ?? "");
  const [isLunarRecurring, setIsLunarRecurring] = useState(event?.isLunarRecurring ?? false);
  const [allDay, setAllDay] = useState(event ? !event.startTime : false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 모달 body ref - 열릴 때 최상단으로 스크롤
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // iOS Safari 표준 body 스크롤 잠금 패턴
    // 배경 페이지가 하단 탭 영역을 보여주는 현상 방지
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // 모달 내부도 최상단으로
    requestAnimationFrame(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
    });

    return () => {
      // 모달 닫힐 때 body 스크롤 복원
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // 스와이프 닫기
  const touchStartY = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80) onClose();
  };

  useEffect(() => {
    if (!event) setColor(CATEGORY_COLORS[category]);
  }, [category, event]);

  const handleSave = () => {
    if (!title.trim() || !date) return;
    const repeat: RepeatRule | undefined =
      repeatType !== "none"
        ? { type: repeatType, days: repeatType === "weekly" ? repeatDays : undefined, until: repeatUntil || undefined }
        : undefined;

    onSave({
      date,
      endDate: endDate || undefined,
      startTime: allDay ? undefined : startTime || undefined,
      endTime: allDay ? undefined : endTime || undefined,
      title: title.trim(),
      memo: memo.trim() || undefined,
      color,
      category,
      isDday,
      repeat,
      isLunarRecurring,
    });
    onClose();
  };

  const toggleWeekday = (d: number) => {
    setRepeatDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 핸들 */}
        <div style={styles.handle} />

        {/* 헤더 */}
        <div style={styles.header}>
          <button type="button" style={styles.closeBtn} onClick={onClose}>✕</button>
          <h2 style={styles.headerTitle}>{isEdit ? "일정 수정" : "새 일정"}</h2>
          <button
            type="button"
            style={{ ...styles.saveBtn, opacity: title.trim() ? 1 : 0.4 }}
            onClick={handleSave}
            disabled={!title.trim()}
          >
            저장
          </button>
        </div>

        <div ref={bodyRef} style={styles.body}>
          {/* 제목 */}
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.titleInput}
            maxLength={50}
          />

          {/* 날짜 */}
          <div style={styles.section}>
            <div style={styles.row}>
              <span style={styles.label}>📅 날짜</span>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  if (!endDate || endDate < newDate) setEndDate(newDate);
                }} 
                style={styles.dateInput} 
              />
            </div>
            <div style={styles.row}>
              <span style={styles.label}>끝나는 날</span>
              <input type="date" value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} style={styles.dateInput} />
            </div>
          </div>

          {/* 종일 / 시간 */}
          <div style={styles.section}>
            <div style={styles.row}>
              <span style={styles.label}>⏰ 종일</span>
              <Toggle value={allDay} onChange={setAllDay} />
            </div>
            {!allDay && (
              <div style={styles.row}>
                <span style={styles.label}>시간</span>
                <div style={styles.timeRow}>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.timeInput} />
                  <span style={styles.timeSep}>—</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={styles.timeInput} />
                </div>
              </div>
            )}
          </div>

          {/* 카테고리 */}
          <div style={styles.section}>
            <span style={styles.sectionLabel}>카테고리</span>
            <div style={styles.categoryRow}>
              {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    ...styles.categoryBtn,
                    backgroundColor: category === cat ? CATEGORY_COLORS[cat] : "#F2F4F6",
                    color: category === cat ? "#fff" : "#333D4B",
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div style={styles.section}>
            <textarea
              placeholder="메모 추가"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={styles.memo}
              maxLength={200}
              rows={2}
            />
          </div>

          {/* 고급 옵션 접기/펼치기 */}
          <button
            type="button"
            style={styles.advancedToggle}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <span>{showAdvanced ? "▲" : "▼"} 고급 옵션</span>
            <span style={styles.advancedHint}>반복 · D-day · 색상 · 음력</span>
          </button>

          {showAdvanced && (
            <>
              {/* 색상 */}
              <div style={styles.section}>
                <span style={styles.sectionLabel}>색상</span>
                <div style={styles.colorRow}>
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        ...styles.colorDot,
                        backgroundColor: c,
                        transform: color === c ? "scale(1.3)" : "scale(1)",
                        boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 반복 */}
              <div style={styles.section}>
                <span style={styles.sectionLabel}>🔁 반복</span>
                <div style={styles.segmentRow}>
                  {(Object.keys(REPEAT_LABELS) as (keyof typeof REPEAT_LABELS)[]).map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setRepeatType(rt)}
                      style={{
                        ...styles.segBtn,
                        backgroundColor: repeatType === rt ? "#6B4EFF" : "#F2F4F6",
                        color: repeatType === rt ? "#fff" : "#6B7684",
                      }}
                    >
                      {REPEAT_LABELS[rt]}
                    </button>
                  ))}
                </div>
                {repeatType === "weekly" && (
                  <div style={styles.weekdayRow}>
                    {WEEKDAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleWeekday(i)}
                        style={{
                          ...styles.weekdayBtn,
                          backgroundColor: repeatDays.includes(i) ? "#6B4EFF" : "#F2F4F6",
                          color: repeatDays.includes(i) ? "#fff" : "#333D4B",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {repeatType !== "none" && (
                  <div style={styles.row}>
                    <span style={styles.label}>종료일</span>
                    <input
                      type="date"
                      value={repeatUntil}
                      min={date}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                      style={styles.dateInput}
                    />
                  </div>
                )}
              </div>

              {/* 음력 반복 */}
              <div style={styles.section}>
                <div style={styles.row}>
                  <span style={styles.label}>🌙 음력 매년 반복</span>
                  <Toggle value={isLunarRecurring} onChange={setIsLunarRecurring} />
                </div>
              </div>

              {/* D-day */}
              <div style={styles.section}>
                <div style={styles.row}>
                  <span style={styles.label}>📌 D-day 지정</span>
                  <Toggle value={isDday} onChange={setIsDday} />
                </div>
              </div>
            </>
          )}

          {/* 삭제 버튼 */}
          {isEdit && onDelete && (
            <button
              type="button"
              style={styles.deleteBtn}
              onClick={() => { onDelete(event.id); onClose(); }}
            >
              일정 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ cursor: "pointer" }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ display: "none" }} />
      <div style={{ width: "44px", height: "26px", borderRadius: "13px", position: "relative", transition: "background 0.2s", backgroundColor: value ? "#6B4EFF" : "#E5E8EB" }}>
        <div style={{ position: "absolute", top: "3px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s", transform: value ? "translateX(20px)" : "translateX(2px)" }} />
      </div>
    </label>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "flex-end", backdropFilter: "blur(2px)" },
  modal: { width: "100%", maxWidth: "480px", margin: "0 auto", maxHeight: "92vh", backgroundColor: "#fff", borderRadius: "20px 20px 0 0", overflowY: "auto", animation: "slideUp 0.25s ease" },
  handle: { width: "40px", height: "4px", backgroundColor: "#E5E8EB", borderRadius: "2px", margin: "12px auto 4px", cursor: "grab" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 12px", borderBottom: "1px solid #F2F4F6", position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1 },
  headerTitle: { fontSize: "17px", fontWeight: 700, color: "#1B1D1F", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "18px", color: "#6B7684", cursor: "pointer", padding: "4px 8px" },
  saveBtn: { background: "#6B4EFF", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer" },
  body: { padding: "16px 20px 40px" },
  titleInput: { width: "100%", fontSize: "20px", fontWeight: 700, color: "#1B1D1F", border: "none", borderBottom: "2px solid #6B4EFF", outline: "none", padding: "8px 0", marginBottom: "20px", backgroundColor: "transparent", boxSizing: "border-box" },
  section: { marginBottom: "20px" },
  sectionLabel: { display: "block", fontSize: "12px", color: "#8B95A1", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "40px" },
  label: { fontSize: "14px", color: "#333D4B" },
  dateInput: { fontSize: "14px", color: "#1B1D1F", border: "1px solid #E5E8EB", borderRadius: "8px", padding: "6px 10px", backgroundColor: "#F9FAFB" },
  timeRow: { display: "flex", alignItems: "center", gap: "8px" },
  timeInput: { fontSize: "14px", color: "#1B1D1F", border: "1px solid #E5E8EB", borderRadius: "8px", padding: "6px 10px", backgroundColor: "#F9FAFB" },
  timeSep: { color: "#AEB5BC" },
  categoryRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  categoryBtn: { padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s" },
  memo: { width: "100%", fontSize: "14px", color: "#1B1D1F", border: "1px solid #E5E8EB", borderRadius: "12px", padding: "12px", resize: "none", outline: "none", backgroundColor: "#F9FAFB", boxSizing: "border-box", fontFamily: "inherit" },
  // 고급 옵션 토글
  advancedToggle: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: "#F9FAFB", border: "1px solid #E5E8EB", borderRadius: "12px", cursor: "pointer", marginBottom: "16px", fontSize: "13px", fontWeight: 600, color: "#6B7684" },
  advancedHint: { fontSize: "12px", color: "#AEB5BC" },
  colorRow: { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" },
  colorDot: { width: "26px", height: "26px", borderRadius: "50%", border: "none", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" },
  segmentRow: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" },
  segBtn: { padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" },
  weekdayRow: { display: "flex", gap: "6px", marginBottom: "10px" },
  weekdayBtn: { width: "36px", height: "36px", borderRadius: "50%", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer" },
  deleteBtn: { width: "100%", padding: "14px", backgroundColor: "#FFF0F0", color: "#F04452", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginTop: "8px" },
};
