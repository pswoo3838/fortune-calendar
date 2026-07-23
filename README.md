# Fortune Calendar

> A daily-driver calendar for Koreans who check their fortune every morning.
> Classical East Asian calendrical computation × OpenAI LLM × edge-native serverless.

**Live in production** on [Toss](https://toss.im/) — Korea's largest fintech super-app (30M+ users) — as a mini-app.

---

## Why this exists

Google Calendar and Apple Calendar are opened daily by almost everyone.
Checking daily fortune (오늘의 운세) is a deeply ingrained morning ritual in Korea.

Fortune Calendar layers personalized fortune readings — computed from classical Manseryeok (만세력), lunar calendar, and Four Pillars of Destiny (사주) — onto a real schedule calendar. For the fortune-interested slice of Koreans, this becomes a genuine daily-driver alternative to generic calendars.

## Traction (as of 2026-07-23)

| Metric | Value |
| --- | --- |
| DAU growth (last 30 days) | ~10 → ~140 (~12x) |
| Cumulative users | 1,329 |
| Deep engagement | 121 of ~140 DAU stay 5+ minutes (~86%) |
| Audience | 65.6% female, concentrated in 40–50s |
| Platform split | 75% Android / 25% iOS |
| Distribution | Toss mini-app only (no app store listing) |

*Source: Toss Partner Console analytics.*

## Architecture

```
[Toss Mini-app WebView]
        │
        ▼
[Cloudflare Workers (edge)]
        │
        ├──► Deterministic Manseryeok / Four Pillars engine (TypeScript)
        │
        └──► OpenAI API (gpt-4o-mini, response_format: json_object)
```

### Key design decisions

- **Deterministic pre-computation + LLM reasoning.** Sexagenary cycle, Five Elements balance, and monthly solar terms are computed by a pure TypeScript engine. Only the structured result is sent to the LLM, keeping outputs consistent and token cost low.
- **Edge-native.** Cloudflare Workers gives zero-cold-start latency and absorbs Korean morning traffic spikes (7–9am, when users check fortune right after waking).
- **Strict JSON mode.** All OpenAI calls use `response_format: { type: "json_object" }` for typed client rendering.

## Tech stack

- TypeScript
- Cloudflare Workers (edge runtime)
- OpenAI API (`gpt-4o-mini`)
- Toss Apps SDK (`@apps-in-toss/web-framework`)

## Roadmap

- [ ] Extract Manseryeok / Four Pillars engine as a standalone TypeScript package
- [ ] Upgrade daily interpretation pipeline to `gpt-4o` for deeper reasoning
- [ ] Semantic search over classical Manseryeok texts (embeddings + reranker)
- [ ] Public architecture write-up on edge + JSON-mode patterns
- [ ] Codex-powered PR review and issue triage via GitHub Actions

## About the maintainer

Solo maintainer, non-CS background. Building and supporting Fortune Calendar end-to-end on the Toss platform.

## License

MIT
