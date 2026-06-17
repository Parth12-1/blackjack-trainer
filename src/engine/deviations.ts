import type { Card, Rank } from './cards'
import { evaluateHand, isPair } from './hand'

export interface Deviation {
  id: number
  description: string
  action: 'H' | 'S' | 'D' | 'P' | 'R'
  threshold: number
  condition: 'gte' | 'lte'
}

type UpcardKey = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'A'

function normUpcard(rank: Rank): UpcardKey {
  if (['J','Q','K'].includes(rank)) return 'T'
  return rank as UpcardKey
}

interface DevRule {
  id: number
  description: string
  action: Deviation['action']
  threshold: number
  condition: 'gte' | 'lte'
  match: (playerCards: Card[], upcard: UpcardKey) => boolean
}

const DEVIATION_RULES: DevRule[] = [
  // Illustrious 18
  {
    id: 1, description: 'Insurance at TC ≥ +3', action: 'H', threshold: 3, condition: 'gte',
    match: (_, _u) => false, // insurance is handled separately via isInsurance flag
  },
  {
    id: 2, description: 'Stand 16 vs T at TC ≥ 0', action: 'S', threshold: 0, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 16 && u === 'T' },
  },
  {
    id: 3, description: 'Stand 15 vs T at TC ≥ +4', action: 'S', threshold: 4, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 15 && u === 'T' },
  },
  {
    id: 4, description: 'Split T,T vs 5 at TC ≥ +5', action: 'P', threshold: 5, condition: 'gte',
    match: (cards, u) => isPair(cards) && cards[0].rank === 'T' && u === '5',
  },
  {
    id: 5, description: 'Split T,T vs 6 at TC ≥ +4', action: 'P', threshold: 4, condition: 'gte',
    match: (cards, u) => isPair(cards) && cards[0].rank === 'T' && u === '6',
  },
  {
    id: 6, description: 'Double 10 vs T at TC ≥ +4', action: 'D', threshold: 4, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 10 && u === 'T' },
  },
  {
    id: 7, description: 'Stand 12 vs 3 at TC ≥ +2', action: 'S', threshold: 2, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 12 && u === '3' },
  },
  {
    id: 8, description: 'Stand 12 vs 2 at TC ≥ +3', action: 'S', threshold: 3, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 12 && u === '2' },
  },
  {
    id: 9, description: 'Double 11 vs A at TC ≥ +1', action: 'D', threshold: 1, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 11 && u === 'A' },
  },
  {
    id: 10, description: 'Double 9 vs 2 at TC ≥ +1', action: 'D', threshold: 1, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 9 && u === '2' },
  },
  {
    id: 11, description: 'Double 10 vs A at TC ≥ +4', action: 'D', threshold: 4, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 10 && u === 'A' },
  },
  {
    id: 12, description: 'Double 9 vs 7 at TC ≥ +3', action: 'D', threshold: 3, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 9 && u === '7' },
  },
  {
    id: 13, description: 'Stand 16 vs 9 at TC ≥ +5', action: 'S', threshold: 5, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 16 && u === '9' },
  },
  {
    id: 14, description: 'Stand 13 vs 2 at TC ≥ -1', action: 'S', threshold: -1, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 13 && u === '2' },
  },
  {
    id: 15, description: 'Stand 12 vs 4 at TC ≥ 0', action: 'S', threshold: 0, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 12 && u === '4' },
  },
  {
    id: 16, description: 'Stand 12 vs 5 at TC ≥ -2', action: 'S', threshold: -2, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 12 && u === '5' },
  },
  {
    id: 17, description: 'Stand 12 vs 6 at TC ≥ -1', action: 'S', threshold: -1, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 12 && u === '6' },
  },
  {
    id: 18, description: 'Stand 13 vs 3 at TC ≥ -2', action: 'S', threshold: -2, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 13 && u === '3' },
  },
  // Fab 4 surrender deviations
  {
    id: 19, description: 'Surrender 14 vs T at TC ≥ +3', action: 'R', threshold: 3, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 14 && u === 'T' },
  },
  {
    id: 20, description: 'Surrender 15 vs T at TC ≥ 0', action: 'R', threshold: 0, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 15 && u === 'T' },
  },
  {
    id: 21, description: 'Surrender 15 vs 9 at TC ≥ +2', action: 'R', threshold: 2, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 15 && u === '9' },
  },
  {
    id: 22, description: 'Surrender 15 vs A at TC ≥ +1', action: 'R', threshold: 1, condition: 'gte',
    match: (cards, u) => { const { total, soft } = evaluateHand(cards); return !soft && total === 15 && u === 'A' },
  },
]

export function checkDeviation(
  playerCards: Card[],
  dealerUpcard: Card,
  trueCount: number,
  isInsurance: boolean,
): Deviation | null {
  // Insurance deviation
  if (isInsurance && trueCount >= 3) {
    return { id: 1, description: 'Take insurance at TC ≥ +3', action: 'H', threshold: 3, condition: 'gte' }
  }

  const upcard = normUpcard(dealerUpcard.rank)

  for (const rule of DEVIATION_RULES) {
    if (rule.id === 1) continue  // insurance handled above
    if (!rule.match(playerCards, upcard)) continue

    const triggered = rule.condition === 'gte'
      ? trueCount >= rule.threshold
      : trueCount <= rule.threshold

    if (triggered) {
      return {
        id: rule.id,
        description: rule.description,
        action: rule.action,
        threshold: rule.threshold,
        condition: rule.condition,
      }
    }
  }

  return null
}

export function getAllActiveDeviations(
  playerCards: Card[],
  dealerUpcard: Card,
  _trueCount: number,
): Deviation[] {
  const upcard = normUpcard(dealerUpcard.rank)
  return DEVIATION_RULES
    .filter(rule => rule.id !== 1 && rule.match(playerCards, upcard))
    .map(rule => ({
      id: rule.id,
      description: rule.description,
      action: rule.action,
      threshold: rule.threshold,
      condition: rule.condition,
    }))
}

export function getDeviationRulesSummary(): Array<{
  id: number
  description: string
  action: Deviation['action']
  threshold: number
  condition: 'gte' | 'lte'
}> {
  return DEVIATION_RULES.map(r => ({
    id: r.id,
    description: r.description,
    action: r.action,
    threshold: r.threshold,
    condition: r.condition,
  }))
}
