import { describe, expect, it } from 'vitest'
import type { Card, Rank } from '../cards'
import {
  describeStrategySituation,
  getBasicStrategyDecision,
  gradeBasicStrategyDecision,
} from '../strategyFeedback'

function c(rank: Rank): Card {
  return { rank, suit: '♠' }
}

describe('strategy feedback', () => {
  it('grades hard 9 vs strong dealer upcard as hit', () => {
    const grade = gradeBasicStrategyDecision({
      playerCards: [c('7'), c('2')],
      dealerUpcard: c('A'),
      splitCount: 0,
      surrenderAllowed: true,
      chosenAction: 'hit',
    })

    expect(grade.correct).toBe(true)
    expect(grade.action).toBe('hit')
    expect(grade.situation).toBe('Hard 9 vs dealer A')
  })

  it('marks a wrong choice and returns the chart action', () => {
    const grade = gradeBasicStrategyDecision({
      playerCards: [c('7'), c('2')],
      dealerUpcard: c('A'),
      splitCount: 0,
      surrenderAllowed: true,
      chosenAction: 'double',
    })

    expect(grade.correct).toBe(false)
    expect(grade.chosenLabel).toBe('Double')
    expect(grade.label).toBe('Hit')
  })

  it('uses surrender when the BJA chart calls for it', () => {
    const decision = getBasicStrategyDecision({
      playerCards: [c('T'), c('6')],
      dealerUpcard: c('T'),
      splitCount: 0,
      surrenderAllowed: true,
    })

    expect(decision.action).toBe('surrender')
  })

  it('uses pair splitting and soft total descriptions', () => {
    expect(describeStrategySituation([c('8'), c('8')], c('A'))).toBe('8,8 vs dealer A')
    expect(describeStrategySituation([c('A'), c('7')], c('2'))).toBe('Soft 18 vs dealer 2')
    expect(getBasicStrategyDecision({
      playerCards: [c('8'), c('8')],
      dealerUpcard: c('A'),
      splitCount: 0,
      surrenderAllowed: true,
    }).action).toBe('split')
  })
})
