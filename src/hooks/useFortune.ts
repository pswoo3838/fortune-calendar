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
  checkAndLoadCachedFortune: (date: string | null) => Promise<DailyFortune | null>;
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

async function buildMonthlyFortune(
  year: number,
  month: number,
  profile: UserProfile,
  weeklyFortune: WeeklyFortune,
): Promise<MonthlyFortune> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyFortunes: DailyFortune[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(new Date(year, month, day));
    // getDailyFortune may hit the API if not found, so await it
    const fortune = await buildDailyFortune(date, profile, weeklyFortune);
    dailyFortunes.push(fortune);
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
        // 1. 캐시에서 가져오기 시도 (이미 본 운세는 광고 없이 로드)
        const cached = await loadCachedDailyFortune(targetDate, profile);
        if (cached) {
          setter(cached);
          void addUnlockedDate(targetDate);
          return;
        }

        // 2. 캐시 없으면 광고 표시 (빈도 조절 적용)
        const adShown = await showFortuneInterstitial();
        if (!adShown) {
          throw new Error("AD_CANCELLED");
        }

        // 캐시 없음 → 새로 생성
        const weeklyFortune = await getWeeklyFortune(profile);
        const fortune = await buildDailyFortune(targetDate, profile, weeklyFortune);
        setter(fortune);
        void addUnlockedDate(targetDate);
      } catch (err) {
        console.error("운세 조회 실패:", err);
        if (err instanceof Error && err.message === "AD_CANCELLED") {
          setDailyError("광고를 끝까지 시청해야 운세를 볼 수 있습니다.");
        } else {
          const errMsg = err instanceof Error ? err.message : String(err);
          setDailyError(`운세를 불러오지 못했습니다. 다시 시도해주세요. (${errMsg})`);
        }
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

  const checkAndLoadCachedFortune = useCallback(
    async (date: string | null): Promise<DailyFortune | null> => {
      if (!profile) return null;
      if (!date) {
        setSpecificFortune(null);
        return null;
      }

      const cached = await loadCachedDailyFortune(date, profile);
      if (cached) {
        if (date === today()) {
          setTodayFortune(cached);
        } else if (date === tomorrow()) {
          setTomorrowFortune(cached);
        } else {
          setSpecificFortune(cached);
        }
        return cached;
      } else {
        // 캐시가 없으면 기존 특정 날짜 운세 상태 비우기 (오늘/내일이 아닐 때만)
        if (date !== today() && date !== tomorrow()) {
          setSpecificFortune(null);
        }
        return null;
      }
    },
    [profile]
  );

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
        const fortune = await buildMonthlyFortune(year, month, profile, weeklyFortune);
        setMonthlyFortune(fortune);
      } catch (err) {
        console.error("월간 운세 조회 실패:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setMonthlyError(`한달 운세를 불러오지 못했습니다. (${errMsg})`);
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
    checkAndLoadCachedFortune,
  };
}
