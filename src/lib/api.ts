import type { AIFortuneRequest, AIFortuneResponse, DailyFortune } from "../types/fortune";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "https://fortune-worker.siuda3838.workers.dev";

/**
 * Cloudflare Worker에 주간 운세 생성 요청
 */
export async function fetchWeeklyFortune(
  request: AIFortuneRequest,
): Promise<AIFortuneResponse> {
  const res = await fetch(`${WORKER_URL}/api/fortune/weekly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Fortune API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<AIFortuneResponse>;
}

export async function fetchDailyFortune(
  request: { zodiac: string; gender: string; birthDate: string; targetDate: string }
): Promise<{ fortune: DailyFortune }> {
  const res = await fetch(`${WORKER_URL}/api/fortune/daily`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Daily Fortune API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<{ fortune: DailyFortune }>;
}
