import { useState } from "react";
import type { CSSProperties } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useCalendar } from "../hooks/useCalendar";
import { useFortune } from "../hooks/useFortune";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { RegistrationForm } from "../components/RegistrationForm";
import { Calendar } from "../components/Calendar";
import { FortuneCard } from "../components/FortuneCard";
import { LuckyDaysCard } from "../components/LuckyDaysCard";
import { BannerAd } from "../components/BannerAd";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { getZodiacEmoji } from "../lib/zodiac";
import { today, tomorrow } from "../lib/dateUtils";

export function HomePage() {
  const { profile, isLoading: profileLoading, register, reset } = useUserProfile();
  const {
    todayFortune,
    tomorrowFortune,
    specificFortune,
    isDailyLoading,
    dailyError,
    requestTodayFortune,
    requestTomorrowFortune,
    requestSpecificFortune,
    clearSpecificFortune,
  } = useFortune(profile);

  const { events, addEvent, addLunarRecurringEvent, removeEvent, eventColors } =
    useCalendarEvents();

  const { monthLabel, calendarDays, goToPrevMonth, goToNextMonth, goToToday } =
    useCalendar(null, events);

  // 현재 표시 중인 날짜 (카드 하나만 보임)
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [showLuckyDays, setShowLuckyDays] = useState(false);
  const [luckyDaysLoading, setLuckyDaysLoading] = useState(false);

  if (profileLoading) {
    return <LoadingSpinner message="로딩 중..." />;
  }

  if (!profile) {
    return <RegistrationForm onRegister={register} />;
  }

  const handleRequestFortune = async (date: string) => {
    const todayDate = today();
    const tomorrowDate = tomorrow();
    setActiveDate(date); // 먼저 선택
    setShowLuckyDays(false); // 행운의 날 카드 숨김

    if (date === todayDate) {
      await requestTodayFortune();
    } else if (date === tomorrowDate) {
      await requestTomorrowFortune();
    } else {
      clearSpecificFortune();
      await requestSpecificFortune(date);
    }
  };

  const handleRequestLuckyDays = async () => {
    if (!profile) return;
    setLuckyDaysLoading(true);
    try {
      const { showFullScreenAd } = await import("../lib/adManager");
      await showFullScreenAd(); // 행운의 날은 독립적인 광고 (무료 카운터 차감 없음)
      setActiveDate(null); // 운세 카드 숨김
      setShowLuckyDays(true);
    } finally {
      setLuckyDaysLoading(false);
    }
  };

  // 현재 보여줄 운세 결정 (마지막 클릭한 날짜 하나만)
  const visibleFortune =
    activeDate === today() ? todayFortune :
    activeDate === tomorrow() ? tomorrowFortune :
    activeDate ? specificFortune :
    null;

  const visibleLabel =
    activeDate === today() ? "오늘의 운세" :
    activeDate === tomorrow() ? "내일의 운세" :
    activeDate ? `${Number(activeDate.split("-")[1])}월 ${Number(activeDate.split("-")[2])}일 운세` :
    "";

  return (
    <div style={styles.container}>
      {/* 인사말 */}
      <div style={styles.greeting}>
        <span style={styles.greetingEmoji}>{getZodiacEmoji(profile.zodiac)}</span>
        <div style={styles.greetingInfo}>
          <p style={styles.greetingText}>{profile.name}님, 안녕하세요</p>
          <p style={styles.greetingSub}>
            {profile.zodiac}띠
            {profile.birthTime !== "모름" ? ` · ${profile.birthTime}` : ""}
            {` · ${profile.gender}성`}
          </p>
          <button type="button" onClick={reset} style={styles.resetButton}>
            정보 초기화
          </button>
        </div>
      </div>

      {/* 캘린더 (일정 관리 + 운세 접근) */}
      <Calendar
        monthLabel={monthLabel}
        calendarDays={calendarDays}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        onRequestFortune={handleRequestFortune}
        onAddEvent={addEvent}
        onAddLunarRecurringEvent={addLunarRecurringEvent}
        onRemoveEvent={removeEvent}
        eventColors={eventColors}
      />

      {isDailyLoading && (
        <LoadingSpinner message="운세를 생성하고 있어요..." />
      )}

      {luckyDaysLoading && (
        <LoadingSpinner message="이번 달 행운의 날을 분석하고 있어요..." />
      )}

      {dailyError && <p style={styles.error}>{dailyError}</p>}

      {/* 월간 행운의 날 버튼 */}
      {!showLuckyDays && !isDailyLoading && (
        <div style={styles.luckyDaysBtnArea}>
          <button
            type="button"
            id="lucky-days-btn"
            style={styles.luckyDaysBtn}
            onClick={() => { void handleRequestLuckyDays(); }}
            disabled={luckyDaysLoading}
          >
            ✨ 이번 달 행운의 날 보기
          </button>
        </div>
      )}

      {/* 행운의 날 카드 */}
      {showLuckyDays && profile && (
        <LuckyDaysCard
          profile={profile}
          onClose={() => setShowLuckyDays(false)}
        />
      )}

      {/* 운세 카드 — 날짜를 누르면 항상 아래에 고정 노출, 하나만 */}
      {visibleFortune && !isDailyLoading && (
        <div style={styles.fortuneArea}>
          <FortuneCard fortune={visibleFortune} label={visibleLabel} />
        </div>
      )}

      {/* 배너 광고 (하단 고정) */}
      <div style={styles.bannerArea}>
        <BannerAd />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#FAFAFA",
    paddingBottom: "120px",
  },
  greeting: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px 8px",
  },
  greetingEmoji: {
    fontSize: "36px",
  },
  greetingInfo: {
    display: "flex",
    flexDirection: "column",
  },
  greetingText: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1B1D1F",
    margin: 0,
  },
  greetingSub: {
    fontSize: "12px",
    color: "#8B95A1",
    margin: "2px 0 0 0",
  },
  resetButton: {
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "#AEB5BC",
    cursor: "pointer",
    padding: "2px 0 0 0",
    textAlign: "left",
  },
  error: {
    fontSize: "13px",
    color: "#F04452",
    textAlign: "center",
    padding: "8px 20px",
    margin: 0,
  },
  bannerArea: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  fortuneArea: {
    padding: "0 16px 16px",
  },
  luckyDaysBtnArea: {
    padding: "12px 16px 4px",
  },
  luckyDaysBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "-0.3px",
  },
};
