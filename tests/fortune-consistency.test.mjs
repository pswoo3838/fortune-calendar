import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: 'export * from "./src/lib/fortuneService"; export * from "./src/lib/paymentManager";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  define: { "import.meta.env": "{}" },
  plugins: [{
    name: "iap-test-double",
    setup(builder) {
      builder.onResolve({ filter: /^@apps-in-toss\/web-framework$/ }, () => ({ path: "sdk", namespace: "test" }));
      builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
        contents: "export const IAP = { createOneTimePurchaseOrder: (...args) => globalThis.testIap(...args) };",
        loader: "js",
      }));
    },
  }],
});
const testDir = await mkdtemp(join(tmpdir(), "fortune-tests-"));
after(() => rm(testDir, { recursive: true, force: true }));
let moduleId = 0;
const profile = { name: "검증사용자", birthDate: "1990-05-15", birthTime: "오시", gender: "여", zodiac: "말", registeredAt: "2026-10-15" };
const date = (year, month, day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const reportKey = (year, month) => `fortune_monthly_saju_v4_${profile.name}_${profile.zodiac}_${year}_${month}`;

async function fixture({ empty = false, failLucky = false, failReport = false } = {}) {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  globalThis.window = { localStorage: storage };
  const calls = { lucky: [], reports: [], purchases: [] };
  globalThis.fetch = async (url, options) => {
    const request = JSON.parse(options.body);
    const { year, month } = request;
    await delay(3);
    if (String(url).endsWith("/monthly")) {
      calls.lucky.push(`${year}-${month}`);
      if (failLucky) return new Response("{}", { status: 500 });
      return Response.json({ dailySummaries: empty ? [] : [
        { date: date(year, month, 5), grade: "길", title: "길일" },
        { date: date(year, month, 12), grade: "대길", title: "대길일" },
        { date: date(year, month, 22), grade: "길", title: "길일" },
        { date: date(year, month, 27), grade: "길", title: "길일" },
      ] });
    }
    calls.reports.push(`${year}-${month}`);
    if (failReport) return new Response("{}", { status: 500 });
    return Response.json({
      monthlyOverview: { title: `${year}년 ${month}월 테스트 운세`, description: "공통 데이터 검증" },
      monthlyPrescription: { bestDays: [date(year, month, 7), date(year, month, 18)] },
    });
  };
  const modulePath = join(testDir, `fixture-${++moduleId}.mjs`);
  await writeFile(modulePath, bundle.outputFiles[0].text);
  const service = await import(pathToFileURL(modulePath).href);
  let onGrant = async () => {};
  globalThis.testIap = params => {
    calls.purchases.push(params.options.sku);
    setTimeout(async () => {
      try {
        await params.options.processProductGrant({ orderId: "test-order" });
        await onGrant();
        await params.onEvent({ type: "success" });
      } catch (error) {
        params.onError(error);
      }
    }, 0);
    return () => {};
  };
  return { service, calls, values, afterGrant: callback => { onGrant = callback; } };
}

test("동시 월간·행운의 날 요청은 한 번만 생성하고 같은 길일을 반환한다", async () => {
  const { service, calls } = await fixture();
  const [report, duplicate, lucky] = await Promise.all([
    service.getMonthlySajuReport(profile, 2026, 10),
    service.getMonthlySajuReport(profile, 2026, 10),
    service.getOrFetchLuckyDays(profile, 2026, 10),
  ]);
  assert.deepEqual(report.monthlyPrescription.bestDays, lucky.slice(0, 3).map(day => day.date));
  assert.deepEqual(report, duplicate);
  assert.equal(calls.lucky.length, 1);
  assert.equal(calls.reports.length, 1);
});

test("저장된 유료 리포트는 내용과 구매 캐시를 유지하고 길일만 공통 데이터로 맞춘다", async () => {
  const { service, calls, values } = await fixture();
  const report = await service.getMonthlySajuReport(profile, 2026, 10);
  report.monthlyPrescription.bestDays = ["2026-10-07"];
  values.set(reportKey(2026, 10), JSON.stringify(report));
  const restored = await service.getMonthlySajuReport(profile, 2026, 10);
  const immediate = service.getCachedMonthlySajuReportSync(profile, 2026, 10);
  assert.deepEqual(restored.monthlyPrescription.bestDays, ["2026-10-12", "2026-10-05", "2026-10-22"]);
  assert.deepEqual(immediate, restored);
  assert.equal(restored.monthlyOverview.title, report.monthlyOverview.title);
  assert.equal(calls.reports.length, 1);
});

test("월간 결제 완료가 생성보다 빨라도 리포트는 한 번만 만들고 저장한다", async () => {
  const { service, calls } = await fixture();
  const result = await service.requestMonthlySajuWithPayment(profile, 2026, 10);
  assert.equal(result.success, true);
  assert.equal(calls.reports.length, 1);
  assert.deepEqual(service.getCachedMonthlySajuReportSync(profile, 2026, 10), JSON.parse(JSON.stringify(result.report)));
});

test("연간 결제가 취소되면 유료 리포트를 생성하거나 저장하지 않는다", async () => {
  const { service, calls, values } = await fixture();
  globalThis.testIap = params => {
    setTimeout(() => params.onError({ message: "결제가 취소되었습니다." }), 0);
    return () => {};
  };
  const result = await service.requestAnnualSajuWithPayment(profile, 2026, 10);
  assert.equal(result.success, false);
  assert.match(result.error, /취소/);
  assert.equal(calls.reports.length, 0);
  assert.equal(values.size, 0);
});

for (const timing of ["early", "late"]) {
  test(`연간 결제(${timing})는 새 상품 ID로 12개월을 저장하고 월간·행운의 날과 일치한다`, async () => {
    const { service, calls, values, afterGrant } = await fixture();
    // 기존에 구매한 첫 달도 연간 리포트에서 그대로 재사용한다.
    const first = await service.getMonthlySajuReport(profile, 2026, 10);
    afterGrant(async () => {
      if (timing === "late") {
        const deadline = Date.now() + 3000;
        while (calls.reports.length < 12 && Date.now() < deadline) await delay(10);
        assert.equal(calls.reports.length, 12);
        await delay(20);
      }
      // 결제 성공 전에는 새 유료 월별 캐시를 지급하지 않는다.
      assert.equal([...values.keys()].filter(key => key.startsWith("fortune_monthly_saju_v4_")).length, 1);
    });
    const progress = [];
    const result = await service.requestAnnualSajuWithPayment(profile, 2026, 10, completed => progress.push(completed));
    assert.equal(result.success, true);
    assert.deepEqual(progress, Array.from({ length: 13 }, (_, index) => index));
    assert.deepEqual(calls.purchases, ["ait.0000033776.5da9f256.f09319b86f.2056297244"]);
    assert.equal(result.reports.length, 12);
    assert.deepEqual(result.reports[0], JSON.parse(JSON.stringify(first)));
    assert.equal(result.reports.at(-1).year, 2027);
    assert.equal(result.reports.at(-1).month, 9);
    for (const report of result.reports) {
      const { year, month } = report;
      const lucky = await service.getOrFetchLuckyDays(profile, year, month);
      const monthly = await service.getMonthlySajuReport(profile, year, month);
      assert.deepEqual(report.monthlyPrescription.bestDays, lucky.slice(0, 3).map(day => day.date));
      assert.deepEqual(monthly, JSON.parse(JSON.stringify(report)));
      assert.ok(values.has(reportKey(year, month)));
    }
    assert.equal(calls.lucky.length, 12);
    assert.equal(calls.reports.length, 12);
  });
}

test("길일이 없으면 빈 결과를 유지하고 임의의 7일·18일을 추가하지 않는다", async () => {
  const { service, calls } = await fixture({ empty: true, failReport: true });
  const report = await service.getMonthlySajuReport(profile, 2026, 10);
  assert.deepEqual(report.monthlyPrescription.bestDays, []);
  assert.deepEqual(await service.getOrFetchLuckyDays(profile, 2026, 10), []);
  assert.equal(calls.lucky.length, 1);
});

test("길일 API 장애 후 복구되면 기존 리포트의 길일을 다시 맞춘다", async () => {
  const { service, values } = await fixture({ failLucky: true });
  const report = await service.getMonthlySajuReport(profile, 2026, 10);
  assert.deepEqual(report.monthlyPrescription.bestDays, []);
  const good = [{ date: "2026-10-22", grade: "대길", title: "복구된 길일" }];
  values.set("fortune_lucky_days_말_2026_10", JSON.stringify(good));
  const restored = await service.getMonthlySajuReport(profile, 2026, 10);
  assert.deepEqual(restored.monthlyPrescription.bestDays, ["2026-10-22"]);
  assert.equal(restored.generatedAt, report.generatedAt);
});
