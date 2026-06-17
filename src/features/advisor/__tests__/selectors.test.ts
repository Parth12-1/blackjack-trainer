import { describe, expect, it } from 'vitest'
import { selectActivePlayerCards } from '../selectors'
import type { Card } from '../../../engine/cards'
import type { Hand } from '../../../types/game'

function card(rank: Card['rank']): Card {
  return { rank, suit: '♠' }
}

describe('advisor selectors', () => {
  it('returns a cached empty hand when no active hand exists', () => {
    const state = { hands: [], activeHandIndex: 0 }

    expect(selectActivePlayerCards(state)).toBe(selectActivePlayerCards(state))
  })

  it('returns the active hand cards by reference', () => {
    const cards = [card('T'), card('6')]
    const hands: Hand[] = [
      { cards: [card('8'), card('8')], bet: 5 },
      { cards, bet: 5 },
    ]

    expect(selectActivePlayerCards({ hands, activeHandIndex: 1 })).toBe(cards)
  })
})
