var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-Fwk1au/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/fortune.ts
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function corsResponse(env) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env.ALLOWED_ORIGIN)
  });
}
__name(corsResponse, "corsResponse");
function jsonResponse(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(env.ALLOWED_ORIGIN)
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, env, status = 500) {
  return jsonResponse({ error: message }, env, status);
}
__name(errorResponse, "errorResponse");
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
__name(parseDate, "parseDate");
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
__name(formatDate, "formatDate");
function datesBetween(start, end) {
  const result = [];
  const current = parseDate(start);
  const endDate = parseDate(end);
  while (current.getTime() <= endDate.getTime()) {
    result.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}
__name(datesBetween, "datesBetween");
async function callOpenAI(systemPrompt, userPrompt, env) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.choices[0].message.content;
}
__name(callOpenAI, "callOpenAI");
async function handleDaily(body, env) {
  const systemPrompt = `\uB2F9\uC2E0\uC740 \uD55C\uAD6D \uC804\uD1B5 \uC6B4\uC138 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. 12\uC9C0\uC2E0(\uB760) \uAE30\uBC18\uC73C\uB85C \uC815\uD655\uD558\uACE0 \uAD6C\uCCB4\uC801\uC778 \uC77C\uC77C \uC6B4\uC138\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4.
\uBC18\uB4DC\uC2DC \uC544\uB798 JSON \uD615\uC2DD\uC73C\uB85C\uB9CC \uC751\uB2F5\uD558\uC138\uC694.`;
  const userPrompt = `\uB2E4\uC74C \uC815\uBCF4\uB85C ${body.targetDate} \uB0A0\uC9DC\uC758 \uC6B4\uC138\uB97C \uC0DD\uC131\uD574\uC8FC\uC138\uC694.

- \uB760: ${body.zodiac}
- \uC131\uBCC4: ${body.gender}
- \uC0DD\uB144\uC6D4\uC77C: ${body.birthDate}
- \uB300\uC0C1 \uB0A0\uC9DC: ${body.targetDate}

JSON \uD615\uC2DD:
{
  "fortune": {
    "date": "${body.targetDate}",
    "grade": "\uB300\uAE38|\uAE38|\uBCF4\uD1B5|\uD749|\uB300\uD749 \uC911 \uD558\uB098",
    "title": "\uC6B4\uC138 \uD55C\uC904 \uC694\uC57D (15\uC790 \uC774\uB0B4)",
    "description": "3~4\uBB38\uC7A5\uC758 \uC0C1\uC138 \uC6B4\uC138 \uC124\uBA85",
    "luckyColor": "\uD589\uC6B4\uC758 \uC0C9 (\uD55C\uAD6D\uC5B4)",
    "luckyNumber": 1~9 \uC0AC\uC774 \uC22B\uC790,
    "advice": "\uC624\uB298\uC758 \uC870\uC5B8 \uD55C \uC904 (20\uC790 \uC774\uB0B4)"
  }
}`;
  try {
    const raw = await callOpenAI(systemPrompt, userPrompt, env);
    const parsed = JSON.parse(raw);
    if (!parsed.fortune || !parsed.fortune.date || !parsed.fortune.grade) {
      throw new Error("Invalid fortune format");
    }
    return jsonResponse(parsed, env);
  } catch (err) {
    console.error("Daily fortune error:", err);
    return errorResponse("\uC6B4\uC138 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", env);
  }
}
__name(handleDaily, "handleDaily");
async function handleMonthly(body, env) {
  const systemPrompt = `\uB2F9\uC2E0\uC740 \uD55C\uAD6D \uC804\uD1B5 \uC6B4\uC138 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. 12\uC9C0\uC2E0(\uB760) \uAE30\uBC18\uC73C\uB85C \uD55C \uB2EC\uCE58 \uC6B4\uC138 \uC694\uC57D\uACFC \uAE38\uC77C/\uC190\uC5C6\uB294 \uB0A0 \uC815\uBCF4\uB97C \uC81C\uACF5\uD569\uB2C8\uB2E4.
\uBC18\uB4DC\uC2DC \uC544\uB798 JSON \uD615\uC2DD\uC73C\uB85C\uB9CC \uC751\uB2F5\uD558\uC138\uC694. dailySummaries \uBC30\uC5F4\uC5D0\uB294 \uD574\uB2F9 \uC6D4\uC758 \uBAA8\uB4E0 \uB0A0\uC9DC\uAC00 \uD3EC\uD568\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4.`;
  const userPrompt = `\uB2E4\uC74C \uC815\uBCF4\uB85C ${body.year}\uB144 ${body.month}\uC6D4 \uD55C\uB2EC \uC6B4\uC138\uB97C \uC0DD\uC131\uD574\uC8FC\uC138\uC694.

- \uB760: ${body.zodiac}
- \uC131\uBCC4: ${body.gender}
- \uC0DD\uB144\uC6D4\uC77C: ${body.birthDate}
- \uC5F0\uB3C4: ${body.year}
- \uC6D4: ${body.month}
- \uD574\uB2F9 \uC6D4 \uC77C\uC218: ${body.daysInMonth}

JSON \uD615\uC2DD:
{
  "dailySummaries": [
    {
      "date": "YYYY-MM-DD",
      "grade": "\uB300\uAE38|\uAE38|\uBCF4\uD1B5|\uD749|\uB300\uD749 \uC911 \uD558\uB098",
      "title": "\uC6B4\uC138 \uD55C\uC904 \uC694\uC57D (15\uC790 \uC774\uB0B4)"
    }
    // ... ${body.daysInMonth}\uAC1C
  ],
  "auspiciousDays": [
    {
      "date": "YYYY-MM-DD",
      "type": "\uAE38\uC77C \uB610\uB294 \uC190\uC5C6\uB294\uB0A0",
      "label": "\uD45C\uC2DC \uD14D\uC2A4\uD2B8 (\uC608: \uAE38\uC77C, \uC190 \uC5C6\uB294 \uB0A0)"
    }
    // \uD574\uB2F9 \uC6D4\uC5D0\uC11C \uD2B9\uBCC4\uD788 \uC88B\uAC70\uB098 \uC8FC\uC758\uD560 \uB0A0 5~10\uAC1C \uC120\uC815
  ]
}

\uBAA8\uB4E0 \uB0A0\uC9DC\uB294 ${body.year}-${String(body.month).padStart(2, "0")}-DD \uD615\uC2DD\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.
\uB4F1\uAE09 \uBD84\uD3EC: \uB300\uAE38 \uC57D 10%, \uAE38 \uC57D 30%, \uBCF4\uD1B5 \uC57D 35%, \uD749 \uC57D 20%, \uB300\uD749 \uC57D 5%`;
  try {
    const raw = await callOpenAI(systemPrompt, userPrompt, env);
    const parsed = JSON.parse(raw);
    if (!parsed.dailySummaries || !Array.isArray(parsed.dailySummaries)) {
      throw new Error("Invalid monthly format");
    }
    return jsonResponse(parsed, env);
  } catch (err) {
    console.error("Monthly fortune error:", err);
    return errorResponse("\uD55C\uB2EC \uC6B4\uC138 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", env);
  }
}
__name(handleMonthly, "handleMonthly");
async function handleWeekly(body, env) {
  const dates = datesBetween(body.weekStart, body.weekEnd);
  const systemPrompt = `\uB2F9\uC2E0\uC740 \uD55C\uAD6D \uC804\uD1B5 \uC6B4\uC138 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. 12\uC9C0\uC2E0(\uB760) \uAE30\uBC18\uC73C\uB85C \uC77C\uC8FC\uC77C\uCE58 \uC6B4\uC138\uB97C \uC0DD\uC131\uD569\uB2C8\uB2E4.
\uBC18\uB4DC\uC2DC JSON \uD615\uC2DD\uC73C\uB85C\uB9CC \uC751\uB2F5\uD558\uC138\uC694. dailyFortunes \uBC30\uC5F4\uC5D0\uB294 \uC694\uCCAD\uB41C \uBAA8\uB4E0 \uB0A0\uC9DC\uAC00 \uD3EC\uD568\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4.`;
  const userPrompt = `\uB2E4\uC74C \uC815\uBCF4\uB85C ${body.weekStart}\uBD80\uD130 ${body.weekEnd}\uAE4C\uC9C0 \uC8FC\uAC04 \uC6B4\uC138\uB97C \uC0DD\uC131\uD574\uC8FC\uC138\uC694.

- \uB760: ${body.zodiac}
- \uC131\uBCC4: ${body.gender}
- \uC0DD\uB144\uC6D4\uC77C: ${body.birthDate}
- \uB0A0\uC9DC \uBAA9\uB85D: ${dates.join(", ")}

JSON \uD615\uC2DD:
{
  "dailyFortunes": [
    {
      "date": "YYYY-MM-DD",
      "grade": "\uB300\uAE38|\uAE38|\uBCF4\uD1B5|\uD749|\uB300\uD749 \uC911 \uD558\uB098",
      "title": "\uC6B4\uC138 \uD55C\uC904 \uC694\uC57D (15\uC790 \uC774\uB0B4)",
      "description": "3~4\uBB38\uC7A5\uC758 \uC0C1\uC138 \uC6B4\uC138 \uC124\uBA85",
      "luckyColor": "\uD589\uC6B4\uC758 \uC0C9 (\uD55C\uAD6D\uC5B4)",
      "luckyNumber": 1~9 \uC0AC\uC774 \uC22B\uC790,
      "advice": "\uC624\uB298\uC758 \uC870\uC5B8 \uD55C \uC904 (20\uC790 \uC774\uB0B4)"
    }
  ]
}`;
  try {
    const raw = await callOpenAI(systemPrompt, userPrompt, env);
    const parsed = JSON.parse(raw);
    if (!parsed.dailyFortunes || !Array.isArray(parsed.dailyFortunes)) {
      throw new Error("Invalid weekly format");
    }
    return jsonResponse(parsed, env);
  } catch (err) {
    console.error("Weekly fortune error:", err);
    return errorResponse("\uC8FC\uAC04 \uC6B4\uC138 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", env);
  }
}
__name(handleWeekly, "handleWeekly");
var VALID_ZODIAC = /* @__PURE__ */ new Set(["\uC950", "\uC18C", "\uD638\uB791\uC774", "\uD1A0\uB07C", "\uC6A9", "\uBC40", "\uB9D0", "\uC591", "\uC6D0\uC22D\uC774", "\uB2ED", "\uAC1C", "\uB3FC\uC9C0"]);
var VALID_GENDER = /* @__PURE__ */ new Set(["\uB0A8", "\uC5EC"]);
function validateCommonFields(body) {
  if (!body.zodiac || !VALID_ZODIAC.has(body.zodiac))
    return "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB760\uC785\uB2C8\uB2E4.";
  if (!body.gender || !VALID_GENDER.has(body.gender))
    return "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC131\uBCC4\uC785\uB2C8\uB2E4.";
  if (!body.birthDate || typeof body.birthDate !== "string")
    return "\uC0DD\uB144\uC6D4\uC77C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
  return null;
}
__name(validateCommonFields, "validateCommonFields");
var fortune_default = {
  async fetch(request, env) {
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
      const body = await request.json();
      const validationError = validateCommonFields(body);
      if (validationError) {
        return errorResponse(validationError, env, 400);
      }
      if (url.pathname === "/api/fortune/daily") {
        return handleDaily(body, env);
      }
      if (url.pathname === "/api/fortune/monthly") {
        return handleMonthly(body, env);
      }
      if (url.pathname === "/api/fortune/weekly") {
        return handleWeekly(body, env);
      }
      return errorResponse("Not found", env, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return errorResponse("Internal server error", env);
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Fwk1au/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = fortune_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Fwk1au/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=fortune.js.map
