# SPEC — Blackjack Trainer

Lean spec. Three pillars, one SPA. All client-side. No backend, no login, no money.

## Table rules (Vegas default, configurable)
- 6 decks, shoe reshuffled at cut card (~75% penetration → cut at 1.5 decks remaining).
- Dealer **stands on soft 17 (S17)** by default (matches the supplied strategy chart); setting to switch to H17.
- Blackjack pays **3:2**.
- Double on any 2 cards. **Double after split (DAS)** allowed.
- Split up to 4 hands. Split aces get **one card each** (no resplit aces).
- Dealer peeks for blackjack.
- **Late surrender** allowed.
- Insurance offered when dealer shows Ace (pays 2:1).
- Min bet $5, max $500. Chips: 5/25/100/500.

## Pillar 1 — Play mode
- Bankroll starts **$1000**, persisted in localStorage. Reset button.
- Flow: place bet → deal → player actions (Hit / Stand / Double / Split / Surrender / Insurance) → dealer plays → settle → payout.
- Correct payouts, busts, pushes, blackjack 3:2, surrender returns half.
- Smooth deal/flip animations (Framer Motion). SVG cards (see ui-designer agent). Responsive: table view on laptop, stacked on phone.
- Session stats: hands played, win/loss/push, net $, biggest win, current streak.

## Pillar 2 — Strategy Advisor (hidden, toggle)
Off by default. Button reveals a panel for the current hand:
- **Recommended action** straight from the basic-strategy chart (`docs/BASIC_STRATEGY.md`).
- **Win / Push / Loss probability** for the current hand — Monte Carlo simulation (2k–5k playouts) over the *actual remaining shoe composition*, following basic strategy + dealer rules.
- **EV of each legal action** (stand/hit/double/split/surrender) so the user sees *why* the recommendation wins.
- **Teaching note**: one-line reason (e.g. "Dealer 6 is weakest upcard — let them bust").
- Highlight when the count says deviate from basic strategy (link to Illustrious 18).

## Pillar 3 — Counting Trainer (0 → 100)
Four sub-modes:

1. **Basics module** (short): Hi-Lo values (2–6 = +1, 7–9 = 0, 10–A = −1), running count, true count = running ÷ decks remaining, bet ramp. Interactive flashcards to drill the +1/0/−1 reflex.
2. **Tutorial** (guided): deals real hands one card at a time. After each card asks "running count?" then validates. At end of round asks "true count?" (running ÷ decks remaining) and validates. Explains the thinking each step. Progressive: starts slow with hints, removes hints as accuracy rises.
3. **Speed drill**: cards flash at increasing speed through a full shoe; user keeps the running count; score on accuracy + speed. Adjustable pace.
4. **Count helper in live play** (hidden, callable): overlay shows running count, true count, decks remaining, and a **bet recommendation** (ramp by true count) and **playing deviations** (Illustrious 18 / Fab 4). Use it to confirm your own count is right. Can run in "blind" mode where it hides the count and only reveals when you commit your answer.

## Bet ramp (true count → units, 1 unit = min bet)
TC ≤ +1 → 1u · +2 → 2u · +3 → 4u · +4 → 8u · +5 → 12u (cap). Show as guidance, never forced.

## State (Zustand)
`shoe` (array of remaining cards + running count), `bankroll`, `bet`, `hands`, `dealer`, `phase`, `settings`, `stats`, `advisorOn`, `countHelperOn`. Persist bankroll + settings + stats.

## Acceptance
- Full hand of blackjack playable on phone + laptop, money settles correctly.
- Advisor recommendation matches `docs/BASIC_STRATEGY.md` for every (hand, upcard).
- Monte Carlo odds within ±2% of known values on spot checks (e.g. player 20 vs dealer 6 ≈ 70% win).
- Running/true count math correct; tutorial validates user input; deviations fire at right true counts.
