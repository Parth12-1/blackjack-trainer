export type { Suit, Rank, Card } from '../engine/cards'
export type { Result } from '../engine/settle'

export type Phase = 'idle' | 'betting' | 'player' | 'dealer' | 'settle'

export interface Hand {
  cards: import('../engine/cards').Card[]
  bet: number
  doubled?: boolean
  settled?: boolean
  result?: import('../engine/settle').Result
  surrendered?: boolean
}
