import { describe, it, expect } from 'vitest'
import { cardValues, hiLoValue } from '../cards'

describe('cardValues', () => {
  it('ace returns [1,11]', () => expect(cardValues('A')).toEqual([1, 11]))
  it('2 returns [2]', () => expect(cardValues('2')).toEqual([2]))
  it('9 returns [9]', () => expect(cardValues('9')).toEqual([9]))
  it('T returns [10]', () => expect(cardValues('T')).toEqual([10]))
  it('J returns [10]', () => expect(cardValues('J')).toEqual([10]))
  it('Q returns [10]', () => expect(cardValues('Q')).toEqual([10]))
  it('K returns [10]', () => expect(cardValues('K')).toEqual([10]))
})

describe('hiLoValue', () => {
  it('2–6 = +1', () => {
    for (const r of ['2','3','4','5','6'] as const) expect(hiLoValue(r)).toBe(1)
  })
  it('7–9 = 0', () => {
    for (const r of ['7','8','9'] as const) expect(hiLoValue(r)).toBe(0)
  })
  it('T,J,Q,K,A = -1', () => {
    for (const r of ['T','J','Q','K','A'] as const) expect(hiLoValue(r)).toBe(-1)
  })
})
