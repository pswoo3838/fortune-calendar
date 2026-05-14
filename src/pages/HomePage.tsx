import { useState, useCallback } from "react";
import type { CSSProperties } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useCalendar } from "../hooks/useCalendar";
import { useFortune } from "../hooks/useFortune";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { RegistrationForm } from "../components/RegistrationForm";
import { Calendar } from "../components/Calendar";
import { WeekView } from "../components/WeekView";
import { EventListView } from "../components/EventListView";
import { SearchView } from "../components/SearchView";
import { EventModal } from "../components/EventModal";
import { DdayBanner } from "../components/DdayBanner";
import { FortuneCard } from "../components/FortuneCard";
import { LuckyDaysCard } from "../components/LuckyDaysCard";
import { BannerAd } from "../components/BannerAd";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { BottomNav } from "../components/BottomNav";
import { getZodiacEmoji } from "../lib/zodiac";
import { today, tomorrow } from "../lib/dateUtils";
import type { CalendarEvent } from "../types/fortune";
import type { NewEventInput } from "../hooks/useCalendarEvents";

export function HomePage() {
  const { profile, isLoading: profileLoading, register, reset } = useUserProfile();
  const {
    todayFortune, tomorrowFortune, specificFortune,
    isDailyLoading, dailyError,
    requestTodayFortune, requestTomorrowFortune, requestSpecificFortune, clearSpecificFortune,
  } = useFortune(profile);

  const { events, isLoading: eventsLoading, addEvent, updateEvent, removeEvent, getDdayEvents } =
    useCalendarEvents();

  const {
    year, month, viewMode, setViewMode,
    monthLabel, calendarDays,
    weekDays, weekLabel,
    goToPrevMonth, goToNextMonth, goToToday,
    goToPrevWeek, goToNextWeek,
  } = useCalendar(null, events);

  // 일정 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  // 운세 상태
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [showLuckyDays, setShowLuckyDays] = useState(false);
  const [luckyDaysLoading, setLuckyDaysLoading] = useState(false);

  const openAddModal = useCallback((date?: string) => {
    setEditingEvent(null);
    setModalDefaultDate(date ?? today());
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((evt: CalendarEvent) => {
    setEditingEvent(evt);
    setModalDefaultDate(undefined);
    setModalOpen(true);
  }, []);

  const handleSaveEvent = useCallback((input: NewEventInput) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, input);
    } else {
      addEvent(input);
    }
    setModalOpen(false);
  }, [editingEvent, addEvent, updateEvent]);

  const handleDaySelect = useCallback((date: string) => {
    // 월간뷰에서 날짜 선택 시 운세 관련 상태 초기화
    setShowLuckyDays(false);
  }, []);

  const handleRequestFortune = useCallback(async (date: string) => {
    const todayDate = today();
    const tomorrowDate = tomorrow();
    setActiveDate(date);
    setShowLuckyDays(false);
    if (date === todayDate) {
      await requestTodayFortune();
    } else if (date === tomorrowDate) {
      await requestTomorrowFortune();
    } else {
      clearSpecificFortune();
      await requestSpecificFortune(date);
    }
  }, [requestTodayFortune, requestTomorrowFortune, requestSpecificFortune, clearSpecificFortune]);

  const handleRequestLuckyDays = useCallback(async () => {
    if (!profile) return;
    setLuckyDaysLoading(true);
    try {
      const { showFullScreenAd } = await import("../lib/adManager");
      await showFullScreenAd();
      setActiveDate(null);
      setShowLuckyDays(true);
    } finally {
      setLuckyDaysLoading(false);
    }
  }, [profile]);

  const visibleFortune =
    activeDate === today() ? todayFortune :
    activeDate === tomorrow() ? tomorrowFortune :
    activeDate ? specificFortune : null;

  const visibleLabel =
    activeDate === today() ? "오늘의 운세" :
    activeDate === tomorrow() ? "내일의 운세" :
    activeDate ? `${Number(activeDate.split("-")[1])}월 ${Number(activeDate.split("-")[2])}일 운세` : "";

  const ddayEvents = getDdayEvents();

  if (profileLoading) return <LoadingSpinner message="로딩 중..." />;
  if (!profile) return <RegistrationForm onRegister={register} />;

  return (
    <div style={styles.container}>
      {/* 상단 인사말 */}
      <div style={styles.topBar}>
        <div style={styles.greeting}>
          <span style={styles.greetingEmoji}>{getZodiacEmoji(profile.zodiac)}</span>
          <div>
            <p style={styles.greetingName}>{profile.name}님</p>
            <p style={styles.greetingSub}>
              {profile.zodiac}띠 · {profile.gender}성
              {profile.birthTime !== "모름" ? ` · ${profile.birthTime}` : ""}
            </p>
          </div>
        </div>
        <div style={styles.topActions}>
          <button type="button" style={styles.addFab} onClick={() => openAddModal()}>
            + 일정
          </button>
          <button type="button" onClick={reset} style={styles.resetBtn}>초기화</button>
        </div>
      </div>

      {/* D-day 배너 (있을 때만) */}
      {ddayEvents.length > 0 && viewMode === "month" && (
        <DdayBanner events={ddayEvents} onEventClick={openEditModal} />
      )}

      {/* ── 뷰 콘텐츠 ── */}
      {viewMode === "month" && (
        <>
          <Calendar
            monthLabel={monthLabel}
            calendarDays={calendarDays}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
            onToday={goToToday}
            onRequestFortune={(date) => { void handleRequestFortune(date); }}
            onDaySelect={handleDaySelect}
            onAddEvent={openAddModal}
            onEventClick={openEditModal}
          />

          {/* 행운의 날 버튼 */}
          {!showLuckyDays && !isDailyLoading && (
            <div style={styles.luckyBtnArea}>
              <button
                type="button"
                style={styles.luckyBtn}
                onClick={() => { void handleRequestLuckyDays(); }}
                disabled={luckyDaysLoading}
              >
                ✨ 이번 달 행운의 날 보기
              </button>
            </div>
          )}

          {luckyDaysLoading && <LoadingSpinner message="이번 달 행운의 날을 분석하고 있어요..." />}
          {isDailyLoading && <LoadingSpinner message="운세를 생성하고 있어요..." />}
          {dailyError && <p style={styles.error}>{dailyError}</p>}

          {showLuckyDays && profile && (
            <div style={{ padding: "0 16px 16px" }}>
              <LuckyDaysCard profile={profile} onClose={() => setShowLuckyDays(false)} />
            </div>
          )}

          {visibleFortune && !isDailyLoading && (
            <div style={styles.fortuneArea}>
              <FortuneCard fortune={visibleFortune} label={visibleLabel} />
            </div>
          )}
        </>
      )}

      {viewMode === "week" && (
        <WeekView
          weekLabel={weekLabel}
          weekDays={weekDays}
          onPrevWeek={goToPrevWeek}
          onNextWeek={goToNextWeek}
          onToday={goToToday}
          onDayClick={(date) => openAddModal(date)}
          onEventClick={openEditModal}
        />
      )}

      {viewMode === "list" && (
        <EventListView
          events={events}
          year={year}
          month={month}
          onEventClick={openEditModal}
          onAddClick={() => openAddModal()}
        />
      )}

      {viewMode === "search" && (
        <SearchView
          events={events}
          onEventClick={openEditModal}
        />
      )}

      {/* 하단 탭바 */}
      <BottomNav current={viewMode} onChange={setViewMode} />

      {/* 배너 광고 (탭바 위) */}
      {viewMode === "month" && (
        <div style={styles.bannerArea}>
          <BannerAd />
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      {modalOpen && (
        <EventModal
          event={editingEvent}
          defaultDate={modalDefaultDate}
          onSave={handleSaveEvent}
          onDelete={removeEvent}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { minHeight: "100vh", backgroundColor: "#FAFAFA", paddingBottom: "176px" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px" },
  greeting: { display: "flex", alignItems: "center", gap: "10px" },
  greetingEmoji: { fontSize: "32px" },
  greetingName: { fontSize: "15px", fontWeight: 700, color: "#1B1D1F", margin: 0 },
  greetingSub: { fontSize: "12px", color: "#8B95A1", margin: "2px 0 0" },
  topActions: { display: "flex", alignItems: "center", gap: "8px" },
  addFab: {
    padding: "8px 16px", backgroundColor: "#6B4EFF", color: "#fff",
    border: "none", borderRadius: "20px", fontSize: "14px", fontWeight: 700,
    cursor: "pointer", boxShadow: "0 2px 8px rgba(107,78,255,0.3)",
  },
  resetBtn: { background: "none", border: "none", fontSize: "12px", color: "#AEB5BC", cursor: "pointer" },
  luckyBtnArea: { padding: "10px 16px 4px" },
  luckyBtn: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff", border: "none", borderRadius: "14px",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
  },
  error: { fontSize: "13px", color: "#F04452", textAlign: "center", padding: "8px 20px", margin: 0 },
  fortuneArea: { padding: "0 16px 16px" },
  bannerArea: { position: "fixed", bottom: "72px", left: 0, right: 0, zIndex: 150 },
};
