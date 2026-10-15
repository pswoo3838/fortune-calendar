# 🔮 Fortune Calendar (앱인토스)

> A daily-driver calendar for Koreans who check their fortune every morning.
> **Classical East Asian calendrical computation × OpenAI LLM × Edge-native serverless.**

**Live in production** on [Toss](https://toss.im/) — Korea's largest fintech super-app (30M+ users) — as a mini-app.

[![Codex for OSS](https://img.shields.io/badge/OpenAI-Codex_for_OSS-412991.svg)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🌟 Open Source Highlight: Korean Manseryeok Engine

While Fortune Calendar is a consumer-facing app, its core is powered by a **Zero-dependency Korean Manseryeok (萬歲曆) / Four Pillars of Destiny (四柱八字) calculation engine** written purely in TypeScript. 

Other developers building fortune, astrology, or traditional calendar apps can freely use our engine located at [`src/lib/manseryeok.ts`](./src/lib/manseryeok.ts).

### Why use our engine?
- **No external APIs**: 100% local, deterministic calculations.
- **Accurate Solar Terms**: Uses a simplified VSOP87 algorithm to calculate precise solar term boundaries (입춘, 경칩, etc.) for month pillar transitions.
- **Full Analysis**: Calculates stems (천간), branches (지지), Five Elements (오행) balance, and dominant/weak elements.

### Quick Start (Engine)

You can extract and use the engine in your own projects:

```ts
import { calculateSaju } from './src/lib/manseryeok';

// calculateSaju(birthDate: string, birthTime: string)
const saju = calculateSaju('1990-05-15', '오시');

console.log(saju.yearPillar.hanja);  // "庚午" (Year Pillar)
console.log(saju.monthPillar.hanja); // "辛巳" (Month Pillar)
console.log(saju.dayPillar.hanja);   // "庚午" (Day Pillar)
console.log(saju.hourPillar.hanja);  // "壬午" (Hour Pillar)

console.log(saju.dominantElement);   // "화" (Fire)
console.log(saju.weakElement);       // "목" (Wood)
```

We are actively working on extracting this into a standalone `korean-manseryeok` npm package!

---

## 🤖 AI-Powered OSS Workflows

This project actively utilizes **AI Agents (LLMs)** not just in the product, but in the open-source maintenance lifecycle. We have integrated automated GitHub Actions workflows (see `.github/workflows`):

- **Codex PR Reviewer**: Automatically reviews incoming PRs, catches bugs, and suggests architectural improvements.
- **AI Issue Triage**: Automatically labels, categorizes, and assigns priority to new issues based on user bug reports.
- **Auto Release Notes**: Generates semantic release notes directly from commit histories using LLMs.

---

## 🏗 Architecture

```text
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

- **Deterministic pre-computation + LLM reasoning:** Sexagenary cycle, Five Elements balance, and monthly solar terms are computed by the pure TypeScript engine. Only the structured result is sent to the LLM, keeping outputs consistent, minimizing hallucinations, and keeping token costs low.
- **Edge-native:** Cloudflare Workers provides zero-cold-start latency, effortlessly absorbing Korean morning traffic spikes (7–9 AM, when users check their fortune right after waking up).
- **Strict JSON mode:** All OpenAI calls use `response_format: { type: "json_object" }` for typed, predictable client rendering.

---

## 📈 Traction (as of 2026-07-23)

| Metric | Value |
| --- | --- |
| DAU growth (last 30 days) | ~10 → ~140 (~12x) |
| Cumulative users | 1,329 |
| Deep engagement | 121 of ~140 DAU stay 5+ minutes (~86%) |
| Audience | 65.6% female, concentrated in 40–50s |
| Platform split | 75% Android / 25% iOS |

*Source: Toss Partner Console analytics.*

---

## 🗺 Roadmap

- [x] Integrate AI-driven PR review, issue triage, and release notes.
- [ ] Extract Manseryeok / Four Pillars engine as a standalone npm package.
- [ ] Upgrade daily interpretation pipeline to `gpt-4o` for deeper reasoning.
- [ ] Public architecture write-up on edge + JSON-mode patterns.

---

## 🤝 Contributing

We welcome contributions! Whether it's adding a new feature, fixing a bug, or improving the documentation, please check out our [Contributing Guidelines](CONTRIBUTING.md).

All PRs will be automatically reviewed by our AI Agent for faster iteration.

## 📄 License

MIT

## 로컬 개발 및 배포

SDK 3.8.0과 AIT Devtools를 사용하며 Node.js 24 이상이 필요합니다 (`.nvmrc` 참고).

```sh
nvm use
npm ci
npm run dev
```

`http://localhost:5173`에서 Devtools로 테스트합니다. SDK 설정은 `apps-in-toss.config.ts`에 있습니다.

```sh
npx tsc -b
npm run build
npm run deploy -- --location ./fortunecalendar.ait
```

`.ait`는 Git에 포함하지 않습니다. 콘솔에 업로드한 뒤 QR로 실제 광고 및 결제를 확인하고 출시합니다.
