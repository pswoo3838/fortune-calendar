import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import type { CalendarEvent } from "../types/fortune";
import { formatDateKR, formatTimeKR, getDdayLabel, getDdayCount } from "../lib/dateUtils";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../hooks/useCalendarEvents";

interface EventDetailModalProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const REPEAT_TEXT: Record<string, string> = {
  daily: "매일 반복",
  weekly: "매주 반복",
  monthly: "매월 반복",
  yearly: "매년 반복",
};

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

export function EventDetailModal({ event, onEdit, onDelete, onClose }: EventDetailModalProps) {
  const ddayCount = event.isDday ? getDdayCount(event.date) : null;
  const ddayLabel = event.isDday ? getDdayLabel(event.date) : null;
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── 스와이프 닫기 ──
  const touchStartY = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80) onClose(); // 80px 이상 아래로 스와이프 → 닫기
  };

  const repeatDesc = () => {
    if (event.isLunarRecurring) return "음력 매년 반복";
    if (!event.repeat) return null;
    const base = REPEAT_TEXT[event.repeat.type] ?? "";
    if (event.repeat.type === "weekly" && event.repeat.days?.length) {
      const days = event.repeat.days.map((d) => WEEKDAY_KR[d]).join(", ");
      return `${days}요일 반복`;
    }
    return base;
  };

  const dateDesc = () => {
    if (event.endDate && event.endDate !== event.date) {
      return `${formatDateKR(event.date)} — ${formatDateKR(event.endDate)}`;
    }
    return formatDateKR(event.date);
  };

  const timeDesc = () => {
    if (!event.startTime) return "종일";
    if (event.endTime) return `${formatTimeKR(event.startTime)} — ${formatTimeKR(event.endTime)}`;
    return formatTimeKR(event.startTime);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 스와이프 핸들 */}
        <div style={styles.handle} />

        {/* 카테고리 + 색상 */}
        <div style={styles.categoryBadge}>
          <div style={{ ...styles.categoryDot, backgroundColor: event.color }} />
          <span style={{ ...styles.categoryText, color: CATEGORY_COLORS[event.category] }}>
            {CATEGORY_LABELS[event.category]}
          </span>
          {event.isHoliday && <span style={styles.holidayBadge}>공휴일</span>}
        </div>

        {/* 제목 */}
        <h1 style={styles.title}>{event.title}</h1>

        {/* D-day 배지 */}
        {ddayLabel && (
          <div style={{
            ...styles.ddayBadge,
            backgroundColor: ddayCount === 0 ? "#6B4EFF" : ddayCount! < 0 ? "#F2F4F6" : "#EDE9FF",
            color: ddayCount === 0 ? "#fff" : ddayCount! < 0 ? "#AEB5BC" : "#6B4EFF",
          }}>
            {ddayLabel}
          </div>
        )}

        {/* 정보 목록 */}
        <div style={styles.infoList}>
          <InfoRow icon="📅" label={dateDesc()} />
          <InfoRow icon="⏰" label={timeDesc()} />
          {repeatDesc() && <InfoRow icon="🔁" label={repeatDesc()!} />}
          {event.memo && <InfoRow icon="📝" label={event.memo} isMultiline />}
        </div>

        {/* 액션 버튼 */}
        {confirmDelete ? (
          <div style={styles.confirmBox}>
            <p style={styles.confirmText}>정말 삭제할까요?</p>
            <div style={styles.confirmBtns}>
              <button type="button" style={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>
                취소
              </button>
              <button
                type="button"
                style={styles.deleteConfirmBtn}
                onClick={() => { onDelete(event.id); onClose(); }}
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.actions}>
            <button type="button" style={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
              삭제
            </button>
            <button
              type="button"
              style={styles.editBtn}
              onClick={() => { onEdit(event); onClose(); }}
            >
              수정
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, isMultiline }: { icon: string; label: string; isMultiline?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: isMultiline ? "flex-start" : "center", padding: "10px 0", borderBottom: "1px solid #F2F4F6" }}>
      <span style={{ fontSize: "18px", flexShrink: 0, marginTop: isMultiline ? "2px" : 0 }}>{icon}</span>
      <span style={{ fontSize: "15px", color: "#333D4B", lineHeight: 1.5 }}>{label}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 500,
    display: "flex", alignItems: "flex-end",
    backdropFilter: "blur(2px)",
  },
  modal: {
    width: "100%", maxWidth: "480px", margin: "0 auto",
    backgroundColor: "#fff",
    borderRadius: "24px 24px 0 0",
    padding: "12px 24px 40px",
    animation: "slideUp 0.22s ease",
  },
  handle: {
    width: "40px", height: "4px",
    backgroundColor: "#E5E8EB",
    borderRadius: "2px",
    margin: "0 auto 16px",
    cursor: "grab",
  },
  categoryBadge: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" },
  categoryDot: { width: "10px", height: "10px", borderRadius: "50%" },
  categoryText: { fontSize: "13px", fontWeight: 700 },
  holidayBadge: { fontSize: "11px", backgroundColor: "#FFF0F0", color: "#F04452", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 },
  title: { fontSize: "24px", fontWeight: 800, color: "#1B1D1F", margin: "0 0 8px", lineHeight: 1.3 },
  ddayBadge: { display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: 800, marginBottom: "16px" },
  infoList: { margin: "8px 0 24px" },
  actions: { display: "flex", gap: "12px" },
  deleteBtn: { flex: 1, padding: "14px", backgroundColor: "#FFF0F0", color: "#F04452", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
  editBtn: { flex: 2, padding: "14px", backgroundColor: "#6B4EFF", color: "#fff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
  // 삭제 확인
  confirmBox: { backgroundColor: "#FFF8F8", borderRadius: "14px", padding: "16px" },
  confirmText: { fontSize: "15px", fontWeight: 600, color: "#1B1D1F", textAlign: "center", margin: "0 0 14px" },
  confirmBtns: { display: "flex", gap: "10px" },
  cancelBtn: { flex: 1, padding: "12px", backgroundColor: "#F2F4F6", color: "#6B7684", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  deleteConfirmBtn: { flex: 1, padding: "12px", backgroundColor: "#F04452", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
};
