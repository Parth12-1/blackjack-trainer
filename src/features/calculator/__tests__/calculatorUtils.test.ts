import { describe, it, expect } from 'vitest'
import { buildSyntheticShoe, deriveTrueCount } from '../calculatorUtils'

describe('buildSyntheticShoe', () => {
  it('removes cards by rank from a 1-deck shoe', () => {
    const removed = [
      { rank: 'K' as const, suit: '♠' as const, faceDown: false },
      { rank: 'K' as const, suit: '♥' as const, faceDown: false },
    ]
    const shoe = buildSyntheticShoe(1, removed)
    expect(shoe).toHaveLength(50) // 52 - 2
    const kings = shoe.filter(c => c.rank === 'K')
    expect(kings).toHaveLength(2) // started with 4 kings, removed 2
  })

  it('handles removing more of a rank than exist gracefully', () => {
    const removed = Array(10).fill({ rank: 'A' as const, suit: '♠' as const, faceDown: false })
    const shoe = buildSyntheticShoe(1, removed)
    // 1 deck has 4 aces — removing 10 of them just removes all 4
    const aces = shoe.filter(c => c.rank === 'A')
    expect(aces).toHaveLength(0)
    expect(shoe.length).toBeGreaterThan(0)
  })
})

describe('deriveTrueCount', () => {
  it('matches calcTrueCount with calcDecksRemaining', () => {
    // 156 cards seen of 312 (6 decks) → 156 remaining → ~3 decks
    // RC=+6 / 3 decks = TC +2
    const tc = deriveTrueCount(6, 156, 6)
    expect(tc).toBe(2)
  })
})
