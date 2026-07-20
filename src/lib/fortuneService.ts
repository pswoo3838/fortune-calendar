import type {
  UserProfile,
  WeeklyFortune,
  DailyFortune,
  MonthlySajuReport,
  FortuneGrade,
} from "../types/fortune";
import { fetchWeeklyFortune } from "./api";
import { saveWeeklyFortune, loadWeeklyFortuneSync } from "./storage";
import { getWeekRange } from "./dateUtils";

interface LuckyDayItem {
  date: string;
  grade: FortuneGrade;
  title: string;
  score?: number;
}

/**
 * 이번 달 행운의 날(Best Days) 상위 목록을 조회하는 공통 헬퍼 함수
 * '이번 달 행운의 날 카드'와 '990 월간 사주'에서 공통으로 참조하여 100% 데이터 정합성을 보장합니다.
 */
export async function getOrFetchLuckyDays(
  profile: UserProfile,
  year: number,
  month: number
): Promise<LuckyDayItem[]> {
  const cacheKey = `fortune_lucky_days_${profile.zodiac}_${year}_${month}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as LuckyDayItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("[LuckyDays] 캐시 읽기 에러:", e);
    }
  }

  // 캐시가 없으면 API 호출
  try {
    const daysInMonth = new Date(year, month, 0).getDate();
    const WORKER_URL =
      (import.meta.env.VITE_WORKER_URL as string | undefined) ||
      "https://fortune-worker.siuda3838.workers.dev";

    const res = await fetch(`${WORKER_URL}/api/fortune/monthly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zodiac: profile.zodiac,
        gender: profile.gender,
        birthDate: profile.birthDate,
        year,
        month,
        daysInMonth,
      }),
    });

    if (!res.ok) throw new Error("월간 운세 API 응답 에러");

    const data = (await res.json()) as { dailySummaries: LuckyDayItem[] };
    const good = data.dailySummaries
      .filter((d) => d.grade === "대길" || d.grade === "길")
      .sort((a, b) => {
        const gradeOrder: Record<string, number> = { 대길: 0, 길: 1 };
        return (gradeOrder[a.grade] ?? 2) - (gradeOrder[b.grade] ?? 2);
      })
      .slice(0, 10);

    try {
      localStorage.setItem(cacheKey, JSON.stringify(good));
    } catch (e) {
      console.warn("[LuckyDays] 캐시 저장 실패:", e);
    }

    return good;
  } catch (err) {
    console.error("[LuckyDays] fetch 에러:", err);
    return [];
  }
}

/**
 * 990 월간 사주풀이 리포트를 조회/생성합니다.
 */
