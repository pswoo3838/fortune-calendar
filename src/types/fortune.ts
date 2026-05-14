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
}

// 캘린더 일정 (로컬 저장)
export interface CalendarEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  memo?: string;
  color: string; // 태그 색상
  createdAt: string;
  // 음력 반복 일정 (제사 등)
  isLunarRecurring?: boolean; // 음력 기반 매년 반복
  lunarMonth?: number; // 음력 월 (1~12)
  lunarDay?: number; // 음력 일
  lunarParentId?: string; // 원본 일정 ID (자동 생성된 반복 일정용)
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
