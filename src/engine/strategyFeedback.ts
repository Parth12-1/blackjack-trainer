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

export function getStrategyExplanation(
  playerCards: Card[],
  dealerUpcard: Card,
  recommended: PlayerDecision,
  chosen: PlayerDecision,
): string {
  const { total, soft } = evaluateHand(playerCards)
  const dealerRank = dealerUpcard.rank === 'T' ? '10' : dealerUpcard.rank
  const dealerVal = ['T', 'J', 'Q', 'K'].includes(dealerUpcard.rank) ? 10
    : dealerUpcard.rank === 'A' ? 11
    : parseInt(dealerUpcard.rank)
  const pair = isPair(playerCards)
  const pairRank = pair ? (playerCards[0].rank === 'T' ? '10' : playerCards[0].rank) : null

  // Split explanations
  if (recommended === 'split' && chosen !== 'split') {
    if (pairRank === 'A') return 'Always split Aces — each Ace is the best possible start for a new hand, giving you a shot at blackjack or 21. Keeping A,A = soft 12, which is weak.'
    if (pairRank === '8') return 'Always split 8s — hard 16 is the worst hand in blackjack (busts if you hit, loses to most dealer hands if you stand). Two 8s each have a shot at a decent hand.'
    if (['2', '3', '6', '7'].includes(pairRank ?? ''))
      return `Split ${pairRank}s vs dealer ${dealerRank} because each card can draw to 10+ (double territory). The dealer ${dealerRank} is likely to make only 17 or bust, so two independent hands beat one weak ${total}.`
    if (pairRank === '9' && dealerVal <= 6)
      return `Split 9s vs dealer ${dealerRank} — dealer bust cards (2-6) make splitting profitable. Two 9s can each draw to 19 or better; hard 18 just sits there.`
    return `Splitting here gives you two independent hands, each starting from a better position than ${soft ? 'soft' : 'hard'} ${total}. The dealer ${dealerRank} upcard makes splitting +EV.`
  }

  // Double explanations
  if (recommended === 'double' && chosen !== 'double') {
    if (total === 11) return `Hard 11 is the strongest doubling hand — any 10-value card (30% of deck) gives you 21. Doubling locks in 2× the bet at maximum advantage.`
    if (total === 10 && dealerVal <= 9) return `Hard 10 vs dealer ${dealerRank}: you're likely to draw to 20 and dealer can't beat that without blackjack. Doubling collects 2× profit from a strong spot.`
    if (total === 9 && dealerVal >= 3 && dealerVal <= 6) return `Hard 9 vs dealer ${dealerRank} (a bust card): dealer busts ~36-42% of the time here. Doubling 9 lets you extract maximum value from the dealer's vulnerability.`
    if (soft) return `Soft ${total} vs dealer ${dealerRank}: you can't bust on the next card (Ace drops to 1 if needed), making this a safe double. Dealer ${dealerRank} is weak enough to profit from 2× the bet.`
    return `This is a doubling situation where your hand total and dealer ${dealerRank} upcard make 2× the bet +EV. You risk one more card but can't do worse than your current hand allows.`
  }

  // Hit when stood explanations
  if (recommended === 'hit' && chosen === 'stand') {
    if (dealerVal >= 7) {
      return `Dealer ${dealerRank} makes 17-21 roughly ${dealerVal >= 10 ? 77 : dealerVal >= 9 ? 77 : 74}% of the time — standing on ${soft ? 'soft' : 'hard'} ${total} loses to all of those. Hitting gives you a chance to improve, even though busting is a risk.`
    }
    if (total <= 12) return `Hard ${total} is low enough that hitting is almost always correct unless the dealer shows a bust card (4-6). Dealer ${dealerRank} makes a pat hand more often than not.`
    return `Hard ${total} vs dealer ${dealerRank}: the dealer completes their hand often enough that standing here loses more than hitting and risking a bust.`
  }

  // Stand when should hit
  if (recommended === 'stand' && chosen === 'hit') {
    if (dealerVal <= 6) return `Dealer ${dealerRank} is a bust card — they bust 35-42% of the time. Standing and letting the dealer bust is free money; hitting risks busting yourself unnecessarily.`
    return `Standing on ${soft ? 'soft' : 'hard'} ${total} vs dealer ${dealerRank} is correct here — the dealer's hand is constrained enough that your total holds up.`
  }

  // Surrender
  if (recommended === 'surrender') {
    return `Surrendering ${soft ? 'soft' : 'hard'} ${total} vs dealer ${dealerRank} saves half your bet. This hand loses more than 50% of the time when played out, so surrendering is the mathematically correct loss-minimizer.`
  }

  // Generic fallback
  return `The chart recommends ${PLAYER_DECISION_LABELS[recommended]} here because the combination of your ${soft ? 'soft' : 'hard'} ${total} and dealer ${dealerRank} upcard makes it the highest expected-value play according to basic strategy simulations over millions of hands.`
}
