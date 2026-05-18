import type {
  UserProfile,
  WeeklyFortune,
  DailyFortune,
} from "../types/fortune";
import { fetchWeeklyFortune } from "./api";
import { saveWeeklyFortune, loadWeeklyFortuneSync } from "./storage";
import { getWeekRange } from "./dateUtils";



/**
 * 주간 운세를 가져옵니다 (캐시 → API → 로컬 폴백)
 */
export async function getWeeklyFortune(
  profile: UserProfile,
): Promise<WeeklyFortune> {
  const now = new Date();
  const { start, end } = getWeekRange(now);

  // 1) 캐시 확인
  const cached = loadWeeklyFortuneSync();
  if (cached && cached.weekStart === start && cached.zodiac === profile.zodiac) {
    return cached;
  }

  // 2) API 전송 (폴백 없음)
  const response = await fetchWeeklyFortune({
    zodiac: profile.zodiac,
    gender: profile.gender,
    birthDate: profile.birthDate,
    weekStart: start,
    weekEnd: end,
  });

  const weekly: WeeklyFortune = {
    weekStart: start,
    weekEnd: end,
    zodiac: profile.zodiac,
    dailyFortunes: response.dailyFortunes.map((fortune) => ({
      ...fortune,
      zodiac: profile.zodiac,
    })),
    generatedAt: new Date().toISOString(),
  };

  void saveWeeklyFortune(weekly);
  return weekly;
}

/**
 * 특정 날짜의 운세 (주간 데이터에서 추출, 없으면 개별 API 조회)
 */
export async function getDailyFortune(
  date: string,
  profile: UserProfile,
  weeklyFortune?: WeeklyFortune | null,
): Promise<DailyFortune> {
  if (weeklyFortune) {
    const found = weeklyFortune.dailyFortunes.find((fortune) => fortune.date === date);
    if (found) return found;
  }

  // 주간 데이터에 없으면 daily API 호출
  const { fetchDailyFortune } = await import("./api");
  const { saveDailyFortune } = await import("./storage");
  try {
    const res = await fetchDailyFortune({
      zodiac: profile.zodiac,
      gender: profile.gender,
      birthDate: profile.birthDate,
      targetDate: date,
    });
    const newFortune = { ...res.fortune, zodiac: profile.zodiac };
    await saveDailyFortune(newFortune); // 캐시에 저장하여 내일이 되어도 안바뀌게 함
    return newFortune;
  } catch (err) {
    console.error("fetchDailyFortune error:", err);
    throw new Error(`해당 날짜(${date})의 운세 데이터를 찾을 수 없습니다.`);
  }
}


