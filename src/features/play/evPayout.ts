import type { Card } from '../../engine/cards'

export interface AggregatePayoutResult {
  total: number
  perHand: number[]
}

export function aggregateExpectedPayout(
  hands: Array<{ cards: Card[]; bet: number; settled?: boolean; surrendered?: boolean }>,
  evForHand: (cards: Card[]) => number,
): AggregatePayoutResult {
  const perHand: number[] = hands.map(hand => {
    if (hand.settled || hand.surrendered) return 0
    return evForHand(hand.cards) * hand.bet
  })

  const total = perHand.reduce((sum, v) => sum + v, 0)
  return { total, perHand }
}
