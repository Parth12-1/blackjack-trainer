import type { Card } from '../../engine/cards'
import { buildShoe } from '../../engine/shoe'
import { calcTrueCount, calcDecksRemaining } from '../counting/countingUtils'

/**
 * Build a synthetic remaining shoe by starting with a full numDecks shoe
 * and removing each card in `removed` by rank (one removal per entry).
 * Suit is ignored — only rank composition matters.
 */
export function buildSyntheticShoe(numDecks: number, removed: Card[]): Card[] {
  const shoe = buildShoe(numDecks)
  // Remove by rank, one at a time
  for (const rem of removed) {
    const idx = shoe.findIndex(c => c.rank === rem.rank)
    if (idx !== -1) shoe.splice(idx, 1)
  }
  return shoe
}

/**
 * Derive true count from running count + cards seen + numDecks.
 */
export function deriveTrueCount(runningCount: number, cardsSeen: number, numDecks: number): number {
  const decksRemaining = calcDecksRemaining(cardsSeen, numDecks)
  return calcTrueCount(runningCount, decksRemaining)
}
