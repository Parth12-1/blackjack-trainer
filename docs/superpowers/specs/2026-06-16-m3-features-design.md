# Design — M3 polish, deploy, and 3 new features

Date: 2026-06-16
Status: approved-pending-review

## Context

Blackjack Trainer SPA (Vite + React 18 + TS strict + Tailwind v3 + Zustand + Framer Motion).
M0/M1/M2 done. Codex completed M3 phases 0–4: Advisor crash fix, viewport/scroll fix,
instant per-hand decision feedback, deal animation, advisor-left/counter-right toggleable
layout, and a wired Settings modal (H17/S17, surrender, reset bankroll).
Baseline: `npm run build` clean, 112/112 Vitest tests pass.

This spec covers the remaining work: deploy, 3 new features, and a medium UI polish pass.

## Sequencing

Deploy-first. Ship the current working build to Vercel to get a live URL immediately, then
build features that auto-deploy on each push.

1. **Deploy** (dispatch `deploy` agent). Repo is not yet git-initialized → agent inits git,
   creates a GitHub repo, links Vercel, enables auto-deploy. GitHub Pages is the fallback if
   Vercel/GitHub auth is unavailable. Output the live URL.
2. Feature 1 — Live Expected Payout
3. Feature 3 — "What the Count Means" teaching module
4. Feature 2 — Manual Calculator
5. UI polish (medium)
6. Verification pass

## Feature 1 — Live Expected Payout (Pillar 1, in-play)

**What:** A toggleable readout near the action bar showing the expected dollar return of the
current wager(s) from this moment, assuming basic-strategy continuation over the actual
remaining shoe.

**Display:** `Expected return: +$3.20` (green positive / red negative). When multiple hands
(post-split) are live, show the total plus a per-hand breakdown.

**Math (reuses existing `montecarlo` engine):**
- Per hand: `ev = runMonteCarlo(hand.cards, dealerUpcard, remainingShoe, h17).ev` (per unit bet).
- Dollar EV per hand = `ev × hand.bet`. Doubled hands already carry `bet = 2×original` in store.
- Total = sum across all non-settled, non-surrendered hands.
- During the `betting`/`idle` phase there is no hand → show nothing (or a neutral hint).

**Known limitation (documented, not fixed here):** the engine's `ev` is the naive
`winRate − loseRate`; it does not scale doubles 2× or blackjack 3:2 in magnitude. The dollar
figure is therefore approximate. Acceptable for a trainer; noted for a future engine pass.

**Component:** `src/features/play/ExpectedPayout.tsx`. Computed off the same store selectors the
Advisor uses. Toggle lives in the PlayTable footer (own button), default OFF. Runs via the
existing Monte Carlo path; reuse the worker if the sync path is too slow on split hands.

**Tests:** unit test the dollar-aggregation helper (single hand, doubled hand, two split hands,
surrendered hand excluded) with a stubbed `ev`.

## Feature 2 — Manual Calculator (new top-nav tab)

**What:** A standalone tool — no dealing, no bankroll — where the user types in a real-table
situation and gets the full read.

**Inputs:**
- Player hand (add/remove cards via rank buttons).
- Dealer upcard (rank buttons).
- Optional: mark as a split pair.
- Count source: either enter seen cards / running count directly, plus decks remaining (or
  cards seen), so true count can be derived.

**Outputs (all from existing engines):**
- Basic-strategy recommendation — `strategy.ts`.
- Count-deviation flag at the entered true count — `deviations.ts`.
- Running count, true count, decks remaining, bet-ramp unit — `countingUtils.ts`.
- Win / push / loss odds, per-action EV, and expected payout — `montecarlo`
  (`runMonteCarlo` + `allActionEVs`). Calculator builds a synthetic remaining shoe from
  `buildShoe(numDecks)` minus the entered cards.

**Component:** `src/features/calculator/CalculatorTab.tsx` plus small input subcomponents.
Added as a third top-nav tab in `App.tsx` (Play | Count Trainer | Calculator).

**Tests:** the input → engine-args mapping (cards parsed correctly, synthetic shoe excludes
entered cards, true count derived correctly).

## Feature 3 — "What the Count Means" (new Counting Trainer sub-module)

**What:** A teaching module answering "the count is +3 — now what?". Currently the trainer
teaches how to *keep* a count but not how to *act* on it.

**Content:**
- What a true count tells you: player edge ≈ `TC × 0.5%` over the house; intuition for why.
- Bet ramp logic (TC → units), tying the number to the edge.
- Key playing deviations: Illustrious 18 + Fab 4, each with its TC threshold and the one-line
  *why*, sourced from `deviations.ts` (single source of truth — no re-hardcoding thresholds).
- Interactive check: "TC +3, dealer shows 10, you have 16 — hit or stand?" → reveal the
  deviation and explanation. A few such prompts driven by the deviations table.

**Component:** `src/features/counting/modules/CountMeaning.tsx`, added to the CountingTrainer
module switcher alongside Basics / Tutorial / SpeedDrill / LiveHelper.

**Tests:** verify the deviation prompts are generated from `deviations.ts` and the correct
action is asserted (reuse/extend existing deviations tests if practical).

## UI Polish (medium)

No logic changes. Targeted visual pass:
- Felt: subtle radial texture + vignette over the existing green.
- Chips: realistic SVG chip component (edge stripes, denomination ring) for the ChipSelector.
- Cards: a proper card-back design for face-down cards.
- Buttons + typography: consistent weight/spacing, clearer active/disabled states.

Constrained to `Card.tsx`, `ChipSelector.tsx`, `ActionButtons.tsx`, `index.css`, and table
container styles. No store or engine edits.

## Verification

- `npm run build` exits 0; `npx vitest run` all green (existing 112 + new tests).
- SPEC.md acceptance checklist walked item by item, each marked pass/fail:
  - Full hand playable phone + laptop, money settles correctly.
  - Advisor recommendation matches `docs/BASIC_STRATEGY.md` for sampled (hand, upcard).
  - Monte Carlo odds within ±2% on spot checks (e.g. player 20 vs dealer 6 ≈ 70% win).
  - Running/true count math correct; tutorial validates input; deviations fire at right TCs.
- Responsive check at 375px (phone) and 1440px (desktop) — no overflow, everything visible.
- New tabs/toggles reachable and non-breaking on both breakpoints.

## Out of scope

- Fixing the engine EV magnitude (double 2× / blackjack 3:2 weighting).
- Full casino theme (animated chip stacks, sounds, dealer avatar).
- Any backend, login, or real money.
