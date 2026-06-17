export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank = 'A'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'

export interface Card {
  rank: Rank
  suit: Suit
  faceDown?: boolean
}

const TEN_VALUE_RANKS = new Set<Rank>(['T', 'J', 'Q', 'K'])

export function cardValues(rank: Rank): number[] {
  if (rank === 'A') return [1, 11]
  if (TEN_VALUE_RANKS.has(rank)) return [10]
  return [parseInt(rank)]
}

export function hiLoValue(rank: Rank): -1 | 0 | 1 {
  if (['2','3','4','5','6'].includes(rank)) return 1
  if (['7','8','9'].includes(rank)) return 0
  return -1
}
