# CARD COUNTING — Hi-Lo curriculum (0 → 100)

Source content for the Counting Trainer. Hi-Lo system. Build each section as interactive UI, not just text.

## Step 1 — Card values
```
2 3 4 5 6  →  +1   (low cards gone = good)
7 8 9      →   0   (neutral)
10 J Q K A →  −1   (high cards gone = bad)
```
Why: player wins more when the shoe is rich in 10s and Aces (more blackjacks paying 3:2, dealer busts more). Counting tracks the ratio of low→high remaining.

## Step 2 — Running Count
Add each card's value as it's dealt, across the whole table, round after round, until shuffle. Start at 0 each new shoe.
Example round dealt: 5(+1) K(−1) 7(0) 3(+1) Q(−1) 6(+1) → running count = +1.

## Step 3 — True Count
`True Count = Running Count ÷ decks remaining`.
Decks remaining ≈ cards left ÷ 52, round to nearest 0.5 deck.
- RC +10, 5 decks left → TC +2.
- RC −7, 2 decks left → TC −3.
Why true count: +5 with 6 decks left is weak; +5 with 1 deck left is strong. Concentration matters, not raw count.

## Step 4 — Bet ramp
Bet small at TC ≤ +1, raise as TC climbs. Rule of thumb each +1 true ≈ +0.5% edge to player in 6-deck. TC +1 ≈ even game, +2 ≈ +0.5% player, +3 ≈ +1%.
Ramp used in app: TC ≤1 →1u · 2 →2u · 3 →4u · 4 →8u · 5+ →12u.

## Step 5 — Playing deviations
At high/low counts, deviate from basic strategy (Illustrious 18, in `docs/BASIC_STRATEGY.md`). Most important: take insurance at TC ≥ +3; stand 16 v 10 at TC ≥ 0; stand 12 v 3 at TC ≥ +2.

---

## Trainer mode designs

### Module 0 — Basics (5 min)
Flashcards: show a card, user taps +1 / 0 / −1, instant feedback, track reflex speed. Pass gate: 30 cards correct in a row.

### Module 1 — Tutorial (guided hands)
- Deal a real round one card at a time, slowly.
- After each card: prompt "Running count?" → validate, show correct + the per-card value.
- Each new shoe resets count to 0; remind user.
- At end of round: prompt "Decks remaining?" then "True count?" → validate the division.
- Coach panel explains reasoning each step. Hints fade as accuracy rises over rounds.

### Module 2 — Speed drill
- Cards flash through a full 6-deck shoe at a chosen pace (start 1 card / 2s → ramp to 1 card / 0.5s).
- User maintains running count silently, enters it at checkpoints (every ~20 cards) and at shoe end.
- Score = accuracy × speed. Track best. This builds the real-table reflex.

### Module 3 — Live play helper (callable, hidden)
- Overlay during Pillar-1 play. Two modes:
  - **Reveal**: shows running count, true count, decks remaining live + bet recommendation + active deviations.
  - **Blind**: hides the count; user types their own running count; app reveals whether they're right and by how much. This is the "confirm my count is effective" mode the user asked for.
- Also surfaces when the current decision has a count deviation, so the user learns index plays in context.

## Progression / mastery (the 0→100)
Gate the user through: Basics flashcards → Tutorial (10 clean rounds) → Speed drill (accurate at 1 card/sec) → Live blind mode (count a full shoe within ±1 of true) → Live play with deviations. Show a progress bar / belt levels.
