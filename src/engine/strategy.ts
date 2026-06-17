import type { Card, Rank } from './cards'
import { evaluateHand, isPair, canSurrender } from './hand'

export type Action = 'H' | 'S' | 'D' | 'Ds' | 'P' | 'R' | 'Rp'

// Dealer upcard index: 2,3,4,5,6,7,8,9,T,A
function upcardIndex(rank: Rank): number {
  const map: Record<string, number> = {
    '2': 0, '3': 1, '4': 2, '5': 3, '6': 4,
    '7': 5, '8': 6, '9': 7, 'T': 8, 'J': 8, 'Q': 8, 'K': 8, 'A': 9,
  }
  return map[rank] ?? 8
}

// Hard totals: rows 5–21, cols = dealer 2,3,4,5,6,7,8,9,T,A
const HARD_TABLE: Record<number, Action[]> = {
  5:  ['H','H','H','H','H','H','H','H','H','H'],
  6:  ['H','H','H','H','H','H','H','H','H','H'],
  7:  ['H','H','H','H','H','H','H','H','H','H'],
  8:  ['H','H','H','H','H','H','H','H','H','H'],
  9:  ['H','D','D','D','D','H','H','H','H','H'],
  10: ['D','D','D','D','D','D','D','D','H','H'],
  11: ['D','D','D','D','D','D','D','D','D','D'],
  12: ['H','H','S','S','S','H','H','H','H','H'],
  13: ['S','S','S','S','S','H','H','H','H','H'],
  14: ['S','S','S','S','S','H','H','H','H','H'],
  15: ['S','S','S','S','S','H','H','H','H','H'],
  16: ['S','S','S','S','S','H','H','H','H','H'],
  17: ['S','S','S','S','S','S','S','S','S','S'],
  18: ['S','S','S','S','S','S','S','S','S','S'],
  19: ['S','S','S','S','S','S','S','S','S','S'],
  20: ['S','S','S','S','S','S','S','S','S','S'],
  21: ['S','S','S','S','S','S','S','S','S','S'],
}

// Soft totals: key = non-ace card value (A,2=13 → 2, A,9=20 → 9)
// Stored as A,X where X is rank value 2–9
const SOFT_TABLE: Record<number, Action[]> = {
  2:  ['H','H','H','D','D','H','H','H','H','H'],  // A,2 (13)
  3:  ['H','H','H','D','D','H','H','H','H','H'],  // A,3 (14)
  4:  ['H','H','D','D','D','H','H','H','H','H'],  // A,4 (15)
  5:  ['H','H','D','D','D','H','H','H','H','H'],  // A,5 (16)
  6:  ['H','D','D','D','D','H','H','H','H','H'],  // A,6 (17)
  7:  ['Ds','Ds','Ds','Ds','Ds','S','S','H','H','H'],  // A,7 (18)
  8:  ['S','S','S','S','Ds','S','S','S','S','S'],      // A,8 (19)
  9:  ['S','S','S','S','S','S','S','S','S','S'],       // A,9 (20)
}

// Pairs: key = rank
const PAIR_TABLE: Record<string, Action[]> = {
  'A': ['P','P','P','P','P','P','P','P','P','P'],
  'T': ['S','S','S','S','S','S','S','S','S','S'],
  'J': ['S','S','S','S','S','S','S','S','S','S'],
  'Q': ['S','S','S','S','S','S','S','S','S','S'],
  'K': ['S','S','S','S','S','S','S','S','S','S'],
  '9': ['P','P','P','P','P','S','P','P','S','S'],
  '8': ['P','P','P','P','P','P','P','P','P','P'],
  '7': ['P','P','P','P','P','P','H','H','H','H'],
  '6': ['P','P','P','P','P','H','H','H','H','H'],
  '5': ['D','D','D','D','D','D','D','D','H','H'],  // treat 5,5 as hard 10
  '4': ['H','H','H','P','P','H','H','H','H','H'],
  '3': ['P','P','P','P','P','P','H','H','H','H'],
  '2': ['P','P','P','P','P','P','H','H','H','H'],
}

// Surrender rules (hard 15 vs T, hard 16 vs 9/T/A) — checked before pair/soft/hard
// Returns R if should surrender, null otherwise
function checkSurrender(
  cards: Card[],
  dealerRank: Rank,
  splitCount: number,
  surrenderAllowed: boolean,
): Action | null {
  if (!surrenderAllowed || !canSurrender(cards, splitCount)) return null
  const { total, soft } = evaluateHand(cards)
  if (soft) return null
  const di = upcardIndex(dealerRank)
  if (total === 16 && [7, 8, 9].includes(di)) return 'R'  // vs 9, T, A
  if (total === 15 && di === 8) return 'R'  // vs T
  return null
}

export function basicStrategy(
  playerCards: Card[],
  dealerUpcard: Card,
  splitCount: number,
  settings: { das: boolean; surrender: boolean },
): Action {
  const di = upcardIndex(dealerUpcard.rank)
  const { total, soft } = evaluateHand(playerCards)
  const pair = isPair(playerCards)

  // 1. Surrender (first 2 cards, no pairs bypass — but 8,8 always splits, so check pairs first...
  //    Actually: check surrender BEFORE pairs to handle hard 16 vs 9/T/A correctly.
  //    8,8 vs any: pair table returns P, which overrides. Surrender only fires on non-pair or
  //    after pair table returns non-P. Spec says: "8,8 never surrenders — always split"
  //    So we check pairs first if it's 8,8, otherwise surrender first.
  if (pair && playerCards[0].rank === '8') {
    // 8,8 always splits
    return 'P'
  }

  const surrenderAction = checkSurrender(playerCards, dealerUpcard.rank, splitCount, settings.surrender)
  if (surrenderAction) return surrenderAction

  // 2. Pairs (when DAS allowed, which is always in our config)
  if (pair && splitCount < 3) {
    const rank = playerCards[0].rank
    const row = PAIR_TABLE[rank]
    if (row) {
      // 5,5 falls through to hard 10 (treated as hard 10, never split — table has D entries)
      if (rank !== '5') {
        return row[di]
      }
    }
  }

  // 3. Soft totals
  if (soft && total >= 13 && total <= 20) {
    const otherVal = total - 11
    if (otherVal >= 2 && otherVal <= 9) {
      const row = SOFT_TABLE[otherVal]
      if (row) return row[di]
    }
  }

  // 4. Hard totals
  const hardTotal = Math.min(Math.max(total, 5), 21)
  const hardRow = HARD_TABLE[hardTotal]
  if (hardRow) return hardRow[di]

  return 'H'
}

export type FinalAction = 'H' | 'S' | 'D' | 'P' | 'R'

export function resolveAction(
  action: Action,
  canDoubleDown: boolean,
  canSplitHand: boolean,
  canSurrenderHand: boolean,
): FinalAction {
  switch (action) {
    case 'D':  return canDoubleDown ? 'D' : 'H'
    case 'Ds': return canDoubleDown ? 'D' : 'S'
    case 'P':  return canSplitHand  ? 'P' : 'H'
    case 'Rp': return canSurrenderHand ? 'R' : (canSplitHand ? 'P' : 'H')
    case 'R':  return canSurrenderHand ? 'R' : 'H'
    default:   return action as FinalAction
  }
}
