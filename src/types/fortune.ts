// 12지신 띠
export type Zodiac =
  | "쥐"
  | "소"
  | "호랑이"
  | "토끼"
  | "용"
  | "뱀"
  | "말"
  | "양"
  | "원숭이"
  | "닭"
  | "개"
  | "돼지";

export type Gender = "남" | "여";

// 운세 등급
export type FortuneGrade = "대길" | "길" | "보통" | "흉" | "대흉";

// 태어난 시간대 (시주)
export type BirthTimeSlot =
  | "자시" // 23:00~01:00
  | "축시" // 01:00~03:00
  | "인시" // 03:00~05:00
  | "묘시" // 05:00~07:00
  | "진시" // 07:00~09:00
  | "사시" // 09:00~11:00
  | "오시" // 11:00~13:00
  | "미시" // 13:00~15:00
  | "신시" // 15:00~17:00
  | "유시" // 17:00~19:00
  | "술시" // 19:00~21:00
  | "해시" // 21:00~23:00
  | "모름"; // 모르겠음

// 사용자 프로필 (localStorage 저장용)
export interface UserProfile {
  name: string; // 사용자 이름
  birthDate: string; // "YYYY-MM-DD"
  birthTime: BirthTimeSlot; // 태어난 시간
  gender: Gender;
  zodiac: Zodiac;
  consentedAt: string; // ISO timestamp
}

// 운세 점수 (카테고리별 점수)
export interface FortuneScores {
  overall: number; // 종합운 (0~100)
  wealth: number; // 재물운
  love: number; // 애정운
  health: number; // 건강운
  career: number; // 직장/학업운
  luck: number; // 행운지수
}

// 하루 운세
export interface DailyFortune {
  date: string; // "YYYY-MM-DD"
  zodiac: Zodiac;
  grade: FortuneGrade;
  title: string; // 한줄 요약 (예: "금전운이 빛나는 날")
  description: string; // 3~4문장 상세
  luckyColor: string;
  luckyNumber: number;
  luckyItem: string; // 오늘의 행운 아이템
  avoidAction: string; // 피해야 할 행동
  advice: string; // 오늘의 조언 한 줄
  scores: FortuneScores; // 카테고리별 점수
  timeFlow: {
    morning: number; // 0~100 오전 기운
    afternoon: number; // 0~100 오후 기운
    evening: number; // 0~100 저녁 기운
    night: number; // 0~100 밤 기운
  };
}

// 주간 운세 (토요일 자정에 일괄 생성)
export interface WeeklyFortune {
  weekStart: string; // "YYYY-MM-DD" (일요일)
  weekEnd: string; // "YYYY-MM-DD" (토요일)
  zodiac: Zodiac;
  dailyFortunes: DailyFortune[];
  generatedAt: string; // ISO timestamp
}

// 길일 / 손없는 날
export interface AuspiciousDay {
  date: string;
  type: "길일" | "손없는날";
  label: string; // 표시 텍스트
}

// 캘린더 날짜 데이터
export interface CalendarDayData {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  fortune?: DailyFortune; // 운세 확인 후에만 들어감
  auspiciousDays: AuspiciousDay[];
  events: CalendarEvent[]; // 사용자 일정
  lunarLabel?: string; // "음 4.18" 형식
  isSonEomneun?: boolean; // 손없는 날 여부
  holidayName?: string;   // 공휴일 이름 (없으면 undefined)
}

// 일정 카테고리
export type EventCategory = "personal" | "work" | "family" | "anniversary" | "other";

// 반복 규칙
export interface RepeatRule {
  type: "daily" | "weekly" | "monthly" | "yearly";
  days?: number[]; // weekly: [0..6] 요일 배열
  until?: string;  // 반복 종료일 "YYYY-MM-DD" (없으면 1년)
}

// 캘린더 일정 (로컬 저장)
export interface CalendarEvent {
  id: string;
  date: string;       // "YYYY-MM-DD" (시작일 또는 단일일)
  endDate?: string;   // 다일 일정 종료일 "YYYY-MM-DD"
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
  title: string;
  memo?: string;
  color: string;
  category: EventCategory;
  isDday?: boolean;         // D-day 지정 여부
  repeat?: RepeatRule;      // 양력 반복 규칙
  isHoliday?: boolean;      // 공휴일 (시스템 등록)
  createdAt: string;
  updatedAt?: string;
  // 음력 반복 일정 (제사 등)
  isLunarRecurring?: boolean;
  lunarMonth?: number;
  lunarDay?: number;
  lunarParentId?: string;
}

// 한달 운세 (여러 hook에서 공유)
export interface MonthlyFortune {
  year: number;
  month: number; // 0-indexed
  zodiac: Zodiac;
  dailyFortunes: DailyFortune[];
  generatedAt: string;
}

// 열람된(unlock된) 운세 날짜 목록
export interface UnlockedFortunes {
  dates: string[]; // "YYYY-MM-DD" 배열
}

// AI API 요청/응답
export interface AIFortuneRequest {
  zodiac: Zodiac;
  gender: Gender;
  birthDate: string;
  weekStart: string;
  weekEnd: string;
}

export interface AIFortuneResponse {
  dailyFortunes: Omit<DailyFortune, "zodiac">[];
}

// 990 월간 운세 — 코드 확정 사주팔자
export interface SajuPillarsData {
  yearPillar: string;           // "甲子"
  monthPillar: string;          // "丙寅"
  dayPillar: string;            // "庚午"
  hourPillar: string | null;    // "壬子" or null (모름)
  dominantElement: string;      // "토"
  weakElement: string;          // "수"
  monthGeon: string;            // "甲寅월"
}

// 990 월간 운세 풀이 리포트
export interface MonthlySajuReport {
  year: number;
  month: number; // 1-indexed (1~12)
  userProfile: UserProfile;
  sajuPillars?: SajuPillarsData; // 코드로 확정된 사주팔자
  monthlyOverview: {
    title: string;
    description: string;
    scores: {
      overall: number;
      wealth: number;
      love: number;
      career: number;
      health: number;
    };
  };
  weeklyFlow: {
    week: number;
    dateRange?: string; // "1일~7일"
    keyword: string;
    advice: string;
  }[];
  categoryFortunes: {
    wealth: string;
    love: string;
    career: string;
    health: string;
  };
  monthlyPrescription: {
    luckyColor: string;
    luckyDirection: string;
    luckyNumber: number;
    luckyItem: string;
    avoidAction: string;
    bestDays: string[]; // "YYYY-MM-DD"
  };
  generatedAt: string;
}

