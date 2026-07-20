/**
 * manseryeok.ts — 만세력(萬歲曆) 사주팔자 계산 모듈
 *
 * 생년월일·시간으로부터 년주/월주/일주/시주를 확정 계산합니다.
 */

// ═══════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════

const STEMS     = ["갑","을","병","정","무","기","경","신","임","계"] as const;
const STEMS_HJ  = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;

const BRANCHES    = ["자","축","인","묘","진","사","오","미","신","유","술","해"] as const;
const BRANCHES_HJ = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;

const STEM_ELEMENT = ["목","목","화","화","토","토","금","금","수","수"] as const;
const BRANCH_ELEMENT = ["수","토","목","목","토","화","화","토","금","금","토","수"] as const;

const FIVE_ELEMENTS = ["목","화","토","금","수"] as const;

const BIRTH_TIME_BRANCH: Record<string, number> = {
  "자시": 0,  "축시": 1,  "인시": 2,  "묘시": 3,
  "진시": 4,  "사시": 5,  "오시": 6,  "미시": 7,
  "신시": 8,  "유시": 9,  "술시": 10, "해시": 11,
};

const JIE_TERMS = [
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

function toJD(year: number, month: number, day: number, hour = 12): number {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + B - 1524.5;
}

function toT(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

function degToRad(d: number): number { return d * Math.PI / 180; }

function solarLongitude(jd: number): number {
  const T = toT(jd);
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = degToRad(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const lon = L0 + C;
  return ((lon % 360) + 360) % 360;
}

function findSolarTermJD(year: number, targetLon: number, approxMonth: number): number {
  let lo = toJD(year, approxMonth, 1) - 20;
  let hi = lo + 40;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    let lon = solarLongitude(mid);
    let diff = lon - targetLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (diff < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface Pillar {
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
  hanja: string;
  element: string;
}

export interface FiveElementCount {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface SajuPillars {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;
  fiveElements: FiveElementCount;
  dominantElement: string;
  weakElement: string;
  monthGeonName: string;
}

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

const REF_EPOCH_MS = Date.UTC(2024, 0, 30); // 2024-01-30 UTC

function getDayPillarIndex(year: number, month: number, day: number): number {
  const targetMs = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((targetMs - REF_EPOCH_MS) / 86400000);
  return ((diffDays % 60) + 60) % 60;
}

function getYearPillarIndex(year: number, month: number, day: number): number {
  const lichunJD = findSolarTermJD(year, 315, 2);
  const dateJD = toJD(year, month, day);
  const effectiveYear = dateJD < lichunJD ? year - 1 : year;
  return ((effectiveYear - 4) % 60 + 60) % 60;
}

function getMonthPillar(
  year: number, month: number, day: number,
  yearStemIdx: number,
): { pillar: Pillar; monthGeonName: string } {
  const dateJD = toJD(year, month, day);
  let monthBranchIdx = 1;

  interface TermEntry { branchIdx: number; jd: number; name: string }
  const terms: TermEntry[] = [];

  for (const jt of JIE_TERMS) {
    let termYear = year;
    if (jt.approxMonth === 1 && month >= 7) {
      termYear = year + 1;
    }
    if (jt.approxMonth === 1 && month <= 6) {
      termYear = year;
    }
    const jd = findSolarTermJD(termYear, jt.longitude, jt.approxMonth);
    terms.push({ branchIdx: jt.branchIdx, jd, name: jt.name });
  }

  terms.sort((a, b) => a.jd - b.jd);

  for (let i = terms.length - 1; i >= 0; i--) {
    if (dateJD >= terms[i].jd) {
      monthBranchIdx = terms[i].branchIdx;
      break;
    }
  }

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

  const geonStem = STEMS_HJ[monthStemIdx];
  const geonBranch = BRANCHES_HJ[monthBranchIdx];
  const monthGeonName = `${geonStem}${geonBranch}월`;

  return { pillar, monthGeonName };
}

function getHourPillar(dayStemIdx: number, timeName: string, isYajasi = false): Pillar {
  const branchIdx = BIRTH_TIME_BRANCH[timeName] ?? 0;
  let targetBranchIdx = branchIdx;

  if (isYajasi && branchIdx === 0) {
    targetBranchIdx = 0;
  }

  const ratHourStemStart = ((dayStemIdx % 5) * 2) % 10;
  const hourStemIdx = (ratHourStemStart + targetBranchIdx) % 10;

  return {
    stem: STEMS[hourStemIdx],
    branch: BRANCHES[branchIdx],
    stemHanja: STEMS_HJ[hourStemIdx],
    branchHanja: BRANCHES_HJ[branchIdx],
    hanja: `${STEMS_HJ[hourStemIdx]}${BRANCHES_HJ[branchIdx]}`,
    element: STEM_ELEMENT[hourStemIdx],
  };
}

function countFiveElements(pillars: Pillar[]): FiveElementCount {
  const count: FiveElementCount = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const map: Record<string, keyof FiveElementCount> = {
    "목": "wood", "화": "fire", "토": "earth", "금": "metal", "수": "water",
  };

  for (const p of pillars) {
    const stemIdx = (STEMS as readonly string[]).indexOf(p.stem);
    const branchIdx = (BRANCHES as readonly string[]).indexOf(p.branch);
    count[map[STEM_ELEMENT[stemIdx]]]++;
    count[map[BRANCH_ELEMENT[branchIdx]]]++;
  }

  return count;
}

function determineDominantAndWeak(
  count: FiveElementCount,
  dayPillar: Pillar,
): { dominant: string; weak: string } {
  const elements: { name: string; count: number }[] = [
    { name: "목", count: count.wood },
    { name: "화", count: count.fire },
    { name: "토", count: count.earth },
    { name: "금", count: count.metal },
    { name: "수", count: count.water },
  ];

  elements.sort((a, b) => b.count - a.count);

  let dominant = elements[0].name;
  if (elements[0].count === elements[1].count) {
    const dayStemElement = dayPillar.element;
    if (elements[0].name === dayStemElement || elements[1].name === dayStemElement) {
      dominant = dayStemElement;
    }
  }

  elements.sort((a, b) => a.count - b.count);
  const weak = elements[0].name;

  return { dominant, weak };
}

export function calculateSaju(birthDate: string, birthTime: string): SajuPillars {
  const cleanDate = birthDate.replace(/[^0-9]/g, "");
  if (cleanDate.length !== 8) {
    throw new Error("birthDate must be YYYYMMDD");
  }

  const by = parseInt(cleanDate.substring(0, 4), 10);
  const bm = parseInt(cleanDate.substring(4, 6), 10);
  const bd = parseInt(cleanDate.substring(6, 8), 10);

  const yearStemIdx = getYearPillarIndex(by, bm, bd);
  const yearPillar = indexToPillar(yearStemIdx);

  const { pillar: monthPillar, monthGeonName } = getMonthPillar(by, bm, bd, yearStemIdx);

  let dayPillarIdx = getDayPillarIndex(by, bm, bd);
  const dayPillar = indexToPillar(dayPillarIdx);

  let hourPillar: Pillar | null = null;
  let isYajasi = false;

  if (birthTime && birthTime !== "모름") {
    let cleanTime = birthTime.trim();
    if (cleanTime === "자시") {
      isYajasi = false;
    }
    hourPillar = getHourPillar(dayPillarIdx % 10, cleanTime, isYajasi);
  }

  const activePillars: Pillar[] = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) {
    activePillars.push(hourPillar);
  }

  const fiveElements = countFiveElements(activePillars);
  const { dominant, weak } = determineDominantAndWeak(fiveElements, dayPillar);

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

export function getMonthGeon(year: number, month: number): { name: string; pillar: Pillar } {
  const lichunJD = findSolarTermJD(year, 315, 2);
  const approxMidJD = toJD(year, month, 15);

  const effectiveYear = approxMidJD < lichunJD ? year - 1 : year;
  const yearStemIdx = ((effectiveYear - 4) % 60 + 60) % 60;

  const { pillar, monthGeonName } = getMonthPillar(year, month, 15, yearStemIdx);

  return {
    name: monthGeonName,
    pillar,
  };
}
