import { describe, it, expect } from 'vitest'
import { settleHand } from '../settle'
import type { HandValue } from '../hand'

const hv = (total: number, soft = false, bust = false, blackjack = false): HandValue =>
  ({ total, soft, bust, blackjack })

describe('settleHand', () => {
  it('player blackjack vs dealer no BJ → 3:2', () => {
    const r = settleHand({ playerValue: hv(21, false, false, true), dealerValue: hv(17), bet: 10, isBlackjack: true, isSurrender: false, dealerBlackjack: false })
    expect(r.result).toBe('blackjack')
    expect(r.payout).toBe(15)
  })
  it('both blackjack → push', () => {
    const r = settleHand({ playerValue: hv(21, false, false, true), dealerValue: hv(21, false, false, true), bet: 10, isBlackjack: true, isSurrender: false, dealerBlackjack: true })
    expect(r.result).toBe('push')
    expect(r.payout).toBe(0)
  })
  it('player win', () => {
    const r = settleHand({ playerValue: hv(19), dealerValue: hv(17), bet: 10, isBlackjack: false, isSurrender: false, dealerBlackjack: false })
    expect(r.result).toBe('win')
    expect(r.payout).toBe(10)
  })
  it('player lose', () => {
    const r = settleHand({ playerValue: hv(17), dealerValue: hv(19), bet: 10, isBlackjack: false, isSurrender: false, dealerBlackjack: false })
    expect(r.result).toBe('lose')
    expect(r.payout).toBe(-10)
  })
  it('push', () => {
    const r = settleHand({ playerValue: hv(18), dealerValue: hv(18), bet: 10, isBlackjack: false, isSurrender: false, dealerBlackjack: false })
    expect(r.result).toBe('push')
    expect(r.payout).toBe(0)
  })
  it('surrender returns -half', () => {
    const r = settleHand({ playerValue: hv(16), dealerValue: hv(17), bet: 10, isBlackjack: false, isSurrender: true, dealerBlackjack: false })
    expect(r.result).toBe('surrender')
    expect(r.payout).toBe(-5)
  })
  it('player bust → lose', () => {
    const r = settleHand({ playerValue: hv(25, false, true), dealerValue: hv(17), bet: 10, isBlackjack: false, isSurrender: false, dealerBlackjack: false })
    expect(r.result).toBe('bust')
    expect(r.payout).toBe(-10)
  })
  it('dealer bust → player wins', () => {
    const r = settleHand({ playerValue: hv(18), dealerValue: hv(22, false, true), bet: 10, isBlackjack: false, isSurrender: false, dealerBlackjack: false })
    expect(r.result).toBe('win')
    expect(r.payout).toBe(10)
  })
})
