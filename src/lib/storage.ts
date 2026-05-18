/**
 * 저장소 유틸리티
 *
 * 앱인토스 환경에서는 네이티브 Storage API를 우선 사용하고,
 * 개발 환경에서는 localStorage로 폴백합니다.
 *
 * 네이티브 Storage는 WebView 초기화에 영향받지 않아 더 안정적입니다.
 * @see https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/Storage.md
 */

import type { UserProfile, WeeklyFortune, CalendarEvent, UnlockedFortunes, DailyFortune } from "../types/fortune";

const KEYS = {
  PROFILE: "fortune_user_profile",
  WEEKLY_FORTUNE: "fortune_weekly_cache",
  DAILY_FORTUNES: "fortune_daily_cache_v2", // 영구 저장용 (날짜별)
  CALENDAR_EVENTS: "fortune_calendar_events",
  UNLOCKED_FORTUNES: "fortune_unlocked_dates",
} as const;

// ──────────────────────────────────────────────
// 네이티브 Storage (앱인토스 환경)
// ──────────────────────────────────────────────
type StorageModule = {
  setItem: {
    (key: string, value: string): Promise<void>;
    isSupported?: () => boolean;
  };
  getItem: {
    (key: string): Promise<string | null>;
    isSupported?: () => boolean;
  };
  removeItem: {
    (key: string): Promise<void>;
    isSupported?: () => boolean;
  };
};

let _nativeStorage: StorageModule | null = null;
let _nativeChecked = false;

async function getNativeStorage(): Promise<StorageModule | null> {
  if (_nativeChecked) return _nativeStorage;
  _nativeChecked = true;

  try {
    const fw = await import("@apps-in-toss/web-framework");
    const fwAny = fw as any;
    if (fwAny.getItem?.isSupported?.()) {
      _nativeStorage = {
        setItem: fwAny.setItem,
        getItem: fwAny.getItem,
        removeItem: fwAny.removeItem,
      };
    }
  } catch {
    // 개발 환경 — localStorage만 사용
  }
  return _nativeStorage;
}

// ──────────────────────────────────────────────
// 범용 읽기/쓰기 (네이티브 우선, localStorage 폴백)
// ──────────────────────────────────────────────
async function storageGet(key: string): Promise<string | null> {
  const native = await getNativeStorage();
  if (native) {
    try {
      return await native.getItem(key);
    } catch {
      // 폴백
    }
  }
  return localStorage.getItem(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  // 항상 localStorage에 동기 저장 (즉시 반영용)
  localStorage.setItem(key, value);

  // 네이티브에도 비동기 저장 (영속성 보장)
  const native = await getNativeStorage();
  if (native) {
    try {
      await native.setItem(key, value);
    } catch {
      // localStorage만 사용
    }
  }
}

async function storageRemove(key: string): Promise<void> {
  localStorage.removeItem(key);
  const native = await getNativeStorage();
  if (native) {
    try {
      await native.removeItem(key);
    } catch {
      // 무시
    }
  }
}

// ──────────────────────────────────────────────
// 사용자 프로필
// ──────────────────────────────────────────────
export async function saveProfile(profile: UserProfile): Promise<void> {
  await storageSet(KEYS.PROFILE, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await storageGet(KEYS.PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearProfile(): Promise<void> {
  await storageRemove(KEYS.PROFILE);
}

// ──────────────────────────────────────────────
// 주간 운세 캐시
// ──────────────────────────────────────────────
export async function saveWeeklyFortune(fortune: WeeklyFortune): Promise<void> {
  await storageSet(KEYS.WEEKLY_FORTUNE, JSON.stringify(fortune));
  
  // Weekly 정보를 Daily Cache에도 영구 병합
  const dailyCache = await loadAllDailyFortunes();
  for (const f of fortune.dailyFortunes) {
    dailyCache[f.date] = f;
  }
  await storageSet(KEYS.DAILY_FORTUNES, JSON.stringify(dailyCache));
}

export async function loadWeeklyFortune(): Promise<WeeklyFortune | null> {
  const raw = await storageGet(KEYS.WEEKLY_FORTUNE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WeeklyFortune;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// 일간 운세 영구 캐시
// ──────────────────────────────────────────────
export async function loadAllDailyFortunes(): Promise<Record<string, DailyFortune>> {
  const raw = await storageGet(KEYS.DAILY_FORTUNES);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, DailyFortune>;
  } catch {
    return {};
  }
}

export async function saveDailyFortune(fortune: DailyFortune): Promise<void> {
  const dailyCache = await loadAllDailyFortunes();
  dailyCache[fortune.date] = fortune;
  await storageSet(KEYS.DAILY_FORTUNES, JSON.stringify(dailyCache));
}

export async function getCachedDailyFortune(date: string): Promise<DailyFortune | null> {
  const dailyCache = await loadAllDailyFortunes();
  return dailyCache[date] ?? null;
}

export async function clearWeeklyFortune(): Promise<void> {
  await storageRemove(KEYS.WEEKLY_FORTUNE);
}

// ──────────────────────────────────────────────
// 캘린더 일정 (로컬 저장)
// ──────────────────────────────────────────────
export async function saveCalendarEvents(events: CalendarEvent[]): Promise<void> {
  await storageSet(KEYS.CALENDAR_EVENTS, JSON.stringify(events));
}

export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  const raw = await storageGet(KEYS.CALENDAR_EVENTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CalendarEvent[];
  } catch {
    return [];
  }
}

export function loadCalendarEventsSync(): CalendarEvent[] {
  const raw = localStorage.getItem(KEYS.CALENDAR_EVENTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CalendarEvent[];
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// 열람(해금)된 운세 날짜
// ──────────────────────────────────────────────
export async function saveUnlockedFortunes(unlocked: UnlockedFortunes): Promise<void> {
  await storageSet(KEYS.UNLOCKED_FORTUNES, JSON.stringify(unlocked));
}

export async function loadUnlockedFortunes(): Promise<UnlockedFortunes> {
  const raw = await storageGet(KEYS.UNLOCKED_FORTUNES);
  if (!raw) return { dates: [] };
  try {
    return JSON.parse(raw) as UnlockedFortunes;
  } catch {
    return { dates: [] };
  }
}

export function loadUnlockedFortunesSync(): UnlockedFortunes {
  const raw = localStorage.getItem(KEYS.UNLOCKED_FORTUNES);
  if (!raw) return { dates: [] };
  try {
    return JSON.parse(raw) as UnlockedFortunes;
  } catch {
    return { dates: [] };
  }
}

export async function addUnlockedDate(date: string): Promise<void> {
  const current = await loadUnlockedFortunes();
  if (!current.dates.includes(date)) {
    current.dates.push(date);
    await saveUnlockedFortunes(current);
  }
}

// ──────────────────────────────────────────────
// 동기적 localStorage 폴백 (초기 렌더링 최적화용)
// ──────────────────────────────────────────────
export function loadProfileSync(): UserProfile | null {
  const raw = localStorage.getItem(KEYS.PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function loadWeeklyFortuneSync(): WeeklyFortune | null {
  const raw = localStorage.getItem(KEYS.WEEKLY_FORTUNE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WeeklyFortune;
  } catch {
    return null;
  }
}
