import type { Card } from './cards'
import { evaluateHand } from './hand'

export function dealerPlay(hand: Card[], shoe: Card[], h17: boolean): Card[] {
  const result = [...hand]
  // reveal face-down card
  for (const c of result) c.faceDown = false

  while (true) {
    const { total, soft, bust } = evaluateHand(result)
    if (bust) break
    if (total > 17) break
    if (total === 17) {
      // S17: stand on soft 17. H17: hit soft 17
      if (!soft) break
      if (!h17) break
    }
    if (shoe.length === 0) break
    result.push({ ...shoe.pop()!, faceDown: false })
  }

  return result
}

export function dealerHasBlackjack(hand: Card[]): boolean {
  const visible = hand.filter(c => !c.faceDown)
  if (visible.length !== 2) return false
  const { total, blackjack } = evaluateHand(visible)
  return blackjack && total === 21
}

export function dealerUpcard(hand: Card[]): Card | undefined {
  return hand.find(c => !c.faceDown)
}