export async function getMonthlySajuReport(
  profile: UserProfile,
  year: number,
  month: number // 1~12
): Promise<MonthlySajuReport> {
  const cacheKey = `fortune_monthly_saju_${profile.name}_${profile.zodiac}_${year}_${month}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      return JSON.parse(cached) as MonthlySajuReport;
    } catch (e) {
      console.warn("[MonthlySaju] 캐시 파싱 실패:", e);
    }
  }

  // 1) 행운의 날 공통 데이터 조회 (Best Days 정합성 보장)
  const luckyDays = await getOrFetchLuckyDays(profile, year, month);
  const bestDays = luckyDays.slice(0, 3).map((d) => d.date);

  let aiResult: any = null;
  try {
    const { fetchMonthlySaju } = await import("./api");
    aiResult = await fetchMonthlySaju({
      name: profile.name,
      zodiac: profile.zodiac,
      gender: profile.gender,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      year,
      month,
    });
  } catch (e) {
    console.warn("[MonthlySaju] API 호출 실패 (폴백 데이터 사용):", e);
  }

  const birthTimeText = profile.birthTime || "모름";

  const report: MonthlySajuReport = {
    year,
    month,
    userProfile: profile,
    monthlyOverview: {
      title: aiResult?.monthlyOverview?.title || `${month}월은 ${profile.zodiac}의 기운이 피어나 재물과 명예가 트이는 달`,
      description: aiResult?.monthlyOverview?.description || `${profile.name}님의 사주(${profile.birthDate} ${birthTimeText} 태생)와 ${year}년 ${month}월의 기운이 합(合)을 이루어 지혜와 성과가 돋보입니다. 초반에는 차분히 기운을 다지고 중반 이후부터 적극적인 활동을 펼치면 큰 유익이 따릅니다.`,
      scores: {
        overall: aiResult?.monthlyOverview?.scores?.overall ?? 88,
        wealth: aiResult?.monthlyOverview?.scores?.wealth ?? 92,
        love: aiResult?.monthlyOverview?.scores?.love ?? 80,
        career: aiResult?.monthlyOverview?.scores?.career ?? 86,
        health: aiResult?.monthlyOverview?.scores?.health ?? 78,
      },
    },
    weeklyFlow: aiResult?.weeklyFlow || [
      {
        week: 1,
        keyword: "기반 다지기 및 준비",
        advice: "월초에는 성급한 결정보다는 계획을 꼼꼼히 점검하고 마음의 여유를 가질 시기입니다.",
      },
      {
        week: 2,
        keyword: "귀인의 도움 및 수확",
        advice: "주변 인연이나 인맥을 통해 뜻밖의 도움이나 기회를 얻게 되는 길한 주간입니다.",
      },
      {
        week: 3,
        keyword: "재물운 상승 및 결실",
        advice: "노력해 온 일에서 실질적인 성과나 물질적 결실이 크게 맺히는 상승 기운입니다.",
      },
      {
        week: 4,
        keyword: "마무리 및 심신 충전",
        advice: "한 달을 마무리하며 무리한 지출이나 체력 소모를 피하고 다음 기운을 준비하세요.",
      },
    ],
    categoryFortunes: {
      wealth: aiResult?.categoryFortunes?.wealth || `${profile.name}님의 재물운은 이번 달 매우 왕성합니다. 수입의 기회가 다방면에서 생겨날 수 있으며, 장기적인 투자나 계획을 세우기에 아주 좋은 달입니다.`,
      love: aiResult?.categoryFortunes?.love || `인간관계와 애정면에서 화합의 기운이 깃듭니다. 대화 시 사소한 오해를 피하고 진솔함을 보여주면 상대방의 신뢰가 두터워집니다.`,
      career: aiResult?.categoryFortunes?.career || `직장 및 성과 영역에서 성실함이 빛을 발합니다. 중요한 발표나 도전 과제가 있다면 이달 중순 이후 추진하는 것을 추천합니다.`,
      health: aiResult?.categoryFortunes?.health || `전반적으로 안정적이나 과로로 인한 피로 누적을 유의해야 합니다. 규칙적인 수면과 가벼운 산책으로 심신 균형을 유지하세요.`,
    },
    monthlyPrescription: {
      luckyColor: aiResult?.monthlyPrescription?.luckyColor || "보라색 & 골드",
      luckyDirection: aiResult?.monthlyPrescription?.luckyDirection || "동남쪽",
      luckyNumber: aiResult?.monthlyPrescription?.luckyNumber ?? 7,
      luckyItem: aiResult?.monthlyPrescription?.luckyItem || "은은한 향수 또는 고급 필기구",
      avoidAction: aiResult?.monthlyPrescription?.avoidAction || "감정적인 대립이나 성급한 금전 거래",
      bestDays: bestDays.length > 0 ? bestDays : [`${year}-${String(month).padStart(2, "0")}-07`, `${year}-${String(month).padStart(2, "0")}-18`],
    },
    generatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(report));
  } catch (e) {
    console.warn("[MonthlySaju] 캐시 저장 실패:", e);
  }

  return report;
}

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
 * 저장된 월간 사주 캐시가 있는지 동기적으로 확인하고 반환합니다.
 */
export function getCachedMonthlySajuReportSync(
  profile: UserProfile | null,
  year: number,
  month: number
): MonthlySajuReport | null {
  if (!profile) return null;
  const cacheKey = `fortune_monthly_saju_${profile.name}_${profile.zodiac}_${year}_${month}`;
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as MonthlySajuReport;
  } catch (e) {
    return null;
  }
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

    const [yStr, mStr] = date.split("-");
    const luckyKey = `fortune_lucky_days_${profile.zodiac}_${Number(yStr)}_${Number(mStr)}`;
    const luckyCached = localStorage.getItem(luckyKey);
    let syncedFortune = { ...res.fortune, zodiac: profile.zodiac };

    if (luckyCached) {
      try {
        const luckyList = JSON.parse(luckyCached) as LuckyDayItem[];
        const match = luckyList.find((item) => item.date === date);
        if (match) {
          syncedFortune.grade = match.grade;
        }
      } catch (e) {}
    }

    await saveDailyFortune(syncedFortune); // 캐시에 저장하여 내일이 되어도 안바뀌게 함
    return syncedFortune;
  } catch (err) {
    console.error("fetchDailyFortune error:", err);
    throw new Error(`해당 날짜(${date})의 운세 데이터를 찾을 수 없습니다.`);
  }
}



