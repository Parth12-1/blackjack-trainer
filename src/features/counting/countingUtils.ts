/**
 * Shared counting utilities for the Counting Trainer.
 * All modules import from here so count math stays consistent.
 */

/**
 * Round decks to nearest 0.5, floor at 0.5.
 * Doc: "Decks remaining ≈ cards left ÷ 52, round to nearest 0.5 deck."
 */
export function calcDecksRemaining(cardsDealt: number, numDecks: number): number {
  const cardsRemaining = numDecks * 52 - cardsDealt
  const raw = cardsRemaining / 52
  const rounded = Math.round(raw * 2) / 2  // nearest 0.5
  return Math.max(rounded, 0.5)
}

/**
 * True count = running count / decks remaining.
 * Doc examples: RC +10 / 5 decks = +2, RC -7 / 2 decks = -3 (rounded).
 */
export function calcTrueCount(runningCount: number, decksRemaining: number): number {
  return Math.round(runningCount / decksRemaining)
}

/**
 * Bet units from true count per the bet ramp:
 * TC ≤ 1 → 1u · 2 → 2u · 3 → 4u · 4 → 8u · 5+ → 12u
 */
export function calcBetUnits(trueCount: number): number {
  if (trueCount <= 1) return 1
  if (trueCount <= 2) return 2
  if (trueCount <= 3) return 4
  if (trueCount <= 4) return 8
  return 12
}

/**
 * Human-readable Hi-Lo value label.
 */
export function hiLoLabel(value: -1 | 0 | 1): string {
  if (value === 1) return '+1'
  if (value === -1) return '-1'
  return '0'
}
