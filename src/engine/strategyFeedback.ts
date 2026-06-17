import type { Card } from './cards'
import { canDouble, canSplit, canSurrender, evaluateHand, isPair } from './hand'
import { basicStrategy, resolveAction, type FinalAction } from './strategy'

export type PlayerDecision = 'hit' | 'stand' | 'double' | 'split' | 'surrender'

export interface StrategyDecision {
  action: PlayerDecision
  code: FinalAction
  label: string
  situation: string
}

export interface StrategyGrade extends StrategyDecision {
  chosenAction: PlayerDecision
  chosenCode: FinalAction
  chosenLabel: string
  correct: boolean
}

const CODE_TO_DECISION: Record<FinalAction, PlayerDecision> = {
  H: 'hit',
  S: 'stand',
  D: 'double',
  P: 'split',
  R: 'surrender',
}

const DECISION_TO_CODE: Record<PlayerDecision, FinalAction> = {
  hit: 'H',
  stand: 'S',
  double: 'D',
  split: 'P',
  surrender: 'R',
}

export const PLAYER_DECISION_LABELS: Record<PlayerDecision, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
}

function rankLabel(card: Card): string {
  return card.rank === 'T' ? '10' : card.rank
}

export function describeStrategySituation(playerCards: Card[], dealerUpcard: Card): string {
  const dealer = rankLabel(dealerUpcard)
  const { total, soft } = evaluateHand(playerCards)

  if (isPair(playerCards)) {
    return `${rankLabel(playerCards[0])},${rankLabel(playerCards[1])} vs dealer ${dealer}`
  }

  return `${soft ? 'Soft' : 'Hard'} ${total} vs dealer ${dealer}`
}

export function getBasicStrategyDecision(input: {
  playerCards: Card[]
  dealerUpcard: Card
  splitCount: number
  surrenderAllowed: boolean
}): StrategyDecision {
  const { playerCards, dealerUpcard, splitCount, surrenderAllowed } = input
  const canDoubleNow = canDouble(playerCards)
  const canSplitNow = canSplit(playerCards, splitCount)
  const canSurrenderNow = surrenderAllowed && canSurrender(playerCards, splitCount)
  const rawAction = basicStrategy(playerCards, dealerUpcard, splitCount, {
    das: true,
    surrender: surrenderAllowed,
  })
  const code = resolveAction(rawAction, canDoubleNow, canSplitNow, canSurrenderNow)
  const action = CODE_TO_DECISION[code]

  return {
    action,
    code,
    label: PLAYER_DECISION_LABELS[action],
    situation: describeStrategySituation(playerCards, dealerUpcard),
  }
}

export function gradeBasicStrategyDecision(input: {
  playerCards: Card[]
  dealerUpcard: Card
  splitCount: number
  surrenderAllowed: boolean
  chosenAction: PlayerDecision
}): StrategyGrade {
  const decision = getBasicStrategyDecision(input)
  const chosenCode = DECISION_TO_CODE[input.chosenAction]

  return {
    ...decision,
    chosenAction: input.chosenAction,
    chosenCode,
    chosenLabel: PLAYER_DECISION_LABELS[input.chosenAction],
    correct: chosenCode === decision.code,
  }
}
