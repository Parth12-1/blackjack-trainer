import type { HandValue } from './hand'

export type Result = 'blackjack' | 'win' | 'push' | 'lose' | 'surrender' | 'bust'

export interface SettleInput {
  playerValue: HandValue
  dealerValue: HandValue
  bet: number
  isBlackjack: boolean
  isSurrender: boolean
  dealerBlackjack: boolean
}

export interface SettleResult {
  result: Result
  payout: number  // net change to bankroll
}

export function settleHand(input: SettleInput): SettleResult {
  const { playerValue, dealerValue, bet, isBlackjack, isSurrender, dealerBlackjack } = input

  if (isSurrender) {
    return { result: 'surrender', payout: -Math.floor(bet / 2) }
  }

  // Both blackjack = push
  if (isBlackjack && dealerBlackjack) {
    return { result: 'push', payout: 0 }
  }

  // Player blackjack (dealer doesn't have one)
  if (isBlackjack && !dealerBlackjack) {
    return { result: 'blackjack', payout: Math.floor(bet * 1.5) }
  }

  // Player bust
  if (playerValue.bust) {
    return { result: 'bust', payout: -bet }
  }

  // Dealer blackjack (player doesn't have one)
  if (dealerBlackjack && !isBlackjack) {
    return { result: 'lose', payout: -bet }
  }

  // Dealer bust
  if (dealerValue.bust) {
    return { result: 'win', payout: bet }
  }

  if (playerValue.total > dealerValue.total) return { result: 'win', payout: bet }
  if (playerValue.total < dealerValue.total) return { result: 'lose', payout: -bet }
  return { result: 'push', payout: 0 }
}
