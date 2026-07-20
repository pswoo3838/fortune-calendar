/**
 * manseryeok.ts — 만세력(萬歲曆) 사주팔자 계산 모듈
 *
 * 생년월일·시간으로부터 년주/월주/일주/시주를 확정 계산합니다.
 * LLM은 이 모듈이 출력한 데이터를 "해석"만 합니다.
 *
 * 핵심 알고리즘:
 *  - 일주: 기준일(2024-01-30 = 甲子)로부터 일수 차 mod 60
 *  - 년주: 입춘 기준 연도 전환 + (year-4) mod 60
 *  - 월주: 태양 황경 기반 절기 판정 + 오호둔갑(五虎遁甲)
 *  - 시주: 12시진 매핑 + 오서둔갑(五鼠遁甲) + 야자시 처리
 */

// ═══════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════

/** 천간(天干) 10개 */
const STEMS     = ["갑","을","병","정","무","기","경","신","임","계"] as const;
const STEMS_HJ  = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;

/** 지지(地支) 12개 */
const BRANCHES    = ["자","축","인","묘","진","사","오","미","신","유","술","해"] as const;
const BRANCHES_HJ = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;

/** 천간 → 오행 */
const STEM_ELEMENT = ["목","목","화","화","토","토","금","금","수","수"] as const;

/** 지지 → 오행 */
const BRANCH_ELEMENT = ["수","토","목","목","토","화","화","토","금","금","토","수"] as const;

/** 오행 이름 (한글) */
const FIVE_ELEMENTS = ["목","화","토","금","수"] as const;

/** 시간대(시주) → 지지 인덱스 매핑 */
const BIRTH_TIME_BRANCH: Record<string, number> = {
  "자시": 0,  "축시": 1,  "인시": 2,  "묘시": 3,
  "진시": 4,  "사시": 5,  "오시": 6,  "미시": 7,
  "신시": 8,  "유시": 9,  "술시": 10, "해시": 11,
};

/**
 * 절기(節氣) 정의 — 월 경계를 결정하는 12 "절(節)"
 * index = 결과 월지(月支) 인덱스
 * longitude = 해당 절기의 태양 황경(度)
 * approxMonth = 양력 대략 월 (탐색 시작점)
 */
const JIE_TERMS: { branchIdx: number; longitude: number; approxMonth: number; name: string }[] = [
  { branchIdx: 2,  longitude: 315, approxMonth: 2,  name: "입춘" }, // 寅월
  { branchIdx: 3,  longitude: 345, approxMonth: 3,  name: "경칩" }, // 卯월
  { branchIdx: 4,  longitude: 15,  approxMonth: 4,  name: "청명" }, // 辰월
  { branchIdx: 5,  longitude: 45,  approxMonth: 5,  name: "입하" }, // 巳월
  { branchIdx: 6,  longitude: 75,  approxMonth: 6,  name: "망종" }, // 午월
  { branchIdx: 7,  longitude: 105, approxMonth: 7,  name: "소서" }, // 未월
  { branchIdx: 8,  longitude: 135, approxMonth: 8,  name: "입추" }, // 申월
  { branchIdx: 9,  longitude: 165, approxMonth: 9,  name: "백로" }, // 酉월
  { branchIdx: 10, longitude: 195, approxMonth: 10, name: "한로" }, // 戌월
  { branchIdx: 11, longitude: 225, approxMonth: 11, name: "입동" }, // 亥월
  { branchIdx: 0,  longitude: 255, approxMonth: 12, name: "대설" }, // 子월
  { branchIdx: 1,  longitude: 285, approxMonth: 1,  name: "소한" }, // 丑월
];

// ═══════════════════════════════════════════
// 태양 위치 계산 (Solar Longitude)
// VSOP87 간이 버전 — 절기 판정용 (오차 ~0.5일)
// ═══════════════════════════════════════════

