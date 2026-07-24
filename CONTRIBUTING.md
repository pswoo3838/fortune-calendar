# Contributing to Fortune Calendar

Thanks for your interest in contributing.

## Ways to help

### 1. Report Manseryeok accuracy issues
The classical calendar engine (사주/만세력) is the foundation of
this project. If you find incorrect pillar computations, please
open an issue using the "Manseryeok accuracy" template with a
reference source. This is the most valuable contribution.

### 2. Improve LLM interpretation quality
If daily readings feel generic, unnatural, or culturally off,
open an issue with the exact date/pillars and what felt wrong.
Concrete examples help far more than abstract feedback.

### 3. Code contributions
- Fork the repo
- Create a feature branch
- Follow existing TypeScript style
- Add tests for calendar engine changes (never touch engine
  outputs without regression tests)
- Open a PR using the template

### 4. Documentation
Architecture notes, edge deployment tips, JSON-mode patterns,
prompt strategies — all welcome under `docs/`.

## Development

Requirements: Node 20+, pnpm, Cloudflare Wrangler CLI.

```bash
pnpm install
pnpm dev
```

## Code of Conduct

Be respectful. Assume good faith. This project centers a
culturally significant practice; discussions about
interpretation should stay constructive.
