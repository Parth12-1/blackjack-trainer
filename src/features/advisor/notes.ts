import type { Card } from '../../engine/cards'
import { evaluateHand, isPair } from '../../engine/hand'

// Returns a one-line teaching explanation for the given hand situation.
export function getTeachingNote(playerCards: Card[], dealerUpcard: Card): string {
  const { total, soft } = evaluateHand(playerCards)
  const dealerRank = dealerUpcard.rank
  const dealerVal = ['T', 'J', 'Q', 'K'].includes(dealerRank) ? 10 : dealerRank === 'A' ? 11 : parseInt(dealerRank)
  const weakDealer = ['4', '5', '6'].includes(dealerRank)
  const pair = isPair(playerCards)

  // Pair situations
  if (pair) {
    const rank = playerCards[0].rank
    if (rank === 'A') return 'Always split aces — two chances at 21'
    if (rank === '8') return '16 is the worst hand, split into two 8s'
    if (rank === '9') {
      if (['7', 'T', 'J', 'Q', 'K', 'A'].includes(dealerRank)) return 'Stand 18 against a strong dealer'
      return 'Split 9s against dealer bust cards — two 19s beat one 18'
    }
    if (rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K') return 'Never split 20 — it wins as is'
    if (rank === '5') return 'Treat 5,5 as hard 10 — double, never split'
    if (rank === '4') {
      if (['5', '6'].includes(dealerRank)) return 'Split 4s only vs 5/6 — DAS creates two strong starts'
      return 'Hard 8 is fine to hit — 4s rarely worth splitting'
    }
  }

  // Soft totals
  if (soft) {
    if (total === 20) return 'Soft 20 is a near-perfect hand — always stand'
    if (total === 19) {
      if (dealerRank === '6') return 'Soft 19 vs 6 — double to maximize vs dealer bust card'
      return 'Soft 19 is strong — stand and collect'
    }
    if (total === 18) {
      if (dealerVal >= 9) return 'Soft 18 loses to dealer 9+ — you must hit'
      if (weakDealer) return 'Soft 18 vs weak dealer — double to press your advantage'
      return 'Soft 18 vs 7/8 — stand, you have the edge'
    }
    if (total === 17) {
      if (weakDealer) return 'Soft 17 vs dealer bust card — double for max EV'
      return 'Soft 17 is a weak hand — always hit for a better total'
    }
    if (total <= 16) {
      if (weakDealer) return 'Soft hand vs dealer bust card — double to press the advantage'
      return 'Soft total below 18 — always safe to hit, ace absorbs the bust'
    }
  }

  // Hard totals
  if (total === 21) return 'Perfect 21 — stand and collect'
  if (total >= 17) return 'Hard 17+ always stands — risk of bust outweighs any gain'
  if (total === 16) {
    if (['9', 'T', 'J', 'Q', 'K', 'A'].includes(dealerRank)) return 'Worst hand vs strong dealer — surrender saves half the bet'
    if (weakDealer) return 'Hard 16 vs dealer bust card — stand and let them bust'
    return 'Hard 16 vs 7/8 — tough spot, hitting is marginally better'
  }
  if (total === 15) {
    if (['T', 'J', 'Q', 'K'].includes(dealerRank)) return 'Hard 15 vs 10 — surrender to save half your bet'
    if (weakDealer) return 'Dealer bust card — stand and let the dealer do the work'
    return 'Hard 15 vs 7/8/9 — hit, standing loses more often'
  }
  if (total >= 13 && total <= 14) {
    if (weakDealer) return 'Dealer bust card (4/5/6) — let them bust, do not risk your hand'
    return 'Stand against dealer bust cards; hit against strong upcards'
  }
  if (total === 12) {
    if (['4', '5', '6'].includes(dealerRank)) return 'Dealer bust card — stand even on 12, they will bust often'
    return 'Hard 12 vs strong dealer — hit, losing on bust risk is worth it'
  }
  if (total === 11) return '11 vs any dealer = maximum double opportunity'
  if (total === 10) {
    if (dealerVal >= 10) return 'Hard 10 vs 10/A — hit, dealer has too much strength to double'
    return 'Hard 10 vs weak dealer — double down for maximum value'
  }
  if (total === 9) {
    if (weakDealer) return 'Hard 9 vs bust card — double to press the advantage'
    return 'Hard 9 vs strong dealer — just hit, not worth doubling'
  }

  return 'Basic strategy: statistically optimal play'
}
