import { useState, useCallback } from "react";
import type { UserProfile, DailyFortune, WeeklyFortune, MonthlyFortune } from "../types/fortune";
import {
  getDailyFortune as buildDailyFortune,
  getWeeklyFortune,
} from "../lib/fortuneService";
import { addUnlockedDate } from "../lib/storage";
import { formatDate, today, tomorrow } from "../lib/dateUtils";
import { showFortuneInterstitial, showFullScreenAd } from "../lib/adManager";

interface UseFortuneReturn {
  todayFortune: DailyFortune | null;
  tomorrowFortune: DailyFortune | null;
  specificFortune: DailyFortune | null;
  isDailyLoading: boolean;
  dailyError: string | null;

  monthlyFortune: MonthlyFortune | null;
  isMonthlyLoading: boolean;
  monthlyError: string | null;

  requestTodayFortune: () => Promise<void>;
  requestTomorrowFortune: () => Promise<void>;
  requestSpecificFortune: (date: string) => Promise<void>;
  requestMonthlyFortune: (year: number, month: number) => Promise<void>;
  clearSpecificFortune: () => void;
}

async function loadCachedDailyFortune(
  targetDate: string,
  profile: UserProfile,
): Promise<DailyFortune | null> {
  const { getCachedDailyFortune } = await import("../lib/storage");
  const cached = await getCachedDailyFortune(targetDate);
  if (!cached || cached.zodiac !== profile.zodiac) {
    return null;
  }
  return cached;
}

function buildMonthlyFortune(
  year: number,
  month: number,
  profile: UserProfile,
  weeklyFortune: WeeklyFortune,
): MonthlyFortune {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyFortunes: DailyFortune[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(new Date(year, month, day));
    dailyFortunes.push(buildDailyFortune(date, profile, weeklyFortune));
  }

  return {
    year,
    month,
    zodiac: profile.zodiac,
    dailyFortunes,
    generatedAt: new Date().toISOString(),
  };
}

export function useFortune(profile: UserProfile | null): UseFortuneReturn {
  const [todayFortune, setTodayFortune] = useState<DailyFortune | null>(null);
  const [tomorrowFortune, setTomorrowFortune] = useState<DailyFortune | null>(null);
  const [specificFortune, setSpecificFortune] = useState<DailyFortune | null>(null);
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const [monthlyFortune, setMonthlyFortune] = useState<MonthlyFortune | null>(null);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  /**
   * 일별 운세 요청
   * 항상 광고를 먼저 보여주고, 광고 후 운세를 해금/표시
   */
  const requestDailyFortune = useCallback(
    async (targetDate: string, setter: (fortune: DailyFortune) => void) => {
      if (!profile) return;

      setDailyError(null);
      setIsDailyLoading(true);

      try {
        // 전면 광고 표시 (빈도 조절 적용: 처음엔 무조건 뜨고 이후 3번 패스)
        await showFortuneInterstitial();

        // 캐시에서 가져오기 시도
        const cached = await loadCachedDailyFortune(targetDate, profile);
        if (cached) {
          setter(cached);
          void addUnlockedDate(targetDate);
          return;
        }

        // 캐시 없음 → 새로 생성
        const weeklyFortune = await getWeeklyFortune(profile);
        const fortune = await buildDailyFortune(targetDate, profile, weeklyFortune);
        setter(fortune);
        void addUnlockedDate(targetDate);
      } catch (err) {
        console.error("운세 조회 실패:", err);
        setDailyError("운세를 불러오지 못했습니다. 다시 시도해주세요.");
      } finally {
        setIsDailyLoading(false);
      }
    },
    [profile],
  );

  const requestTodayFortune = useCallback(async () => {
    await requestDailyFortune(today(), setTodayFortune);
  }, [requestDailyFortune]);

  const requestTomorrowFortune = useCallback(async () => {
    await requestDailyFortune(tomorrow(), setTomorrowFortune);
  }, [requestDailyFortune]);

  const requestSpecificFortune = useCallback(async (date: string) => {
    await requestDailyFortune(date, setSpecificFortune);
  }, [requestDailyFortune]);

  const clearSpecificFortune = useCallback(() => {
    setSpecificFortune(null);
  }, []);

  const requestMonthlyFortune = useCallback(
    async (year: number, month: number) => {
      if (!profile) return;

      setMonthlyError(null);

      if (
        monthlyFortune?.year === year &&
        monthlyFortune.month === month &&
        monthlyFortune.zodiac === profile.zodiac
      ) {
        return;
      }

      setIsMonthlyLoading(true);
      try {
        await showFullScreenAd();

        const weeklyFortune = await getWeeklyFortune(profile);
        const fortune = buildMonthlyFortune(year, month, profile, weeklyFortune);
        setMonthlyFortune(fortune);
      } catch (err) {
        console.error("월간 운세 조회 실패:", err);
        setMonthlyError("한달 운세를 불러오지 못했습니다.");
      } finally {
        setIsMonthlyLoading(false);
      }
    },
    [monthlyFortune, profile],
  );

  return {
    todayFortune,
    tomorrowFortune,
    specificFortune,
    isDailyLoading,
    dailyError,
    monthlyFortune,
    isMonthlyLoading,
    monthlyError,
    requestTodayFortune,
    requestTomorrowFortune,
    requestSpecificFortune,
    requestMonthlyFortune,
    clearSpecificFortune,
  };
}
