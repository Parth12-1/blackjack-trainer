import { describe, it, expect } from 'vitest'
import { evaluateHand, isPair, canDouble, canSurrender } from '../hand'
import type { Card } from '../cards'

const c = (rank: Card['rank'], suit: Card['suit'] = '♠'): Card => ({ rank, suit })

describe('evaluateHand', () => {
  it('soft 17: A+6', () => {
    const h = evaluateHand([c('A'), c('6')])
    expect(h.total).toBe(17)
    expect(h.soft).toBe(true)
    expect(h.bust).toBe(false)
  })
  it('hard 17: T+7', () => {
    const h = evaluateHand([c('T'), c('7')])
    expect(h.total).toBe(17)
    expect(h.soft).toBe(false)
  })
  it('soft becomes hard: A+6+6 = hard 13', () => {
    const h = evaluateHand([c('A'), c('6'), c('6')])
    expect(h.total).toBe(13)
    expect(h.soft).toBe(false)
  })
  it('blackjack: A+K', () => {
    const h = evaluateHand([c('A'), c('K')])
    expect(h.blackjack).toBe(true)
    expect(h.total).toBe(21)
  })
  it('21 with 3 cards is not blackjack', () => {
    const h = evaluateHand([c('7'), c('7'), c('7')])
    expect(h.total).toBe(21)
    expect(h.blackjack).toBe(false)
  })
  it('bust: T+T+T', () => {
    const h = evaluateHand([c('T'), c('T'), c('T')])
    expect(h.bust).toBe(true)
    expect(h.total).toBe(30)
  })
  it('two aces: A+A = soft 12', () => {
    const h = evaluateHand([c('A'), c('A')])
    expect(h.total).toBe(12)
    expect(h.soft).toBe(true)
  })
  it('skips face-down cards', () => {
    const h = evaluateHand([c('T'), { rank: 'K', suit: '♠', faceDown: true }])
    expect(h.total).toBe(10)
  })
})

describe('isPair', () => {
  it('same rank pair', () => expect(isPair([c('8'), c('8')])).toBe(true))
  it('different ranks', () => expect(isPair([c('8'), c('9')])).toBe(false))
  it('3 cards not pair', () => expect(isPair([c('8'), c('8'), c('2')])).toBe(false))
})

describe('canDouble', () => {
  it('2 cards = true', () => expect(canDouble([c('5'), c('6')])).toBe(true))
  it('3 cards = false', () => expect(canDouble([c('5'), c('3'), c('3')])).toBe(false))
})

describe('canSurrender', () => {
  it('2 cards no split = true', () => expect(canSurrender([c('T'), c('6')], 0)).toBe(true))
  it('after split = false', () => expect(canSurrender([c('T'), c('6')], 1)).toBe(false))
  it('3 cards = false', () => expect(canSurrender([c('5'), c('6'), c('5')], 0)).toBe(false))
})
