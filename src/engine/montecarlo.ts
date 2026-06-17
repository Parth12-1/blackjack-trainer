import type { Card } from './cards'
import { evaluateHand } from './hand'
import { settleHand } from './settle'
import { basicStrategy, resolveAction } from './strategy'

export interface MonteCarloResult {
  win: number
  push: number
  lose: number
  ev: number
}

export interface ActionEV {
  action: 'stand' | 'hit' | 'double' | 'split' | 'surrender'
  ev: number
  win: number
  push: number
  lose: number
}

function cloneShoe(shoe: Card[]): Card[] {
  return shoe.map(c => ({ ...c }))
}

function drawFrom(shoe: Card[]): Card {
  const idx = Math.floor(Math.random() * shoe.length)
  const card = shoe[idx]
  shoe.splice(idx, 1)
  return { ...card, faceDown: false }
}

function simulateDealerPlay(hand: Card[], shoe: Card[], h17: boolean): Card[] {
  const result: Card[] = hand.map(card => ({ ...card, faceDown: false }))

  while (true) {
    const { total, soft, bust } = evaluateHand(result)
    if (bust) break
    if (total > 17) break
    if (total === 17) {
      if (!soft) break
      if (!h17) break
    }
    if (shoe.length === 0) break
    result.push(drawFrom(shoe))
  }

  return result
}

function simulatePlayerStand(
  playerCards: Card[],
  dealerFaceUp: Card,
  shoe: Card[],
  h17: boolean,
): 'win' | 'push' | 'lose' {
  const dealerFull = [dealerFaceUp, drawFrom(shoe)]
  const finalDealer = simulateDealerPlay(dealerFull, shoe, h17)
  const pv = evaluateHand(playerCards)
  const dv = evaluateHand(finalDealer)
  const result = settleHand({
    playerValue: pv,
    dealerValue: dv,
    bet: 1,
    isBlackjack: false,
    isSurrender: false,
    dealerBlackjack: dv.blackjack,
  })
  if (result.result === 'win') return 'win'
  if (result.result === 'push') return 'push'
  return 'lose'
}

function simulatePlayerBasicStrategy(
  playerCards: Card[],
  dealerUpcard: Card,
  shoe: Card[],
  h17: boolean,
  maxHits = 10,
): 'win' | 'push' | 'lose' | 'bust' {
  const hand = [...playerCards]
  let hits = 0

  while (hits < maxHits) {
    const hv = evaluateHand(hand)
    if (hv.bust) break
    const action = basicStrategy(hand, dealerUpcard, 0, { das: true, surrender: false })
    const resolved = resolveAction(action, hand.length === 2, false, false)
    if (resolved === 'S') break
    if (resolved === 'D' && hand.length === 2) {
      hand.push(drawFrom(shoe))
      break
    }
    // Hit
    hand.push(drawFrom(shoe))
    hits++
  }

  const pv = evaluateHand(hand)
  if (pv.bust) return 'bust'

  // Dealer plays
  const dealerFull = [{ ...dealerUpcard, faceDown: false }, drawFrom(shoe)]
  const finalDealer = simulateDealerPlay(dealerFull, shoe, h17)
  const dv = evaluateHand(finalDealer)
  const result = settleHand({
    playerValue: pv,
    dealerValue: dv,
    bet: 1,
    isBlackjack: false,
    isSurrender: false,
    dealerBlackjack: dv.blackjack,
  })
  if (result.result === 'win') return 'win'
  if (result.result === 'push') return 'push'
  return 'lose'
}

export function runMonteCarlo(
  playerCards: Card[],
  dealerUpcard: Card,
  remainingShoe: Card[],
  numSimulations = 3000,
  h17 = false,
): MonteCarloResult {
  let wins = 0, pushes = 0, loses = 0

  for (let i = 0; i < numSimulations; i++) {
    const shoe = cloneShoe(remainingShoe)
    const outcome = simulatePlayerBasicStrategy(playerCards, dealerUpcard, shoe, h17)
    if (outcome === 'win') wins++
    else if (outcome === 'push') pushes++
    else loses++
  }

  const n = numSimulations
  const winRate = wins / n
  const pushRate = pushes / n
  const loseRate = loses / n
  return {
    win: winRate,
    push: pushRate,
    lose: loseRate,
    ev: winRate - loseRate,
  }
}

export function allActionEVs(
  playerCards: Card[],
  dealerUpcard: Card,
  remainingShoe: Card[],
  legalActions: string[],
  numSimulations = 2000,
  h17 = false,
): ActionEV[] {
  const results: ActionEV[] = []

  for (const action of legalActions) {
    let wins = 0, pushes = 0, loses = 0

    for (let i = 0; i < numSimulations; i++) {
      const shoe = cloneShoe(remainingShoe)
      let outcome: 'win' | 'push' | 'lose' | 'bust'

      if (action === 'surrender') {
        // EV = -0.5 always
        outcome = 'lose'
        loses += 0.5
        wins += 0
        pushes += 0
        continue
      }

      if (action === 'stand') {
        const o = simulatePlayerStand(playerCards, dealerUpcard, shoe, h17)
        outcome = o
      } else if (action === 'hit') {
        const hand = [...playerCards, drawFrom(shoe)]
        outcome = simulatePlayerBasicStrategy(hand, dealerUpcard, shoe, h17)
      } else if (action === 'double') {
        const hand = [...playerCards, drawFrom(shoe)]
        const pv = evaluateHand(hand)
        if (pv.bust) { outcome = 'bust' }
        else {
          const dealerFull = [{ ...dealerUpcard, faceDown: false }, drawFrom(shoe)]
          const finalDealer = simulateDealerPlay(dealerFull, shoe, h17)
          const dv = evaluateHand(finalDealer)
          const res = settleHand({ playerValue: pv, dealerValue: dv, bet: 2, isBlackjack: false, isSurrender: false, dealerBlackjack: dv.blackjack })
          outcome = res.result === 'win' ? 'win' : res.result === 'push' ? 'push' : 'lose'
        }
      } else if (action === 'split') {
        // Simplified: play each card + new card as separate hand, average result
        const card1 = { ...playerCards[0] }
        const hand1 = [card1, drawFrom(shoe)]
        const o1 = simulatePlayerBasicStrategy(hand1, dealerUpcard, shoe, h17)
        outcome = o1
      } else {
        outcome = simulatePlayerBasicStrategy(playerCards, dealerUpcard, shoe, h17)
      }

      if (outcome === 'win') wins++
      else if (outcome === 'push') pushes++
      else loses++
    }

    const n = numSimulations
    const winRate = wins / n
    const pushRate = pushes / n
    const loseRate = loses / n

    results.push({
      action: action as ActionEV['action'],
      ev: action === 'surrender' ? -0.5 : winRate - loseRate,
      win: winRate,
      push: pushRate,
      lose: loseRate,
    })
  }

  return results.sort((a, b) => b.ev - a.ev)
}
