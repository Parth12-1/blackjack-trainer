import { describe, it, expect } from 'vitest'
import { basicStrategy } from '../strategy'
import type { Card } from '../cards'

const c = (rank: Card['rank'], suit: Card['suit'] = '♠'): Card => ({ rank, suit })
const s = { das: true, surrender: true }

// Helper: basicStrategy with player cards and dealer upcard rank
const bs = (playerRanks: Card['rank'][], dealerRank: Card['rank']) =>
  basicStrategy(playerRanks.map(r => c(r)), c(dealerRank), 0, s)

describe('Surrender', () => {
  it('hard 16 vs 9 → R', () => expect(bs(['T','6'], '9')).toBe('R'))
  it('hard 16 vs T → R', () => expect(bs(['T','6'], 'T')).toBe('R'))
  it('hard 16 vs A → R', () => expect(bs(['T','6'], 'A')).toBe('R'))
  it('hard 15 vs T → R', () => expect(bs(['T','5'], 'T')).toBe('R'))
  it('hard 16 vs 7 → H (no surrender)', () => expect(bs(['T','6'], '7')).toBe('H'))
  it('8,8 vs A → P not surrender', () => expect(bs(['8','8'], 'A')).toBe('P'))
})

describe('Pairs', () => {
  it('A,A vs 2 → P', () => expect(bs(['A','A'], '2')).toBe('P'))
  it('A,A vs T → P', () => expect(bs(['A','A'], 'T')).toBe('P'))
  it('T,T vs 6 → S', () => expect(bs(['T','T'], '6')).toBe('S'))
  it('T,T vs 2 → S', () => expect(bs(['T','T'], '2')).toBe('S'))
  it('9,9 vs 7 → S', () => expect(bs(['9','9'], '7')).toBe('S'))
  it('9,9 vs 6 → P', () => expect(bs(['9','9'], '6')).toBe('P'))
  it('9,9 vs T → S', () => expect(bs(['9','9'], 'T')).toBe('S'))
  it('8,8 vs T → P', () => expect(bs(['8','8'], 'T')).toBe('P'))
  it('8,8 vs 7 → P', () => expect(bs(['8','8'], '7')).toBe('P'))
  it('7,7 vs 6 → P', () => expect(bs(['7','7'], '6')).toBe('P'))
  it('7,7 vs 8 → H', () => expect(bs(['7','7'], '8')).toBe('H'))
  it('6,6 vs 3 → P', () => expect(bs(['6','6'], '3')).toBe('P'))
  it('6,6 vs 7 → H', () => expect(bs(['6','6'], '7')).toBe('H'))
  it('4,4 vs 5 → P', () => expect(bs(['4','4'], '5')).toBe('P'))
  it('4,4 vs 6 → P', () => expect(bs(['4','4'], '6')).toBe('P'))
  it('4,4 vs 4 → H', () => expect(bs(['4','4'], '4')).toBe('H'))
  it('3,3 vs 4 → P', () => expect(bs(['3','3'], '4')).toBe('P'))
  it('3,3 vs 8 → H', () => expect(bs(['3','3'], '8')).toBe('H'))
  it('2,2 vs 7 → P', () => expect(bs(['2','2'], '7')).toBe('P'))
  it('2,2 vs 8 → H', () => expect(bs(['2','2'], '8')).toBe('H'))
})

describe('Soft totals', () => {
  it('A,7 (18) vs 2 → Ds', () => expect(bs(['A','7'], '2')).toBe('Ds'))
  it('A,7 (18) vs 6 → Ds', () => expect(bs(['A','7'], '6')).toBe('Ds'))
  it('A,7 (18) vs 7 → S', () => expect(bs(['A','7'], '7')).toBe('S'))
  it('A,7 (18) vs 8 → S', () => expect(bs(['A','7'], '8')).toBe('S'))
  it('A,7 (18) vs 9 → H', () => expect(bs(['A','7'], '9')).toBe('H'))
  it('A,8 (19) vs 6 → Ds', () => expect(bs(['A','8'], '6')).toBe('Ds'))
  it('A,8 (19) vs 5 → S', () => expect(bs(['A','8'], '5')).toBe('S'))
  it('A,9 (20) vs any → S', () => expect(bs(['A','9'], '5')).toBe('S'))
  it('A,6 (17) vs 3 → D', () => expect(bs(['A','6'], '3')).toBe('D'))
  it('A,6 (17) vs 2 → H', () => expect(bs(['A','6'], '2')).toBe('H'))
  it('A,5 (16) vs 4 → D', () => expect(bs(['A','5'], '4')).toBe('D'))
  it('A,4 (15) vs 4 → D', () => expect(bs(['A','4'], '4')).toBe('D'))
  it('A,3 (14) vs 5 → D', () => expect(bs(['A','3'], '5')).toBe('D'))
  it('A,2 (13) vs 5 → D', () => expect(bs(['A','2'], '5')).toBe('D'))
  it('A,2 (13) vs 4 → H', () => expect(bs(['A','2'], '4')).toBe('H'))
})