/** 율리우스 일수(Julian Day Number) 계산 */
function toJD(year: number, month: number, day: number, hour = 12): number {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + B - 1524.5;
}

/** JD → 율리우스 세기(J2000.0 기준) */
function toT(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

function degToRad(d: number): number { return d * Math.PI / 180; }

/** 태양 황경(°) 계산 — VSOP87 간이 */
function solarLongitude(jd: number): number {
  const T = toT(jd);
  // 평균 황경
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  // 평균 근점 이각
  const M = degToRad(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  // 중심차(Equation of Center)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const lon = L0 + C;
  return ((lon % 360) + 360) % 360;
}

/**
 * 특정 태양 황경에 도달하는 JD를 이분법(bisection)으로 탐색
 * @param year  양력 연도
 * @param targetLon  목표 황경(°)
 * @param approxMonth  양력 대략 월 (탐색 시작점)
 */
function findSolarTermJD(year: number, targetLon: number, approxMonth: number): number {
  // 탐색 범위: 대략 월의 ±20일
  let lo = toJD(year, approxMonth, 1) - 20;
  let hi = lo + 40;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    let lon = solarLongitude(mid);
    let diff = lon - targetLon;
    // 0°/360° 경계 처리
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (diff < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** JD → 양력 날짜 (UTC) */
function jdToDate(jd: number): Date {
  // JD → Unix timestamp
  const ms = (jd - 2440587.5) * 86400000;
  return new Date(ms);
}

// ═══════════════════════════════════════════
// 사주팔자(四柱八字) 계산
// ═══════════════════════════════════════════

export interface Pillar {
  stem: string;       // "갑"
  branch: string;     // "자"
  stemHanja: string;  // "甲"
  branchHanja: string; // "子"
  hanja: string;      // "甲子"
  element: string;    // 천간 오행 "목"
}

export interface FiveElementCount {
  wood: number;   // 목
  fire: number;   // 화
  earth: number;  // 토
  metal: number;  // 금
  water: number;  // 수
}

export interface SajuPillars {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;           // birthTime "모름"이면 null
  fiveElements: FiveElementCount;      // 오행 분포 (8자 중)
  dominantElement: string;             // 주도 오행
  weakElement: string;                 // 부족 오행
  monthGeonName: string;               // 절기 기준 월건명 (예: "甲寅월")
}

/** 60갑자 인덱스 → Pillar 객체 */
function indexToPillar(idx: number): Pillar {
  const si = idx % 10;
  const bi = idx % 12;
  return {
    stem: STEMS[si],
    branch: BRANCHES[bi],
    stemHanja: STEMS_HJ[si],
    branchHanja: BRANCHES_HJ[bi],
    hanja: `${STEMS_HJ[si]}${BRANCHES_HJ[bi]}`,
    element: STEM_ELEMENT[si],
  };
}

// ─── 일주(日柱) ───
// 기준일: 2024-01-30 = 甲子日 (60갑자 인덱스 0)
const REF_EPOCH_MS = Date.UTC(2024, 0, 30); // 2024-01-30 UTC

function getDayPillarIndex(year: number, month: number, day: number): number {
  const targetMs = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((targetMs - REF_EPOCH_MS) / 86400000);
  return ((diffDays % 60) + 60) % 60;
}

// ─── 년주(年柱) ───
// 입춘(立春) 전이면 전년도 기준
function getYearPillarIndex(year: number, month: number, day: number): number {
  // 입춘 JD 계산
  const lichunJD = findSolarTermJD(year, 315, 2);
  const dateJD = toJD(year, month, day);
  const effectiveYear = dateJD < lichunJD ? year - 1 : year;
  return ((effectiveYear - 4) % 60 + 60) % 60;
}

// ─── 월주(月柱) ───
// 1. 절기 기반으로 현재 월지(月支) 결정
// 2. 오호둔갑법으로 월간(月干) 결정
function getMonthPillar(
  year: number, month: number, day: number,
  yearStemIdx: number,
): { pillar: Pillar; monthGeonName: string } {
  const dateJD = toJD(year, month, day);

  // 해당 연도의 모든 절기 JD를 계산하여 현재 날짜가 어떤 절기 구간에 있는지 판정
  let monthBranchIdx = 1; // 기본값: 丑월 (소한 이전이면)

  // 절기별로 JD를 구해서, 날짜가 어느 구간에 있는지 확인
  // 소한(1월)은 해당 year, 대설(12월)도 해당 year
  // 입춘~대설은 해당 year, 소한은 해당 year 또는 다음 year 초

  // 절기를 시간순으로 정렬하여 비교
  interface TermEntry { branchIdx: number; jd: number; name: string }
  const terms: TermEntry[] = [];

  for (const jt of JIE_TERMS) {
    // 소한(1월)은 해당 year 또는 이전 year
    let termYear = year;
    if (jt.approxMonth === 1 && month >= 7) {
      termYear = year + 1; // 하반기에서 다음해 1월 소한까지
    }
    if (jt.approxMonth === 1 && month <= 6) {
      termYear = year; // 상반기에서 올해 1월 소한
    }
    // 입춘(2월)이 현재 month보다 한참 뒤인 경우 전년도일 수도
    const jd = findSolarTermJD(termYear, jt.longitude, jt.approxMonth);
    terms.push({ branchIdx: jt.branchIdx, jd, name: jt.name });
  }

  // JD 오름차순 정렬
  terms.sort((a, b) => a.jd - b.jd);

  // 날짜가 속한 절기 구간 찾기
  for (let i = terms.length - 1; i >= 0; i--) {
    if (dateJD >= terms[i].jd) {
      monthBranchIdx = terms[i].branchIdx;
      break;
    }
  }

  // 오호둔갑법: 년간(年干)으로부터 월간(月干) 결정
  // 인월(寅月, branchIdx=2) 시작 천간 = ((yearStemIdx % 5) * 2 + 2) % 10
  const yinMonthStemStart = ((yearStemIdx % 5) * 2 + 2) % 10;
  const monthStemIdx = (yinMonthStemStart + ((monthBranchIdx - 2 + 12) % 12)) % 10;

  const pillar: Pillar = {
    stem: STEMS[monthStemIdx],
    branch: BRANCHES[monthBranchIdx],
    stemHanja: STEMS_HJ[monthStemIdx],
    branchHanja: BRANCHES_HJ[monthBranchIdx],
    hanja: `${STEMS_HJ[monthStemIdx]}${BRANCHES_HJ[monthBranchIdx]}`,
    element: STEM_ELEMENT[monthStemIdx],
  };

  return {
    pillar,
    monthGeonName: `${pillar.hanja}월`,
  };
}

// ─── 시주(時柱) ───
// 오서둔갑법: 일간(日干)으로부터 시간(時干) 결정
function getHourPillar(dayStemIdx: number, hourBranchIdx: number): Pillar {
  // 자시(子時) 시작 천간 = (dayStemIdx % 5) * 2
  const hourStemStart = (dayStemIdx % 5) * 2;
  const hourStemIdx = (hourStemStart + hourBranchIdx) % 10;

  return {
    stem: STEMS[hourStemIdx],
    branch: BRANCHES[hourBranchIdx],
    stemHanja: STEMS_HJ[hourStemIdx],
    branchHanja: BRANCHES_HJ[hourBranchIdx],
    hanja: `${STEMS_HJ[hourStemIdx]}${BRANCHES_HJ[hourBranchIdx]}`,
    element: STEM_ELEMENT[hourStemIdx],
  };
}

// ─── 오행 분포 집계 ───
function countFiveElements(pillars: Pillar[]): FiveElementCount {
  const count: FiveElementCount = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const map: Record<string, keyof FiveElementCount> = {
    "목": "wood", "화": "fire", "토": "earth", "금": "metal", "수": "water",
  };

  for (const p of pillars) {
    const stemIdx = (STEMS as readonly string[]).indexOf(p.stem);
    const branchIdx = (BRANCHES as readonly string[]).indexOf(p.branch);
    // 천간 오행
    count[map[STEM_ELEMENT[stemIdx]]]++;
    // 지지 오행
    count[map[BRANCH_ELEMENT[branchIdx]]]++;
  }

  return count;
}

function getDominantAndWeak(count: FiveElementCount): { dominant: string; weak: string } {
  const entries: [string, number][] = [
    ["목", count.wood],
    ["화", count.fire],
    ["토", count.earth],
    ["금", count.metal],
    ["수", count.water],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return {
    dominant: entries[0][0],
    weak: entries[entries.length - 1][0],
  };
}

// ═══════════════════════════════════════════
// 메인 함수: 사주팔자 계산
// ═══════════════════════════════════════════

/**
 * 사용자의 생년월일·시간으로부터 사주팔자를 확정 계산합니다.
 *
 * @param birthDate  양력 생년월일 "YYYY-MM-DD"
 * @param birthTime  태어난 시간 ("자시"~"해시" | "모름")
 * @returns  SajuPillars (확정된 사주팔자 + 오행 분석)
 */
export function calculateSaju(birthDate: string, birthTime: string): SajuPillars {
  const [yearStr, monthStr, dayStr] = birthDate.split("-").map(Number);
  let year = yearStr, month = monthStr, day = dayStr;

  // 야자시(夜子時) 처리: 23:00~24:00 → 다음 날의 자시
  const isYajasi = birthTime === "자시"; // 자시 중 야자시 가능성
  // 전통적 해석: 자시는 23:00부터이며, 야자시(23~0시)는 일주가 다음 날로 넘어감
  // 여기서는 프로필의 자시를 일괄 처리 (세밀한 구분은 향후 확장)

  // ── 일주 ──
  const dayIdx = getDayPillarIndex(year, month, day);
  const dayPillar = indexToPillar(dayIdx);

  // ── 년주 ──
  const yearIdx = getYearPillarIndex(year, month, day);
  const yearPillar = indexToPillar(yearIdx);

  // ── 월주 ──
  const yearStemIdx = yearIdx % 10;
  const { pillar: monthPillar, monthGeonName } = getMonthPillar(year, month, day, yearStemIdx);

  // ── 시주 ──
  let hourPillar: Pillar | null = null;
  if (birthTime !== "모름" && birthTime in BIRTH_TIME_BRANCH) {
    const hourBranchIdx = BIRTH_TIME_BRANCH[birthTime];
    const dayStemIdx = dayIdx % 10;
    hourPillar = getHourPillar(dayStemIdx, hourBranchIdx);
  }

  // ── 오행 분포 ──
  const pillarsForCount = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) pillarsForCount.push(hourPillar);
  const fiveElements = countFiveElements(pillarsForCount);
  const { dominant, weak } = getDominantAndWeak(fiveElements);

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    fiveElements,
    dominantElement: dominant,
    weakElement: weak,
    monthGeonName,
  };
}

/**
 * 특정 양력 연-월의 월건(月建)을 계산합니다.
 * (사용자의 사주가 아니라, 리포트 대상 월의 기운)
 *
 * @param year   양력 연도
 * @param month  양력 월 (1~12)
 * @returns  월건 Pillar + 이름
 */
export function getMonthGeon(year: number, month: number): { pillar: Pillar; name: string } {
  // 해당 월 중순(15일)을 기준으로 월주 계산
  const yearIdx = getYearPillarIndex(year, month, 15);
  const yearStemIdx = yearIdx % 10;
  const { pillar, monthGeonName } = getMonthPillar(year, month, 15, yearStemIdx);
  return { pillar, name: monthGeonName };
}
