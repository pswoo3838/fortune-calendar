interface Env {
  OPENAI_API_KEY: string; // wrangler secret put OPENAI_API_KEY
  OPENAI_MODEL: string; // wrangler.toml [vars]
  ALLOWED_ORIGIN: string; // wrangler.toml [vars]
}

// --- 타입 정의 (프론트와 동일) ---

type Zodiac =
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

type Gender = "남" | "여";
type FortuneGrade = "대길" | "길" | "보통" | "흉" | "대흉";

interface DailyFortuneResult {
  date: string;
  grade: FortuneGrade;
  title: string;
  description: string;
  luckyColor: string;
  luckyNumber: number;
  luckyItem: string;
  avoidAction: string;
  advice: string;
  timeFlow: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

interface DailySummaryResult {
  date: string;
  grade: FortuneGrade;
  title: string;
}

interface AuspiciousDayResult {
  date: string;
  type: "길일" | "손없는날";
  label: string;
}

// --- 요청 타입 ---

interface DailyRequest {
  zodiac: Zodiac;
  gender: Gender;
  birthDate: string;
  targetDate: string;
}

interface MonthlyRequest {
  zodiac: Zodiac;
  gender: Gender;
  birthDate: string;
  year: number;
  month: number; // 1-12
  daysInMonth: number;
}

interface WeeklyRequest {
  zodiac: Zodiac;
  gender: Gender;
  birthDate: string;
  weekStart: string;
  weekEnd: string;
}

// --- CORS ---

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function corsResponse(env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env.ALLOWED_ORIGIN),
  });
}

function jsonResponse(data: unknown, env: Env, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(env.ALLOWED_ORIGIN),
    },
  });
}

function errorResponse(message: string, env: Env, status = 500): Response {
  return jsonResponse({ error: message }, env, status);
}

