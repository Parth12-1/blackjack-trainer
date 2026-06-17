import { describe, it, expect } from 'vitest'
import { aggregateExpectedPayout } from '../evPayout'
import type { Card } from '../../../engine/cards'

const card = (rank: string): Card => ({ rank: rank as Card['rank'], suit: '♠', faceDown: false })

describe('aggregateExpectedPayout', () => {
  it('sums ev*bet across live hands, excludes surrendered and settled', () => {
    const hands = [
      { cards: [card('K'), card('K')], bet: 10 },
      { cards: [card('5'), card('6')], bet: 20 },
      { cards: [card('2'), card('3')], bet: 10, surrendered: true },
      { cards: [card('A'), card('7')], bet: 15, settled: true },
    ]
    // ev: K,K hand → 0.5; 5,6 hand → -0.2; others excluded
    const ev = (cards: Card[]) => cards[0].rank === 'K' ? 0.5 : -0.2
    const r = aggregateExpectedPayout(hands, ev)
    expect(r.perHand).toEqual([5, -4, 0, 0])
    expect(r.total).toBeCloseTo(1)
  })

  it('returns total 0 when all hands are settled', () => {
    const hands = [{ cards: [card('T'), card('T')], bet: 25, settled: true }]
    const r = aggregateExpectedPayout(hands, () => 0.6)
    expect(r.total).toBe(0)
    expect(r.perHand).toEqual([0])
  })
})
