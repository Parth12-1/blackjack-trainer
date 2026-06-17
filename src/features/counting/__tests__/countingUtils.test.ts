import { describe, expect, it } from 'vitest'
import { calcBetUnits, calcDecksRemaining, calcTrueCount } from '../countingUtils'

describe('counting utilities', () => {
  it('calculates decks remaining rounded to the nearest half deck', () => {
    expect(calcDecksRemaining(0, 6)).toBe(6)
    expect(calcDecksRemaining(26, 6)).toBe(5.5)
    expect(calcDecksRemaining(300, 6)).toBe(0.5)
  })

  it('calculates rounded true count', () => {
    expect(calcTrueCount(10, 5)).toBe(2)
    expect(calcTrueCount(-7, 2)).toBe(-3)
    expect(calcTrueCount(5, 2)).toBe(3)
  })

  it('calculates the specified bet ramp', () => {
    expect(calcBetUnits(1)).toBe(1)
    expect(calcBetUnits(2)).toBe(2)
    expect(calcBetUnits(3)).toBe(4)
    expect(calcBetUnits(4)).toBe(8)
    expect(calcBetUnits(5)).toBe(12)
  })
})
