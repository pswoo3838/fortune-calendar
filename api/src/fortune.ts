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
      temperature: 0.9,
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

