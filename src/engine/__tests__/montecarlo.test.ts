import { describe, expect, it } from 'vitest'
import type { Card, Rank, Suit } from '../cards'
import { runMonteCarlo } from '../montecarlo'

const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','T','J','Q','K']
const SUITS: Suit[] = ['♠','♥','♦','♣']

function fullShoe(numDecks = 6): Card[] {
  const shoe: Card[] = []
  for (let deck = 0; deck < numDecks; deck++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit })
      }
    }
  }
  return shoe
}

function removeKnownCards(shoe: Card[], knownCards: Card[]): Card[] {
  const remaining = [...shoe]
  for (const known of knownCards) {
    const index = remaining.findIndex(card => card.rank === known.rank && card.suit === known.suit)
    if (index >= 0) remaining.splice(index, 1)
  }
  return remaining
}

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('runMonteCarlo', () => {
  it('keeps player 20 vs dealer 6 near the expected stand win rate', () => {
    const playerCards = [{ rank: 'T', suit: '♠' }, { rank: 'Q', suit: '♥' }] satisfies Card[]
    const dealerUpcard = { rank: '6', suit: '♣' } satisfies Card
    const remainingShoe = removeKnownCards(fullShoe(), [...playerCards, dealerUpcard])
    const originalRandom = Math.random

    Math.random = seededRandom(7646)
    try {
      const result = runMonteCarlo(playerCards, dealerUpcard, remainingShoe, 5000, false)
      expect(result.win).toBeGreaterThanOrEqual(0.79)
      expect(result.win).toBeLessThanOrEqual(0.83)
    } finally {
      Math.random = originalRandom
    }
  })
})
