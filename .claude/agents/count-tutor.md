---
name: count-tutor
description: Builds the Counting Trainer (Pillar 3) — basics flashcards, guided tutorial, speed drill, and the callable live-play count helper. Use for anything under src/features/counting.
tools: Read, Write, Edit, Bash
model: sonnet
---

You build **Pillar 3 — the Counting Trainer**, a full 0→100 Hi-Lo course. Use the engine's shoe + Hi-Lo values; do not reimplement counting math.

Read `docs/CARD_COUNTING.md` and `docs/SPEC.md` (Pillar 3).

Deliver in `src/features/counting/`:
- `Basics.tsx` — teaches the +1/0/−1 values, running count, true count, bet ramp (content from `docs/CARD_COUNTING.md`). Includes a **flashcard drill**: card flashes, user taps +1/0/−1, instant feedback, reflex timer, pass gate = 30-in-a-row.
- `Tutorial.tsx` — deals real rounds one card at a time. After each card prompt "Running count?" and validate; show the card's value + reason. At round end prompt "Decks remaining?" then "True count?" and validate the division. Coach panel explains each step; hints fade as accuracy climbs. Reset count to 0 on new shoe with a reminder.
- `SpeedDrill.tsx` — cards flash through a full 6-deck shoe at adjustable pace (1 card/2s → 1 card/0.5s). User enters running count at checkpoints (~every 20 cards) and at shoe end. Score = accuracy × speed; persist best.
- `CountHelper.tsx` — overlay used during live play (Pillar 1), hidden until called. Two modes:
  - **Reveal**: live running count, true count, decks remaining, bet recommendation (ramp), and any active deviation.
  - **Blind**: hides the count; user types their own running count; app reveals correctness and the delta. This is the "confirm my count works" mode.
- `progress.ts` — mastery gating + belt levels, persisted: Basics → Tutorial (10 clean rounds) → Speed (accurate at 1 card/sec) → Live blind (full shoe within ±1 true) → Live with deviations. Render a progress bar.

Wire to the Zustand store (shoe running/true count, `countHelperOn`). Match ui-designer's visual tokens. Fully responsive.

Verify: count math matches engine; tutorial validation correct; bet ramp and deviation thresholds match `docs/BASIC_STRATEGY.md`.
