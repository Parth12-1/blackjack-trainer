import { describe, expect, it } from 'vitest'
import type { Card, Rank } from '../cards'
import { checkDeviation } from '../deviations'

function c(rank: Rank): Card {
  return { rank, suit: '♠' }
}

describe('counting deviations', () => {
  it('fires Illustrious 18 stand 16 vs T at TC >= 0', () => {
    expect(checkDeviation([c('T'), c('6')], c('T'), 0, false)?.action).toBe('S')
    expect(checkDeviation([c('T'), c('6')], c('T'), -1, false)).toBeNull()
  })

  it('fires double 10 vs A only at TC >= +4', () => {
    expect(checkDeviation([c('6'), c('4')], c('A'), 4, false)?.action).toBe('D')
    expect(checkDeviation([c('6'), c('4')], c('A'), 3, false)).toBeNull()
  })

  it('fires Fab 4 surrender 15 vs A at TC >= +1', () => {
    expect(checkDeviation([c('T'), c('5')], c('A'), 1, false)?.action).toBe('R')
    expect(checkDeviation([c('T'), c('5')], c('A'), 0, false)).toBeNull()
  })

  it('fires insurance at TC >= +3 when checking insurance', () => {
    expect(checkDeviation([c('T'), c('9')], c('A'), 3, true)?.description).toContain('insurance')
    expect(checkDeviation([c('T'), c('9')], c('A'), 2, true)).toBeNull()
  })
})