// --- 날짜 유틸 ---

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function datesBetween(start: string, end: string): string[] {
  const result: string[] = [];
  const current = parseDate(start);
  const endDate = parseDate(end);

  while (current.getTime() <= endDate.getTime()) {
    result.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// --- OpenAI 호출 ---

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  env: Env,
  temperature = 0.9,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return json.choices[0].message.content;
}

// --- 일별 운세 생성 ---

async function handleDaily(body: DailyRequest, env: Env): Promise<Response> {
  const systemPrompt = `당신은 한국 전통 운세 전문가입니다. 12지신(띠) 기반으로 정확하고 구체적인 일일 운세를 제공합니다.
반드시 아래 JSON 형식으로만 응답하세요.`;

  const userPrompt = `다음 정보로 ${body.targetDate} 날짜의 운세를 생성해주세요.

- 띠: ${body.zodiac}
- 성별: ${body.gender}
- 생년월일: ${body.birthDate}
- 대상 날짜: ${body.targetDate}

JSON 형식:
{
  "fortune": {
    "date": "${body.targetDate}",
    "grade": "대길|길|보통|흉|대흉 중 하나",
    "title": "운세 한줄 요약 (15자 이내)",
    "description": "3~4문장의 상세 운세 설명",
    "luckyColor": "행운의 색 (한국어)",
    "luckyNumber": 1~9 사이 숫자,
    "luckyItem": "오늘의 행운을 부르는 물건 (예: 파란우산, 가죽지갑)",
    "avoidAction": "오늘 피해야 할 행동 (예: 무리한 투자, 남쪽 방향 이동)",
    "advice": "오늘의 조언 한 줄 (20자 이내)",
    "scores": {
      "overall": 0~100 사이 종합 점수,
      "wealth": 0~10 사이 재물운 점수,
      "love": 0~10 사이 애정운 점수,
      "health": 0~10 사이 건강운 점수,
      "career": 0~10 사이 직장/학업운 점수,
      "luck": 0~10 사이 행운 점수
    },
    "timeFlow": {
      "morning": 0~100 사이 오전 기운 지수,
      "afternoon": 0~100 사이 오후 기운 지수,
      "evening": 0~100 사이 저녁 기운 지수,
      "night": 0~100 사이 밤 기운 지수
    }
  }
}`;

  try {
    const raw = await callOpenAI(systemPrompt, userPrompt, env);
    const parsed = JSON.parse(raw) as { fortune: DailyFortuneResult };

    if (!parsed.fortune || !parsed.fortune.date || !parsed.fortune.grade) {
      throw new Error("Invalid fortune format");
    }

    return jsonResponse(parsed, env);
  } catch (err) {
    console.error("Daily fortune error:", err);
    return errorResponse("운세 생성에 실패했습니다.", env);
  }
}

// --- 월간 운세 생성 ---

async function handleMonthly(body: MonthlyRequest, env: Env): Promise<Response> {
  const systemPrompt = `당신은 한국 전통 운세 전문가입니다. 12지신(띠) 기반으로 한 달치 운세 요약과 길일/손없는 날 정보를 제공합니다.
반드시 아래 JSON 형식으로만 응답하세요. dailySummaries 배열에는 해당 월의 모든 날짜가 포함되어야 합니다.`;

  const userPrompt = `다음 정보로 ${body.year}년 ${body.month}월 한달 운세를 생성해주세요.

- 띠: ${body.zodiac}
- 성별: ${body.gender}
- 생년월일: ${body.birthDate}
- 연도: ${body.year}
- 월: ${body.month}
- 해당 월 일수: ${body.daysInMonth}

JSON 형식:
{
  "dailySummaries": [
    {
      "date": "YYYY-MM-DD",
      "grade": "대길|길|보통|흉|대흉 중 하나",
      "title": "운세 한줄 요약 (15자 이내)"
    }
    // ... ${body.daysInMonth}개
  ],
  "auspiciousDays": [
    {
      "date": "YYYY-MM-DD",
      "type": "길일 또는 손없는날",
      "label": "표시 텍스트 (예: 길일, 손 없는 날)"
    }
    // 해당 월에서 특별히 좋거나 주의할 날 5~10개 선정
  ]
}

모든 날짜는 ${body.year}-${String(body.month).padStart(2, "0")}-DD 형식이어야 합니다.
등급 분포: 대길 약 10%, 길 약 30%, 보통 약 35%, 흉 약 20%, 대흉 약 5%`;

  try {
    const raw = await callOpenAI(systemPrompt, userPrompt, env);
    const parsed = JSON.parse(raw) as {
      dailySummaries: DailySummaryResult[];
      auspiciousDays: AuspiciousDayResult[];
    };

    if (!parsed.dailySummaries || !Array.isArray(parsed.dailySummaries)) {
      throw new Error("Invalid monthly format");
    }

    return jsonResponse(parsed, env);
  } catch (err) {
    console.error("Monthly fortune error:", err);
    return errorResponse("한달 운세 생성에 실패했습니다.", env);
  }
}

// --- 주간 운세 생성 (현재 프론트엔드 /api/fortune/weekly 호환용) ---

async function handleWeekly(body: WeeklyRequest, env: Env): Promise<Response> {
  const dates = datesBetween(body.weekStart, body.weekEnd);
  const systemPrompt = `당신은 한국 전통 운세 전문가입니다. 12지신(띠) 기반으로 일주일치 운세를 생성합니다.
반드시 JSON 형식으로만 응답하세요. dailyFortunes 배열에는 요청된 모든 날짜가 포함되어야 합니다.`;

  const userPrompt = `다음 정보로 ${body.weekStart}부터 ${body.weekEnd}까지 주간 운세를 생성해주세요.

- 띠: ${body.zodiac}
- 성별: ${body.gender}
- 생년월일: ${body.birthDate}
- 날짜 목록: ${dates.join(", ")}

JSON 형식:
{
  "dailyFortunes": [
    {
      "date": "YYYY-MM-DD",
      "grade": "대길|길|보통|흉|대흉 중 하나",
      "title": "운세 한줄 요약 (15자 이내)",
      "description": "3~4문장의 상세 운세 설명",
      "luckyColor": "행운의 색 (한국어)",
      "luckyNumber": 1~9 사이 숫자,
      "luckyItem": "오늘의 행운을 부르는 물건 (예: 파란우산, 가죽지갑)",
      "avoidAction": "오늘 피해야 할 행동 (예: 무리한 투자, 남쪽 방향 이동)",
      "advice": "오늘의 조언 한 줄 (20자 이내)",
      "scores": {
        "overall": 0~100 사이 종합 점수,
        "wealth": 0~10 사이 재물운 점수,
        "love": 0~10 사이 애정운 점수,
        "health": 0~10 사이 건강운 점수,
        "career": 0~10 사이 직장/학업운 점수,
        "luck": 0~10 사이 행운 점수
      },
      "timeFlow": {
        "morning": 0~100 사이 오전 기운 지수,
        "afternoon": 0~100 사이 오후 기운 지수,
        "evening": 0~100 사이 저녁 기운 지수,
        "night": 0~100 사이 밤 기운 지수
      }
    }
  ]
}`;

  try {
    const raw = await callOpenAI(systemPrompt, userPrompt, env);
    const parsed = JSON.parse(raw) as { dailyFortunes: DailyFortuneResult[] };

    if (!parsed.dailyFortunes || !Array.isArray(parsed.dailyFortunes)) {
      throw new Error("Invalid weekly format");
    }

    return jsonResponse(parsed, env);
  } catch (err) {
    console.error("Weekly fortune error:", err);
    return errorResponse("주간 운세 생성에 실패했습니다.", env);
  }
}

// --- 입력 검증 ---

const VALID_ZODIAC = new Set<string>(["쥐","소","호랑이","토끼","용","뱀","말","양","원숭이","닭","개","돼지"]);
const VALID_GENDER = new Set<string>(["남","여"]);

function validateCommonFields(body: Record<string, unknown>): string | null {
  if (!body.zodiac || !VALID_ZODIAC.has(body.zodiac as string)) return "유효하지 않은 띠입니다.";
  if (!body.gender || !VALID_GENDER.has(body.gender as string)) return "유효하지 않은 성별입니다.";
  if (!body.birthDate || typeof body.birthDate !== "string") return "생년월일이 필요합니다.";
  return null;
}

interface MonthlySajuRequest {
  name: string;
  zodiac: Zodiac;
  gender: Gender;
  birthDate: string;
  birthTime?: string;
  year: number;
  month: number;
}

// --- 990 월간 운세 생성 (gpt-4o-mini + 만세력 코드 계산) ---

import { calculateSaju, getMonthGeon } from "./manseryeok";
import { getOhengLucky } from "./oheng";

/** 해당 월의 주차 수 계산 (4 또는 5) */
function getWeekCount(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=일 ~ 6=토
  return Math.ceil((daysInMonth + firstDayOfWeek) / 7);
}

/** 주차별 날짜 범위 문자열 생성 */
function getWeekDateRanges(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekCount = getWeekCount(year, month);
  const ranges: string[] = [];
  for (let w = 0; w < weekCount; w++) {
    const start = w * 7 + 1;
    const end = Math.min((w + 1) * 7, daysInMonth);
    ranges.push(`${start}일~${end}일`);
  }
  return ranges;
}

/** 월간 운세 응답 스키마 검증 */
function validateMonthlySajuSchema(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  // monthlyOverview 검증
  const overview = d.monthlyOverview as Record<string, unknown> | undefined;
  if (!overview || typeof overview.title !== "string" || typeof overview.description !== "string") return false;
  const scores = overview.scores as Record<string, unknown> | undefined;
  if (!scores) return false;
  for (const key of ["overall", "wealth", "love", "career", "health"]) {
    if (typeof scores[key] !== "number") return false;
  }

  // weeklyFlow 검증
  if (!Array.isArray(d.weeklyFlow) || d.weeklyFlow.length < 4) return false;
  for (const w of d.weeklyFlow) {
    if (typeof w !== "object" || !w) return false;
    const wk = w as Record<string, unknown>;
    if (typeof wk.week !== "number" || typeof wk.keyword !== "string" || typeof wk.advice !== "string") return false;
  }

  // categoryFortunes 검증
  const cat = d.categoryFortunes as Record<string, unknown> | undefined;
  if (!cat) return false;
  for (const key of ["wealth", "love", "career", "health"]) {
    if (typeof cat[key] !== "string") return false;
  }

  // monthlyPrescription 검증
  const presc = d.monthlyPrescription as Record<string, unknown> | undefined;
  if (!presc || typeof presc.luckyItem !== "string" || typeof presc.avoidAction !== "string") return false;

  return true;
}

const BACKEND_MONTHLY_VARIATIONS: Record<number, {
  titleSuffix: string;
  descTheme: string;
  scores: { overall: number; wealth: number; love: number; career: number; health: number };
  wealthText: string;
  loveText: string;
  careerText: string;
  healthText: string;
  avoidAction: string;
}> = {
  1: {
    titleSuffix: "소한의 기운 속 내실을 다지고 새 발판을 마련하는 달",
    descTheme: "동토(凍土) 속에서 서서히 싹을 틔울 온기가 감도는 시기입니다. 겉으로 드러나는 과격한 활동보다 깊은 생각과 기본기 점검이 큰 유익을 안겨줍니다.",
    scores: { overall: 76, wealth: 72, love: 80, career: 75, health: 70 },
    wealthText: "비겁과 인성의 자양분 기운으로 재물 낭비가 축소되고 시드머니를 안전하게 수호하기 유리합니다.",
    loveText: "은근하고 지속적인 차분한 소통이 빛을 발합니다. 진솔하고 듬직한 모습을 보여줄 때 신뢰가 상승합니다.",
    careerText: "지난 성과를 정돈하고 체계적인 마일스톤을 확립할 직장/학업 기운입니다.",
    healthText: "체온 유지와 관절 관리가 시급한 달입니다. 따뜻한 음료로 하체의 혈액순환을 도우세요.",
    avoidAction: "추위에 몸이 움츠러든 상태에서 섣부른 운동이나 늦은 밤 찬 바람 노출은 피하세요."
  },
  2: {
    titleSuffix: "입춘의 생동하는 도약 기운과 희망의 달",
    descTheme: "양목(陽木)의 푸른 생기 기운이 사주 전반에 생기를 불어넣는 훌륭한 계절입니다. 멈춰있던 계획이 움직입니다.",
    scores: { overall: 88, wealth: 84, love: 86, career: 90, health: 80 },
    wealthText: "식상 생재(食傷生財)의 이로운 파동이 흘러들어 예상치 못한 부수입이나 상여금 수혜가 기대됩니다.",
    loveText: "새로운 인연과의 상생 기운이 화사하게 피어납니다. 적극적인 모임 진입이 유리합니다.",
    careerText: "목(木)의 도약 기운을 받아 새로운 프로젝트 발탁이나 승진 기회가 큽니다.",
    healthText: "봄 기운의 명랑함과 함께 활동량이 증가하니 수면 습관을 동반하시기 바랍니다.",
    avoidAction: "의욕이 지나쳐 주위 사람들의 순서를 넘어서는 과욕이나 직언은 경계하십시오."
  },
  3: {
    titleSuffix: "경칩의 왕성한 소통과 성장 에너지가 만발하는 달",
    descTheme: "만물이 기지개를 켜며 본연의 지혜와 재능이 밖으로 표출되는 묘(卯)월의 흐름입니다.",
    scores: { overall: 85, wealth: 82, love: 90, career: 84, health: 78 },
    wealthText: "재성의 정교한 운기가 함께하여 합리적인 지출과 유익한 재테크 정보 취득이 용이합니다.",
    loveText: "연인 혹은 지인과의 대화에서 매력이 돋보이며 묵은 갈등이 말끔히 해소됩니다.",
    careerText: "조직 내 창의적 기획이나 팀워크 작업에서 중추 역할을 맡아 협상력을 발휘합니다.",
    healthText: "스트레스 지수가 낮아지고 밝은 기운이 감돕니다. 호흡기 관리 청결에 신경 쓰세요.",
    avoidAction: "주변 소문에 휘둘려 검증되지 않은 분야에 섣부른 주식을 매수하는 행위는 피하세요."
  },
  4: {
    titleSuffix: "청명의 조화로운 기운으로 기반을 단단히 굳히는 달",
    descTheme: "진(辰)토의 풍요로운 영양소가 주도 오행과 조화를 이루어 안정을 선사합니다.",
    scores: { overall: 81, wealth: 86, love: 78, career: 82, health: 80 },
    wealthText: "토(土)의 정착 기운이 재물을 지켜주어 예기치 못한 금전 지출을 방지합니다.",
    loveText: "화려한 분위기보다 잔잔하고 무게감 있는 인연이 돋보이며 진실성이 빛납니다.",
    careerText: "수행해 오던 일의 완성도가 대폭 상향되며 상사의 두터운 신뢰를 얻습니다.",
    healthText: "위장과 소화기 계통의 밸런스가 균형을 찾아갑니다. 규칙적 식단이 유리합니다.",
    avoidAction: "자신의 고집을 유연성 없이 고수하여 주변과의 소통 문을 닫는 태도는 자제하세요."
  },
  5: {
    titleSuffix: "입하의 정열적인 화(火) 기운과 명예 상승의 달",
    descTheme: "사(巳)월의 화사한 양기(陽氣)가 가득 차 오르며 관성과 명예 운기가 발산합니다.",
    scores: { overall: 89, wealth: 79, love: 85, career: 94, health: 74 },
    wealthText: "명예운의 상승이 재물 수입으로 간접 연계되는 선순환 구조를 그립니다.",
    loveText: "당당하고 열정적인 기운이 이성의 시선을 사로잡아 호감도가 진전됩니다.",
    careerText: "직장이나 학업에서 성과나 승진 등 뚜렷한 결과물이 창출되는 길운입니다.",
    healthText: "화기운 과잉으로 인한 가슴 답답함이나 혈압에 유의하며 수분을 보충하세요.",
    avoidAction: "감정이 상했을 때 순간의 화를 참지 못하고 격한 언쟁으로 발전시키지 마세요."
  },
  6: {
    titleSuffix: "망종의 열매 맺기 직전 절정의 에너지 발산의 달",
    descTheme: "오(午)월의 태양이 높이 떠올라 사주의 열매가 결실을 맺을 채비를 가다듬습니다.",
    scores: { overall: 86, wealth: 85, love: 82, career: 88, health: 72 },
    wealthText: "재성 기운의 왕성함이 금전적 수혜와 인센티브로 연계됩니다.",
    loveText: "밝고 명랑한 태도가 분위기를 리드하여 공통의 목표를 형성할 최적의 달입니다.",
    careerText: "과감한 결단과 빠른 결정력이 프로젝트 성과를 신속히 촉진합니다.",
    healthText: "여름철 신체 에너지 소모가 크니 충분한 숙면과 냉방병 예방에 신경 쓰세요.",
    avoidAction: "서두르다 중요한 데이터나 계약 조항의 세부사항을 누락하지 않도록 하세요."
  },
  7: {
    titleSuffix: "소서의 차분한 결실 준비와 완충의 달",
    descTheme: "미(未)토의 다정하고 포근한 기운이 여름의 열기를 부드럽게 감싸 안습니다.",
    scores: { overall: 80, wealth: 83, love: 81, career: 80, health: 79 },
    wealthText: "현재 자산 가치의 보존과 안정적 수익에 유리하니 내실을 단단히 하세요.",
    loveText: "서로에 대한 이해심과 자상함이 빛을 발하는 따스한 시간이 가득합니다.",
    careerText: "진행 중인 사안의 내실 검토와 오류 수정이 안전한 마무리를 이끌어 냅니다.",
    healthText: "소화기 및 피부 건조 현상을 방지하고자 습도와 자극 없는 음식에 힘쓰세요.",
    avoidAction: "주위 사람들의 평가나 지적에 과도하게 민감하게 반응하지 마십시오."
  },
  8: {
    titleSuffix: "입추의 서늘하고 정교한 금(金) 기운과 수확의 달",
    descTheme: "신(申)금의 예리하고 정확한 결단력이 사주팔자에 작용하는 계절입니다.",
    scores: { overall: 87, wealth: 88, love: 79, career: 89, health: 81 },
    wealthText: "투자금 회수나 성과급 지급 등 노력에 비례하는 금전 결실이 손에 쥐어집니다.",
    loveText: "이성적인 대화로 상대방과 현실적인 장래를 도모하기 유리한 쿨한 기운입니다.",
    careerText: "분석력과 일처리 속도가 최고조에 달해 업무적 명성을 획득합니다.",
    healthText: "호흡기 및 척추 관절 밸런스를 가벼운 스트레칭으로 잡아주세요.",
    avoidAction: "차가운 말투나 너무 냉정한 지적으로 타인의 마음에 상처를 주지 마세요."
  },
  9: {
    titleSuffix: "백로의 풍요로운 결실과 재물 정착의 달",
    descTheme: "유(酉)금의 순수하고 고귀한 결정체가 실질적 결실로 승화되는 9월입니다.",
    scores: { overall: 91, wealth: 93, love: 84, career: 89, health: 80 },
    wealthText: "정재(正財)의 맑은 파동이 재물 저장소를 가득 채워 자산이 불어납니다.",
    loveText: "정성스러운 배려가 결실을 맺어 상대방의 마음을 여는 애정전선이 펼쳐집니다.",
    careerText: "수행한 결과물이 최고 품질로 완성되어 대내외적 호평을 입증합니다.",
    healthText: "심신이 안정적이니 활발한 신체 활동과 비타민 섭취를 유지하세요.",
    avoidAction: "완벽주의 기준을 주변 동료에게 강요하는 고집은 자제하는 것이 좋습니다."
  },
  10: {
    titleSuffix: "한로의 풍성한 자산 저장과 깊은 지혜의 달",
    descTheme: "술(戌)토의 지혜로운 자산 보관 창고가 열리며 내실을 다지는 시기입니다.",
    scores: { overall: 83, wealth: 87, love: 80, career: 82, health: 77 },
    wealthText: "재물창고(財庫) 오행이 발동하여 내실 있는 알짜배기 자산이 쌓입니다.",
    loveText: "서로의 허물을 감싸 안는 포용력 속에서 깊은 정을 나누게 됩니다.",
    careerText: "묵묵히 다져온 역량이 빛을 발하여 든든한 존재감으로 난제를 해결합니다.",
    healthText: "하체 신진대사 관리가 유효하니 따뜻한 음료와 유산소 운동을 곁들이세요.",
    avoidAction: "새로운 사업 확장이나 불확실한 신규 계약 체결을 성급히 진행하지 마세요."
  },
  11: {
    titleSuffix: "입동의 깊은 생각과 유연한 지혜가 솟구치는 달",
    descTheme: "해(亥)수의 유연하고 도도한 물길처럼 지혜와 통찰력이 깊어지는 달입니다.",
    scores: { overall: 84, wealth: 79, love: 86, career: 85, health: 78 },
    wealthText: "식상 및 인성의 조화로 지식 기반 배움에 대한 투자 가치가 상승합니다.",
    loveText: "깊은 감성적 소통 속에 마음속 고민을 나누며 한층 더 가까워집니다.",
    careerText: "기획력과 정보 수집 능력이 극대화되어 성공적인 해법을 도출합니다.",
    healthText: "수(水)기운 유입으로 방한과 체온 보존에 각별히 신경 쓰시기 바랍니다.",
    avoidAction: "생각이 너무 많아 실행을 지체하여 좋은 타임라인을 놓치지 마세요."
  },
  12: {
    titleSuffix: "대설의 수(水) 기운 절정과 도약을 위한 충전의 달",
    descTheme: "자(子)월의 맑은 수기운이 깃들어 내면의 에너지를 축적하는 희망찬 달입니다.",
    scores: { overall: 82, wealth: 81, love: 83, career: 80, health: 76 },
    wealthText: "자금 유출을 막고 시드머니를 응축하여 알차게 통장을 관리하세요.",
    loveText: "아늑한 공간에서 오순도순 담소를 나누며 깊은 유대감을 다지기 좋습니다.",
    careerText: "한 해를 돌아보고 차기 연도의 전략 과제를 수립하는 고찰의 시간입니다.",
    healthText: "신장 및 허리 피로를 주의하고 하체를 온열 패드로 따뜻하게 하세요.",
    avoidAction: "추운 날씨에 무리한 외출이나 오한을 일으키는 무분별한 과음은 삼가세요."
  }
};

/** 검증 실패 시 fallback JSON 생성 (개인화 및 풍성한 풀이 템플릿 제공) */
function buildFallbackSajuResponse(
  name: string,
  month: number,
  weekCount: number,
  weekRanges: string[],
  zodiac: string,
  gender: string,
): Record<string, unknown> {
  const mData = BACKEND_MONTHLY_VARIATIONS[month] || BACKEND_MONTHLY_VARIATIONS[9];

  const weeklyFlow = weekRanges.map((range, i) => {
    const keywords = ["기반 확립 및 탐색", "동반자 및 귀인 협력", "실질 성과 및 도약", "수확 및 자금 정리", "지혜로운 마무리"];
    const advices = [
      "월초에는 새로운 기운을 받아들일 준비를 하는 주간입니다. 주변 상황을 관찰하고 신중히 계획을 다지세요.",
      "대인관계에서 뜻밖의 조력자나 좋은 정보를 만날 운기입니다. 소통을 늘리고 의견에 경청해 보세요.",
      "그동안 공들여온 일이 탄력을 받아 속도가 붙기 시작합니다. 적극적으로 본인의 의사를 표현할 때입니다.",
      "금전과 실질적 결과가 내 주머니로 들어오는 좋은 기운이 돕습니다. 맺고 끊음을 확실히 하면 더욱 길합니다.",
      "이달의 성과를 온전히 보관하고 체력을 안배하며 휴식을 취하는 것이 유리한 시기입니다.",
    ];
    return {
      week: i + 1,
      dateRange: range,
      keyword: keywords[i] || "흐름 유지",
      advice: advices[i] || "차분하게 본인의 중심을 지키고 다음 기운을 준비해 보세요.",
    };
  });

  const overallTitle = `${zodiac}띠 ${name}님을 위한 ${month}월 - ${mData.titleSuffix}`;
  const overallDesc = `${name}님의 태어난 해의 기운과 ${month}월의 절기 흐름을 대조하여 분석한 결과, ${mData.descTheme} 초반부에는 주춤할 수 있으나 중반 이후부터 본인의 부족한 오행을 채워줄 긍정적인 파동이 함께하니, 용기를 가지고 임하시길 바랍니다.`;

  return {
    monthlyOverview: {
      title: overallTitle,
      description: overallDesc,
      scores: mData.scores,
    },
    weeklyFlow,
    categoryFortunes: {
      wealth: `${name}님의 이번 ${month}월 금전운: ${mData.wealthText}`,
      love: `애정과 인연 영역: ${mData.loveText}`,
      career: `${zodiac}띠 ${gender}성 ${name}님의 일/학업적 기운: ${mData.careerText}`,
      health: `심신 관리: ${mData.healthText}`,
    },
    monthlyPrescription: {
      luckyItem: "우디 계열 디퓨저 또는 스마트 워치 스트랩",
      avoidAction: mData.avoidAction,
    },
  };
}

async function handleMonthlySaju(body: MonthlySajuRequest, env: Env): Promise<Response> {
  // ═══ 1. 만세력 코드 계산 (확정 데이터) ═══
  const birthTime = body.birthTime || "모름";
  const saju = calculateSaju(body.birthDate, birthTime);
  const monthGeon = getMonthGeon(body.year, body.month);
  const ohengLucky = getOhengLucky(saju.weakElement, body.year, body.month);

  // ═══ 2. 동적 주차 수 계산 ═══
  const weekCount = getWeekCount(body.year, body.month);
  const weekRanges = getWeekDateRanges(body.year, body.month);
  const weeklyFlowSchema = weekRanges.map((range, i) =>
    `    { "week": ${i + 1}, "dateRange": "${range}", "keyword": "${i + 1}주차 핵심 키워드 (4~8자)", "advice": "${i + 1}주차 조언 및 행동 지침 (80자 이내)" }`
  ).join(",\n");

  // ═══ 3. 프롬프트 구성 ═══
  const systemPrompt = `당신은 대한민국 최고의 사주 명리학 해석 전문가이자 명리 철학원 원장입니다.
아래에 코드로 정확히 계산된 사주팔자(四柱八字)와 오행 분포가 제공됩니다.
당신의 역할은 이 확정된 사주 데이터를 바탕으로 이달의 운세를 아주 "풍부하고 심도 있게" 해석하는 것입니다.
간지를 직접 계산하거나 추측하지 마세요. 제공된 사주 데이터만 참조하세요.
반드시 경어체(~님, ~습니다)를 유지하고, 단정적 투자·의료 조언은 피하세요.
모든 내용은 재미와 참고 목적임을 전제합니다.
유료 상품(990원 상당)이므로 내용이 절대 짧거나 뻔하지 않고 성의 있게 자세히 작성되어야 합니다.
반드시 정확한 JSON 형식으로만 응답하세요.`;

  const hourPillarLine = saju.hourPillar
    ? `- 시주(時柱): ${saju.hourPillar.hanja} (${saju.hourPillar.stem}${saju.hourPillar.branch})`
    : `- 시주(時柱): 미상 (태어난 시간 모름)`;

  const userPrompt = `## 사용자 정보
- 이름: ${body.name}
- 성별: ${body.gender}
- 양력 생년월일: ${body.birthDate}
- 태어난 시간: ${birthTime}
- 띠: ${body.zodiac}

## 코드로 확정된 사주팔자 (변경 불가 — 이 데이터를 기반으로 해석만 하세요)
- 년주(年柱): ${saju.yearPillar.hanja} (${saju.yearPillar.stem}${saju.yearPillar.branch})
- 월주(月柱): ${saju.monthPillar.hanja} (${saju.monthPillar.stem}${saju.monthPillar.branch})
- 일주(日柱): ${saju.dayPillar.hanja} (${saju.dayPillar.stem}${saju.dayPillar.branch})
${hourPillarLine}
- 오행 분포: 목${saju.fiveElements.wood} 화${saju.fiveElements.fire} 토${saju.fiveElements.earth} 금${saju.fiveElements.metal} 수${saju.fiveElements.water}
- 주도 오행: ${saju.dominantElement} / 부족 오행: ${saju.weakElement}

## 해당 월 정보
- 양력: ${body.year}년 ${body.month}월
- 월건(月建): ${monthGeon.name} (${monthGeon.pillar.hanja}, 절기 기준)

## 출력 규칙 (반드시 준수 - 미준수 시 실격)
- scores는 40~95 범위에서 항목별 편차를 두고, 최소 1개 항목은 60 이하로 현실감 있게 배분하세요.
- monthlyOverview.description은 제공된 사주팔자(예: ${saju.dayPillar.hanja})와 이달의 월건(예: ${monthGeon.pillar.hanja})의 간섭 현상(생, 극, 합, 충 등)을 엮어서 **최소 250자에서 최대 450자 이내**로 전문적이고 심도 있게 사주 총평을 작성하세요.
- categoryFortunes의 각 항목(wealth, love, career, health)은 명리학적 개념(예: 재성, 관성, 식상, 인성, 비겁 등)을 적재적소에 자연스럽게 섞어서 **최소 300자에서 최대 500자 이내**로 매우 정성스럽고 상세하게 서술하세요. (내용이 뻔하거나 3문장 이하로 짧으면 안 됩니다. 돈 아깝다는 말이 절대 안 나오게 실질적 지침을 제공해 주세요.)
- weeklyFlow는 반드시 ${weekCount}개 항목으로 작성하세요 (이번 달은 ${weekCount}주).
- avoidAction은 "~하면 좋지 않을 수 있습니다", "~을 자제하시면 더욱 좋겠습니다" 등 부드러운 톤을 유지하세요.
- luckyItem은 일상에서 쉽게 접할 수 있는 구체적 물건으로 작성하세요.
- 사주팔자 한자를 본문에 자연스럽게 인용하여 신뢰감을 주되, 가독성을 해치지 않게 하세요.

## 요구되는 JSON 형식:
{
  "monthlyOverview": {
    "title": "${body.month}월 핵심 운세 헤드라인 (예: ${saju.dayPillar.hanja}일주에 ${monthGeon.pillar.hanja}월건이 만나 재물운이 트이는 달) (30자 이내)",
    "description": "${body.name}님의 사주 해석 총평 (250자 이상 450자 이내, 경어체. 천간과 지지의 상호작용 포함)",
    "scores": {
      "overall": 40~95 사이 종합운 점수 (정수),
      "wealth": 40~95 사이 재물운 점수 (정수),
      "love": 40~95 사이 애정운 점수 (정수),
      "career": 40~95 사이 직장/학업운 점수 (정수),
      "health": 40~95 사이 건강운 점수 (정수)
    }
  },
  "weeklyFlow": [
${weeklyFlowSchema}
  ],
  "categoryFortunes": {
    "wealth": "재물 및 금전 운세 상세 풀이 (명리학 십신 개념 섞어 300자 이상 500자 이내)",
    "love": "애정 및 인간관계 운세 상세 풀이 (명리학 십신 개념 섞어 300자 이상 500자 이내)",
    "career": "직장, 사업, 학업 운세 상세 풀이 (명리학 십신 개념 섞어 300자 이상 500자 이내)",
    "health": "건강 및 심신 관리 주의사항 (구체적 밸런스 팁 포함 300자 이상 500자 이내)"
  },
  "monthlyPrescription": {
    "luckyItem": "부족 오행(${saju.weakElement})을 보완하는 구체적 행운 아이템 (30자 이내)",
    "avoidAction": "이달에 조심하면 좋을 행동 (부드러운 톤, 80자 이내)"
  }
}`;

  // ═══ 4. OpenAI 호출 + 스키마 검증 + 1회 재시도 ═══
  let parsed: Record<string, unknown> | null = null;
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenAI(systemPrompt, userPrompt, env, 0.4);
      const result = JSON.parse(raw);
      if (validateMonthlySajuSchema(result)) {
        parsed = result;
        break;
      }
      lastError = `스키마 검증 실패 (시도 ${attempt + 1})`;
      console.warn(lastError);
    } catch (err) {
      lastError = `파싱/호출 에러 (시도 ${attempt + 1}): ${err}`;
      console.error(lastError);
    }
  }

  // 2회 실패 시 fallback
  if (!parsed) {
    console.error("Monthly Saju: 2회 실패, fallback 사용. 마지막 에러:", lastError);
    parsed = buildFallbackSajuResponse(body.name, body.month, weekCount, weekRanges, body.zodiac, body.gender);
  }

  // ═══ 5. 코드 확정값으로 오버라이드 ═══
  const presc = parsed.monthlyPrescription as Record<string, unknown>;
  presc.luckyColor = ohengLucky.luckyColor;
  presc.luckyDirection = ohengLucky.luckyDirection;
  presc.luckyNumber = ohengLucky.luckyNumber;

  // weeklyFlow에 dateRange 보장
  if (Array.isArray(parsed.weeklyFlow)) {
    for (let i = 0; i < parsed.weeklyFlow.length; i++) {
      const w = parsed.weeklyFlow[i] as Record<string, unknown>;
      if (!w.dateRange && weekRanges[i]) {
        w.dateRange = weekRanges[i];
      }
    }
  }

  // 사주팔자 확정 데이터 첨부 (프론트엔드 렌더링용)
  (parsed as Record<string, unknown>).sajuPillars = {
    yearPillar: saju.yearPillar.hanja,
    monthPillar: saju.monthPillar.hanja,
    dayPillar: saju.dayPillar.hanja,
    hourPillar: saju.hourPillar?.hanja ?? null,
    dominantElement: saju.dominantElement,
    weakElement: saju.weakElement,
    monthGeon: monthGeon.name,
  };

  return jsonResponse(parsed, env);
}

// --- Worker 엔트리 ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return corsResponse(env);
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse({ status: "ok", model: env.OPENAI_MODEL }, env);
    }

    if (request.method !== "POST") {
      return errorResponse("Method not allowed", env, 405);
    }

    try {
      const body = (await request.json()) as Record<string, unknown>;

      if (url.pathname === "/api/fortune/monthly-saju") {
        return handleMonthlySaju(body as unknown as MonthlySajuRequest, env);
      }

      // 공통 입력 검증
      const validationError = validateCommonFields(body);
      if (validationError) {
        return errorResponse(validationError, env, 400);
      }

      if (url.pathname === "/api/fortune/daily") {
        return handleDaily(body as unknown as DailyRequest, env);
      }

      if (url.pathname === "/api/fortune/monthly") {
        return handleMonthly(body as unknown as MonthlyRequest, env);
      }

      if (url.pathname === "/api/fortune/weekly") {
        return handleWeekly(body as unknown as WeeklyRequest, env);
      }

      return errorResponse("Not found", env, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return errorResponse("Internal server error", env);
    }
  },
} satisfies ExportedHandler<Env>;


