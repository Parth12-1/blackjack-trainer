# BASIC STRATEGY — 6 deck, S17, DAS, late surrender

> Source of truth: Blackjack Apprenticeship chart (user-supplied). Standard 4–8 deck, dealer **stands on soft 17**, DAS, late surrender. Advisor must match every cell below.

Encoded chart for the Strategy Advisor. Columns = dealer upcard (2,3,4,5,6,7,8,9,T,A where T = 10/J/Q/K). Actions: **H** hit · **S** stand · **D** double (else hit) · **Ds** double (else stand) · **P** split · **R** surrender (else hit) · **Rp** surrender (else split).

> Encode this as lookup tables in `src/engine/strategy.ts`. Resolve in order: surrender → pair → soft → hard. Only allow D/R/P when legal for the hand; if illegal, fall back (D→ its else, P→ treat as hard, R→ its else).

## Surrender (check first, only on first 2 cards, no split yet)
- Hard 16 vs 9, T, A → **R**
- Hard 15 vs T → **R**
- (No 17 surrender, no 8,8 surrender — S17 chart.)

## Pairs (dealer upcard 2 3 4 5 6 7 8 9 T A)
```
A,A : P P P P P P P P P P
T,T : S S S S S S S S S S
9,9 : P P P P P S P P S S
8,8 : P P P P P P P P P P   (always split, incl. vs A)
7,7 : P P P P P P H H H H
6,6 : P P P P P H H H H H   (P vs 2 only with DAS; yes here)
5,5 : D D D D D D D D H H   (treat as hard 10, never split)
4,4 : H H H P P H H H H H   (P vs 5,6 only, with DAS)
3,3 : P P P P P P H H H H
2,2 : P P P P P P H H H H
```

## Soft totals (Ace counted as 11)
```
A,9 (20): S  S  S  S  S  S S S S S
A,8 (19): S  S  S  S  Ds S S S S S   (Ds vs 6 per chart)
A,7 (18): Ds Ds Ds Ds Ds S S H H H
A,6 (17): H  D  D  D  D  H H H H H
A,5 (16): H  H  D  D  D  H H H H H
A,4 (15): H  H  D  D  D  H H H H H
A,3 (14): H  H  H  D  D  H H H H H
A,2 (13): H  H  H  D  D  H H H H H
```

## Hard totals
```
17+ : S S S S S S S S S S
16  : S S S S S H H H H H   (surrender vs 9,T,A)
15  : S S S S S H H H H H   (surrender vs T)
14  : S S S S S H H H H H
13  : S S S S S H H H H H
12  : H H S S S H H H H H
11  : D D D D D D D D D D
10  : D D D D D D D D H H
9   : H D D D D H H H H H
5-8 : H H H H H H H H H H
```

## Insurance / even money
Never take insurance on basic strategy. (Counting overrides — see below.)

---

# COUNTING DEVIATIONS — Illustrious 18 + Fab 4 (true count thresholds)
Format: situation → take action if **TC ≥ threshold** (or ≤ for hit cases). Index plays for 6-deck H17.

| # | Hand vs Upcard | Action | Threshold |
|---|---|---|---|
| 1 | Insurance | Take | TC ≥ +3 |
| 2 | 16 v T | Stand | TC ≥ 0 |
| 3 | 15 v T | Stand | TC ≥ +4 |
| 4 | T,T v 5 | Split | TC ≥ +5 |
| 5 | T,T v 6 | Split | TC ≥ +4 |
| 6 | 10 v T | Double | TC ≥ +4 |
| 7 | 12 v 3 | Stand | TC ≥ +2 |
| 8 | 12 v 2 | Stand | TC ≥ +3 |
| 9 | 11 v A | Double | TC ≥ +1 |
| 10 | 9 v 2 | Double | TC ≥ +1 |
| 11 | 10 v A | Double | TC ≥ +4 |
| 12 | 9 v 7 | Double | TC ≥ +3 |
| 13 | 16 v 9 | Stand | TC ≥ +5 |
| 14 | 13 v 2 | Stand | TC ≥ −1 (stand unless below) |
| 15 | 12 v 4 | Stand | TC ≥ 0 |
| 16 | 12 v 5 | Stand | TC ≥ −2 |
| 17 | 12 v 6 | Stand | TC ≥ −1 |
| 18 | 13 v 3 | Stand | TC ≥ −2 |

**Fab 4 surrender deviations:**
| Hand vs Upcard | Surrender if |
|---|---|
| 14 v T | TC ≥ +3 |
| 15 v T | TC ≥ 0 |
| 15 v 9 | TC ≥ +2 |
| 15 v A | TC ≥ +1 |

Advisor logic: compute basic-strategy action, then if the hand matches a deviation and the true count crosses the threshold, override and flag it ("Count deviation: stand 16 v 10 at TC ≥ 0").