describe('Hard totals', () => {
  it('hard 11 vs any → D', () => {
    for (const d of ['2','3','4','5','6','7','8','9','T','A'] as const) {
      expect(bs(['7','4'], d)).toBe('D')
    }
  })
  it('hard 10 vs 9 → D', () => expect(bs(['6','4'], '9')).toBe('D'))
  it('hard 10 vs T → H', () => expect(bs(['6','4'], 'T')).toBe('H'))
  it('hard 10 vs A → H', () => expect(bs(['6','4'], 'A')).toBe('H'))
  it('hard 9 vs 3 → D', () => expect(bs(['5','4'], '3')).toBe('D'))
  it('hard 9 vs 2 → H', () => expect(bs(['5','4'], '2')).toBe('H'))
  it('hard 9 vs 7 → H', () => expect(bs(['5','4'], '7')).toBe('H'))
  it('hard 12 vs 4 → S', () => expect(bs(['T','2'], '4')).toBe('S'))
  it('hard 12 vs 2 → H', () => expect(bs(['T','2'], '2')).toBe('H'))
  it('hard 12 vs 3 → H', () => expect(bs(['T','2'], '3')).toBe('H'))
  it('hard 13 vs 2 → S', () => expect(bs(['T','3'], '2')).toBe('S'))
  it('hard 13 vs 7 → H', () => expect(bs(['T','3'], '7')).toBe('H'))
  it('hard 17 vs A → S', () => expect(bs(['T','7'], 'A')).toBe('S'))
  it('hard 17 vs 2 → S', () => expect(bs(['T','7'], '2')).toBe('S'))
  it('hard 8 vs 6 → H', () => expect(bs(['5','3'], '6')).toBe('H'))
})

describe('BJA chart exhaustive cells', () => {
  const upcards: Card['rank'][] = ['2','3','4','5','6','7','8','9','T','A']

  it('matches every pair-splitting table cell', () => {
    const rows: Array<[Card['rank'][], string[]]> = [
      [['A','A'], ['P','P','P','P','P','P','P','P','P','P']],
      [['T','T'], ['S','S','S','S','S','S','S','S','S','S']],
      [['9','9'], ['P','P','P','P','P','S','P','P','S','S']],
      [['8','8'], ['P','P','P','P','P','P','P','P','P','P']],
      [['7','7'], ['P','P','P','P','P','P','H','H','H','H']],
      [['6','6'], ['P','P','P','P','P','H','H','H','H','H']],
      [['5','5'], ['D','D','D','D','D','D','D','D','H','H']],
      [['4','4'], ['H','H','H','P','P','H','H','H','H','H']],
      [['3','3'], ['P','P','P','P','P','P','H','H','H','H']],
      [['2','2'], ['P','P','P','P','P','P','H','H','H','H']],
    ]

    for (const [cards, expected] of rows) {
      for (const [i, dealer] of upcards.entries()) {
        expect(bs(cards, dealer)).toBe(expected[i])
      }
    }
  })

  it('matches every soft-total table cell', () => {
    const rows: Array<[Card['rank'][], string[]]> = [
      [['A','9'], ['S','S','S','S','S','S','S','S','S','S']],
      [['A','8'], ['S','S','S','S','Ds','S','S','S','S','S']],
      [['A','7'], ['Ds','Ds','Ds','Ds','Ds','S','S','H','H','H']],
      [['A','6'], ['H','D','D','D','D','H','H','H','H','H']],
      [['A','5'], ['H','H','D','D','D','H','H','H','H','H']],
      [['A','4'], ['H','H','D','D','D','H','H','H','H','H']],
      [['A','3'], ['H','H','H','D','D','H','H','H','H','H']],
      [['A','2'], ['H','H','H','D','D','H','H','H','H','H']],
    ]

    for (const [cards, expected] of rows) {
      for (const [i, dealer] of upcards.entries()) {
        expect(bs(cards, dealer)).toBe(expected[i])
      }
    }
  })

  it('matches every hard-total table cell with late surrender overrides', () => {
    const rows: Array<[Card['rank'][], string[]]> = [
      [['T','7'], ['S','S','S','S','S','S','S','S','S','S']],
      [['T','6'], ['S','S','S','S','S','H','H','R','R','R']],
      [['T','5'], ['S','S','S','S','S','H','H','H','R','H']],
      [['T','4'], ['S','S','S','S','S','H','H','H','H','H']],
      [['T','3'], ['S','S','S','S','S','H','H','H','H','H']],
      [['T','2'], ['H','H','S','S','S','H','H','H','H','H']],
      [['7','4'], ['D','D','D','D','D','D','D','D','D','D']],
      [['6','4'], ['D','D','D','D','D','D','D','D','H','H']],
      [['5','4'], ['H','D','D','D','D','H','H','H','H','H']],
      [['5','3'], ['H','H','H','H','H','H','H','H','H','H']],
    ]

    for (const [cards, expected] of rows) {
      for (const [i, dealer] of upcards.entries()) {
        expect(bs(cards, dealer)).toBe(expected[i])
      }
    }
  })
})
