import type { Card } from './cards'
import { cardValues } from './cards'

export interface HandValue {
  total: number
  soft: boolean
  bust: boolean
  blackjack: boolean
}

export function evaluateHand(cards: Card[]): HandValue {
  let total = 0
  let aces = 0

  for (const card of cards) {
    if (card.faceDown) continue
    const vals = cardValues(card.rank)
    if (vals.length === 2) {
      aces++
      total += 1
    } else {
      total += vals[0]
    }
  }

  let soft = false
  for (let i = 0; i < aces; i++) {
    if (total + 10 <= 21) {
      total += 10
      soft = true
      break
    }
  }
  // if we used soft ace but adding another would bust, un-soft
  if (soft && total > 21) {
    total -= 10
    soft = false
  }

  const visibleCards = cards.filter(c => !c.faceDown)
  const blackjack =
    visibleCards.length === 2 &&
    total === 21 &&
    visibleCards.some(c => c.rank === 'A') &&
    visibleCards.some(c => ['T','J','Q','K'].includes(c.rank))

  return { total, soft, bust: total > 21, blackjack }
}

export function isPair(cards: Card[]): boolean {
  const visible = cards.filter(c => !c.faceDown)
  if (visible.length !== 2) return false
  // Treat all 10-value cards as splittable pairs only if same rank
  return visible[0].rank === visible[1].rank
}

export function canDouble(cards: Card[]): boolean {
  return cards.filter(c => !c.faceDown).length === 2
}

export function canSplit(cards: Card[], splitCount: number): boolean {
  return isPair(cards) && splitCount < 3
}

export function canSurrender(cards: Card[], splitCount: number): boolean {
  return cards.filter(c => !c.faceDown).length === 2 && splitCount === 0
}
