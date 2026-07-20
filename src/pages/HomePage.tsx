import { useState, useCallback, useRef, useEffect } from "react";
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
import { EventDetailModal } from "../components/EventDetailModal";
import { DdayBanner } from "../components/DdayBanner";
import { FortuneCard } from "../components/FortuneCard";
import { LuckyDaysCard } from "../components/LuckyDaysCard";
import { BannerAd } from "../components/BannerAd";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { BottomNav } from "../components/BottomNav";

import { getZodiacEmoji } from "../lib/zodiac";
import { today, tomorrow, minutesToTime } from "../lib/dateUtils";
import type { CalendarEvent } from "../types/fortune";
import type { NewEventInput } from "../hooks/useCalendarEvents";

import { MonthlySajuCard } from "../components/MonthlySajuCard";
import type { MonthlySajuReport } from "../types/fortune";
import { getMonthlySajuReport, getCachedMonthlySajuReportSync } from "../lib/fortuneService";

export function HomePage() {
  const { profile, isLoading: profileLoading, register, reset } = useUserProfile();
  const {
    todayFortune, tomorrowFortune, specificFortune,
    isDailyLoading, dailyError,
    requestTodayFortune, requestTomorrowFortune, requestSpecificFortune, clearSpecificFortune,
    checkAndLoadCachedFortune,
  } = useFortune(profile);

  const { events, addEvent, updateEvent, removeEvent, getDdayEvents } = useCalendarEvents();

  const {
    year, month, viewMode, setViewMode,
    monthLabel, calendarDays,
    weekDays, weekLabel,
    goToPrevMonth, goToNextMonth, goToToday,
    goToPrevWeek, goToNextWeek,
    syncToDate,
  } = useCalendar(null, events);

  // ── 모달 및 카드 상태 ──
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [returnToDetail, setReturnToDetail] = useState<CalendarEvent | null>(null); // 수정 후 상세로 복귀
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [modalDefaultTitle, setModalDefaultTitle] = useState<string | undefined>(undefined);
  const [modalDefaultStartTime, setModalDefaultStartTime] = useState<string | undefined>(undefined);
  const [modalDefaultEndTime, setModalDefaultEndTime] = useState<string | undefined>(undefined);

  // ── 선택 날짜 (FAB에서 사용) ──
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── 운세 상태 ──
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [showLuckyDays, setShowLuckyDays] = useState(false);
  const [luckyDaysLoading, setLuckyDaysLoading] = useState(false);
  const [shouldScrollToFortune, setShouldScrollToFortune] = useState(false);

  // ── 990 월간 운세 카드 상태 ──
  const [monthlySajuReport, setMonthlySajuReport] = useState<MonthlySajuReport | null>(null);
  const [monthlySajuLoading, setMonthlySajuLoading] = useState(false);
  const [monthlySajuError, setMonthlySajuError] = useState<string | null>(null);
  const [showMonthlySaju, setShowMonthlySaju] = useState(false);
  const [shouldScrollToSaju, setShouldScrollToSaju] = useState(false);
  const [monthlySajuTargetYear, setMonthlySajuTargetYear] = useState<number>(new Date().getFullYear());
  const [monthlySajuTargetMonth, setMonthlySajuTargetMonth] = useState<number>(new Date().getMonth() + 1);

  const handleRequestMonthlySaju = useCallback(async (dateStr: string) => {
    if (!profile) return;
    const [yStr, mStr] = dateStr.split("-");
    const targetYear = Number(yStr);
    const targetMonth = Number(mStr);

    setMonthlySajuTargetYear(targetYear);
    setMonthlySajuTargetMonth(targetMonth);

    setShowLuckyDays(false);
    setActiveDate(null);
    setShowMonthlySaju(true);
    setShouldScrollToSaju(true);
    setMonthlySajuError(null);
    setMonthlySajuReport(null); // 이전 캐시 데이터 비우기 (로딩 중 헤더 꼬임 방지)

    // 1. 이미 해당 월의 로컬 캐시에 월간 운세풀이가 존재하면 무료로 즉시 노출
    const cached = getCachedMonthlySajuReportSync(profile, targetYear, targetMonth);
    if (cached) {
      setMonthlySajuReport(cached);
      setMonthlySajuLoading(false);
      return;
    }

    setMonthlySajuLoading(true);

    try {
      // 2. 앱인토스 IAP 결제 + 사주 생성 (원자적 처리)
      //    processProductGrant 내부에서 사주 API 호출 →
      //    성공 시 true(결제 확정) / 실패 시 false(자동 환불)
      const { requestMonthlySajuWithPayment } = await import("../lib/paymentManager");
      const result = await requestMonthlySajuWithPayment(profile, targetYear, targetMonth);

      if (result.success && result.report) {
        setMonthlySajuReport(result.report);
      } else {
        setShowMonthlySaju(false);
        setMonthlySajuError(result.error || "월간 운세를 불러오지 못했습니다.");
        if (result.error) {
          alert(result.error);
        }
      }
    } catch (err) {
      console.error("Monthly Saju error:", err);
      setMonthlySajuError("월간 운세를 불러오지 못했습니다. 다시 시도해주세요.");
    } finally {
      setMonthlySajuLoading(false);
    }
  }, [profile]);


  // 상세 모달 열기
  const openDetailModal = useCallback((evt: CalendarEvent) => {
    setDetailEvent(evt);
  }, []);

  const openEditModal = useCallback((
    evt?: CalendarEvent,
    date?: string,
    title?: string,
    startTime?: string,
    endTime?: string,
  ) => {
    if (evt) setReturnToDetail(evt); // 기존 일정 수정 → 닫으면 상세로
    else setReturnToDetail(null);
    setEditingEvent(evt ?? null);
    setModalDefaultDate(date ?? selectedDate ?? today());
    setModalDefaultTitle(title);
    setModalDefaultStartTime(startTime);
    setModalDefaultEndTime(endTime);
    setEditModalOpen(true);
  }, [selectedDate]);

  // 수정 모달 닫기 → 상세로 복귀
  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false);
    if (returnToDetail) {
      setDetailEvent(returnToDetail);
      setReturnToDetail(null);
    }
  }, [returnToDetail]);

  // 퀵 추가 처리: "date?title=..." 포맷 파싱
  const handleAddEvent = useCallback((dateOrQuery: string) => {
    if (dateOrQuery.includes("?title=")) {
      const [date, query] = dateOrQuery.split("?title=");
      const title = decodeURIComponent(query);
      openEditModal(undefined, date, title);
    } else {
      openEditModal(undefined, dateOrQuery);
    }
  }, [openEditModal]);

  const handleTimeSlotClick = useCallback((date: string, hour: number) => {
    const startTime = minutesToTime(hour * 60);
    const endTime = minutesToTime((hour + 1) * 60);
    openEditModal(undefined, date, undefined, startTime, endTime);
  }, [openEditModal]);

  const handleSaveEvent = useCallback((input: NewEventInput) => {
    if (editingEvent) updateEvent(editingEvent.id, input);
    else addEvent(input);
    setEditModalOpen(false);
    setReturnToDetail(null);
  }, [editingEvent, addEvent, updateEvent]);

  const handleDaySelect = useCallback(async (date: string | null) => {
    if (date) {
      syncToDate(date);
    }
    setSelectedDate(date);
    setShowLuckyDays(false);
    setShowMonthlySaju(false); // 날짜나 월 이동 시 자동으로 사주 카드가 내려오지 않도록 닫음
    setShouldScrollToFortune(false);

    if (date) {
      // 일일 운세 캐시 체크 및 로드
      const cached = await checkAndLoadCachedFortune(date);
      if (cached) {
        setActiveDate(date);
      } else {
        setActiveDate(null);
      }
    } else {
      setActiveDate(null);
    }
  }, [syncToDate, checkAndLoadCachedFortune]);

  const handleRequestFortune = useCallback(async (date: string) => {
    setActiveDate(date);
    setShowLuckyDays(false);
    setShouldScrollToFortune(true); // 운세 명시적 보기 클릭 시에만 스크롤 활성화
    if (date === today()) await requestTodayFortune();
    else if (date === tomorrow()) await requestTomorrowFortune();
    else { clearSpecificFortune(); await requestSpecificFortune(date); }
  }, [requestTodayFortune, requestTomorrowFortune, requestSpecificFortune, clearSpecificFortune]);

  const handleRequestLuckyDays = useCallback(async () => {
    if (!profile) return;
    setLuckyDaysLoading(true);
    try {
      // 이번 달 광고를 이미 봤는지 확인 (YYYY-MM 형식)
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const adMonth = localStorage.getItem("luckyDays_adMonth");

      if (adMonth !== currentMonth) {
        // 이번 달 처음 → 광고 표시
        const { showLuckyDaysAd } = await import("../lib/adManager");
        const adShown = await showLuckyDaysAd();
        if (!adShown) {
          alert("광고를 끝까지 시청해야 이번 달 행운의 날을 볼 수 있습니다.");
          return;
        }
        localStorage.setItem("luckyDays_adMonth", currentMonth);
      }

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

  // 운세 / 월간 운세 로드 후 스크롤을 위한 Ref 및 Effect
  const fortuneAreaRef = useRef<HTMLDivElement>(null);
  const sajuAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleFortune && !isDailyLoading && shouldScrollToFortune) {
      const timer = setTimeout(() => {
        fortuneAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToFortune(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visibleFortune, isDailyLoading, shouldScrollToFortune]);

  useEffect(() => {
    if ((monthlySajuReport || monthlySajuLoading || monthlySajuError) && showMonthlySaju && shouldScrollToSaju) {
      const timer = setTimeout(() => {
        sajuAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToSaju(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [monthlySajuReport, monthlySajuLoading, monthlySajuError, showMonthlySaju, shouldScrollToSaju]);

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
        <button type="button" onClick={reset} style={styles.resetBtn}>초기화</button>
      </div>

      {/* D-day 배너 */}
      {ddayEvents.length > 0 && viewMode === "month" && (
        <DdayBanner events={ddayEvents} onEventClick={openDetailModal} />
      )}

      {/* ── 뷰 ── */}
      {viewMode === "month" && (
        <>
          <Calendar
            monthLabel={monthLabel}
            calendarDays={calendarDays}
            onPrevMonth={() => { setShowMonthlySaju(false); setShowLuckyDays(false); goToPrevMonth(); }}
            onNextMonth={() => { setShowMonthlySaju(false); setShowLuckyDays(false); goToNextMonth(); }}
            onToday={() => { setShowMonthlySaju(false); setShowLuckyDays(false); goToToday(); }}
            onRequestFortune={(date) => { void handleRequestFortune(date); }}
            onRequestMonthlySaju={(date) => { void handleRequestMonthlySaju(date); }}
            onDaySelect={handleDaySelect}
            onAddEvent={handleAddEvent}
            onEventClick={openDetailModal}
            selectedDate={selectedDate}
          />

          {!showLuckyDays && !isDailyLoading && !showMonthlySaju && (
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
              <LuckyDaysCard
                profile={profile}
                year={selectedDate ? Number(selectedDate.split("-")[0]) : year}
                month={selectedDate ? Number(selectedDate.split("-")[1]) : month}
                onClose={() => setShowLuckyDays(false)}
              />
            </div>
          )}

          {/* 990 월간 운세 하단 펼침 카드 (로컬 캐시 보관 및 월별 캘린더 이동 시 바로 표시) */}
          {showMonthlySaju && (
            <div ref={sajuAreaRef} style={{ padding: "0 16px 16px" }}>
              <MonthlySajuCard
                report={monthlySajuReport}
                isLoading={monthlySajuLoading}
                error={monthlySajuError}
                targetYear={monthlySajuTargetYear}
                targetMonth={monthlySajuTargetMonth}
                onClose={() => setShowMonthlySaju(false)}
              />
            </div>
          )}

          {visibleFortune && !isDailyLoading && (
            <div ref={fortuneAreaRef} style={styles.fortuneArea}>
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
          onDayClick={(date) => openEditModal(undefined, date)}
          onTimeSlotClick={handleTimeSlotClick}
          onEventClick={openDetailModal}
        />
      )}

      {viewMode === "list" && (
        <EventListView
          events={events}
          year={year}
          month={month}
          onEventClick={openDetailModal}
          onAddClick={() => openEditModal()}
        />
      )}

      {viewMode === "search" && (
        <SearchView
          events={events}
          onEventClick={openDetailModal}
        />
      )}

      {/* 하단 탭바 */}
      <BottomNav current={viewMode} onChange={setViewMode} />

      {/* 배너 광고 */}
      {viewMode === "month" && (
        <div style={styles.bannerArea}>
          <BannerAd />
        </div>
      )}

      {/* ── FAB (우하단 고정, 고정 컨테이너로 감싸서 스크롤 시에도 떠있게 유지) ── */}
      <div style={styles.fabWrapper}>
        <button
          type="button"
          id="fab-add-event"
          style={styles.fab}
          onClick={() => openEditModal(undefined, selectedDate)}
          aria-label="일정 추가"
        >
          +
        </button>
      </div>

      {/* 일정 상세 모달 */}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onEdit={(evt) => { setDetailEvent(null); openEditModal(evt); }}
          onDelete={(id) => { removeEvent(id); setDetailEvent(null); }}
          onClose={() => setDetailEvent(null)}
        />
      )}

      {/* 일정 추가/수정 모달 */}
      {editModalOpen && (
        <EventModal
          event={editingEvent}
          defaultDate={modalDefaultDate}
          defaultTitle={modalDefaultTitle}
          defaultStartTime={modalDefaultStartTime}
          defaultEndTime={modalDefaultEndTime}
          onSave={handleSaveEvent}
          onDelete={removeEvent}
          onClose={handleEditModalClose}
        />
      )}


    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { position: "relative", minHeight: "100vh", backgroundColor: "#FAFAFA", paddingBottom: "176px", paddingTop: "env(safe-area-inset-top, 0px)" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 8px" },
  greeting: { display: "flex", alignItems: "center", gap: "10px" },
  greetingEmoji: { fontSize: "32px" },
  greetingName: { fontSize: "15px", fontWeight: 700, color: "#1B1D1F", margin: 0 },
  greetingSub: { fontSize: "12px", color: "#8B95A1", margin: "2px 0 0" },
  resetBtn: { background: "none", border: "none", fontSize: "12px", color: "#AEB5BC", cursor: "pointer" },
  luckyBtnArea: { padding: "10px 16px 4px" },
  luckyBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
  error: { fontSize: "13px", color: "#F04452", textAlign: "center", padding: "8px 20px", margin: 0 },
  // ✅ FAB 우하단 고정 (스크롤 무관, 뷰포트 고정)
  fabWrapper: {
    position: "fixed",
    bottom: "184px", // 배너 위쪽으로 안착되게
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: "480px",
    pointerEvents: "none", // 클릭 스루
    zIndex: 200,
  },
  fab: {
    position: "absolute",
    right: "20px",
    bottom: 0,
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor: "#6B4EFF",
    color: "#fff",
    fontSize: "28px",
    fontWeight: 300,
    lineHeight: 1,
    paddingBottom: "4px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(107,78,255,0.45)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.15s, box-shadow 0.15s",
    pointerEvents: "auto", // 버튼 자신은 클릭되도록
  },
  bannerArea: { position: "fixed", bottom: "72px", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", zIndex: 150 },
};
