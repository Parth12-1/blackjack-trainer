# BUILD — paste this whole file into Claude Code

You are building a **Blackjack Trainer** web app. All requirements are in `docs/SPEC.md`, `docs/BASIC_STRATEGY.md`, `docs/CARD_COUNTING.md`. Specialized subagents exist in `.claude/agents/` — dispatch to them; don't do everything inline.

## Order of operations

**Milestone 0 — Scaffold + engine (do these two first; engine can run in parallel after scaffold exists).**
1. Dispatch **ui-designer**: scaffold Vite + React + TS + Tailwind + Zustand + Framer Motion, the design system, SVG `Card.tsx`, the Zustand store, and the Pillar 1 play table. Leave mount points for advisor + counting panels.
2. Dispatch **blackjack-engine**: build `src/engine/` (cards, shoe, rules, settle, strategy, montecarlo) with Vitest tests. Must pass `npx vitest run`.

**Milestone 1 — Wire play.** Connect the engine to the play UI so a full hand settles money correctly. Verify on phone (375px) and laptop (1440px) viewports.

**Milestone 2 — Pillars 2 & 3 (parallel).**
3. Dispatch **strategy-advisor**: build the hidden advisor panel (recommendation + Monte Carlo odds + per-action EV + teaching notes + count deviations), Monte Carlo in a Web Worker.
4. Dispatch **count-tutor**: build the counting trainer (basics flashcards, guided tutorial, speed drill, callable live-play helper with blind mode, mastery progression).

**Milestone 3 — Polish + ship.**
5. Settings modal (H17/S17, surrender, reset bankroll). Session stats. Final responsive + animation pass.
6. Dispatch **deploy**: free hosting (Vercel primary, GitHub Pages fallback), auto-deploy on push. Output the live URL.

## Rules for you (orchestrator)
- After each agent returns, run the build/tests yourself and confirm before moving on. Evidence before claiming done.
- Keep everything client-side. No backend, no login, no real money. Bankroll persists in localStorage.
- The basic strategy chart in `docs/BASIC_STRATEGY.md` is the single source of truth — the advisor's recommendations must match it exactly. (Transcribed from the user's Blackjack Apprenticeship chart: 6-deck S17, DAS, late surrender.)
- Final acceptance: every item in `docs/SPEC.md` "Acceptance" section verified.

Start with Milestone 0 now.
