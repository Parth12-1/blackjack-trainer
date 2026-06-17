# Blackjack Trainer

Learn blackjack basic strategy and Hi-Lo card counting. Vegas-accurate 6-deck table, hidden advisors, full 0→100 counting curriculum. Free, client-only, runs on laptop + phone.

## Three pillars
1. **Play** — real Vegas blackjack, start with $1000.
2. **Strategy Advisor** (hidden, toggle) — recommends the correct move + win/push/loss odds + EV of each option + why.
3. **Counting Trainer** (0→100) — basics module, step-by-step tutorial, speed drills, and a callable count helper during live play.

## Build it
Open this folder in Claude Code and paste the contents of [BUILD.md](BUILD.md). It orchestrates the specialized subagents in `.claude/agents/` to build, then deploy free.

## Stack
Vite + React + TypeScript · Tailwind · Zustand · Framer Motion · SVG cards · localStorage · Vercel (free).

## Docs
- [docs/SPEC.md](docs/SPEC.md) — what to build.
- [docs/BASIC_STRATEGY.md](docs/BASIC_STRATEGY.md) — encoded strategy chart + deviations.
- [docs/CARD_COUNTING.md](docs/CARD_COUNTING.md) — Hi-Lo curriculum.

> Not gambling. Practice tool. No real money.
