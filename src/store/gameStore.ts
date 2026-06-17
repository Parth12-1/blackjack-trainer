import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card } from '../engine/cards'
import { hiLoValue } from '../engine/cards'
import { buildShoe, shouldReshuffle } from '../engine/shoe'
import { evaluateHand, canDouble, canSplit, canSurrender } from '../engine/hand'
import { dealerPlay, dealerHasBlackjack } from '../engine/dealer'
import { settleHand } from '../engine/settle'
import { gradeBasicStrategyDecision, type PlayerDecision } from '../engine/strategyFeedback'
import type { Phase, Hand } from '../types/game'

export interface Stats {
  handsPlayed: number
  wins: number
  losses: number
  pushes: number
  netDollars: number
  biggestWin: number
  currentStreak: number
}

export interface Settings {
  h17: boolean
  surrender: boolean
  numDecks: number
}

export interface DecisionFeedback {
  id: number
  handIndex: number
  situation: string
  playerCards: Card[]
  dealerUpcard: Card
  chosenAction: PlayerDecision
  chosenLabel: string
  recommendedAction: PlayerDecision
  recommendedLabel: string
  correct: boolean
}

const DEFAULT_STATS: Stats = {
  handsPlayed: 0, wins: 0, losses: 0, pushes: 0,
  netDollars: 0, biggestWin: 0, currentStreak: 0,
}
const DEFAULT_SETTINGS: Settings = { h17: false, surrender: true, numDecks: 6 }

function countCards(rc: number, cards: Card[]): number {
  return cards.reduce((acc, c) => !c.faceDown ? acc + hiLoValue(c.rank) : acc, rc)
}

function popDraw(shoe: Card[], faceDown = false): [Card, Card[]] {
  const card = { ...shoe[shoe.length - 1], faceDown }
  return [card, shoe.slice(0, -1)]
}

function updateStats(stats: Stats, net: number, hands: Hand[]): Stats {
  const wins = hands.filter(h => h.result === 'win' || h.result === 'blackjack').length
  const losses = hands.filter(h => h.result === 'lose' || h.result === 'bust').length
  const pushes = hands.filter(h => h.result === 'push').length
  const streak = net > 0
    ? (stats.currentStreak >= 0 ? stats.currentStreak + 1 : 1)
    : net < 0
    ? (stats.currentStreak <= 0 ? stats.currentStreak - 1 : -1)
    : 0
  return {
    handsPlayed: stats.handsPlayed + 1,
    wins: stats.wins + wins,
    losses: stats.losses + losses,
    pushes: stats.pushes + pushes,
    netDollars: stats.netDollars + net,
    biggestWin: Math.max(stats.biggestWin, net),
    currentStreak: streak,
  }
}

export interface GameState {
  phase: Phase
  shoe: Card[]
  cardsDealt: number
  runningCount: number
  dealer: Card[]
  hands: Hand[]
  activeHandIndex: number
  bankroll: number
  currentBet: number
  splitCount: number
  settings: Settings
  stats: Stats
  advisorOn: boolean
  countHelperOn: boolean
  expectedPayoutOn: boolean
  decisionFeedback: DecisionFeedback[]
  latestDecisionFeedback: DecisionFeedback | null
  isDealing: boolean
  pendingInitialSettle: boolean
  dealId: number

  placeBet(amount: number): void
  clearBet(): void
  deal(): void
  hit(): void
  stand(): void
  double(): void
  split(): void
  surrender(): void
  newRound(): void
  resetBankroll(): void
  toggleAdvisor(): void
  toggleCountHelper(): void
  toggleExpectedPayout(): void
  updateSettings(s: Partial<Settings>): void
  dismissDecisionFeedback(): void
  finishInitialDeal(): void
}

let nextDecisionFeedbackId = 1

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      function doSettle() {
        const st = get()
        const { hands, dealer, settings, runningCount, stats } = st

        // Reveal dealer hole card
        const revealed: Card[] = dealer.map(c => ({ ...c, faceDown: false }))
        const rc = countCards(runningCount, dealer.filter(c => c.faceDown))

        const dealerBJ = dealerHasBlackjack(revealed)
        const anyPlayerAlive = hands.some(h => !h.surrendered && !evaluateHand(h.cards).bust)

        let finalDealer: Card[] = revealed
        let finalRc = rc
        if (anyPlayerAlive && !dealerBJ) {
          const shoeCopy = [...st.shoe]
          finalDealer = dealerPlay(revealed, shoeCopy, settings.h17)
          finalRc = countCards(rc, finalDealer.slice(revealed.length))
        }

        const dv = evaluateHand(finalDealer)
        // Bet is pre-deducted at deal(). totalReturn = what we ADD BACK to bankroll.
        // statsNet = true profit/loss (for stats display).
        let totalReturn = 0
        let statsNet = 0

        const settled = hands.map(h => {
          if (h.surrendered) {
            const halfBack = Math.ceil(h.bet / 2)
            totalReturn += halfBack
            statsNet -= h.bet - halfBack
            return { ...h, settled: true, result: 'surrender' as const }
          }
          const pv = evaluateHand(h.cards)
          const playerBJ = pv.blackjack && st.splitCount === 0
          const res = settleHand({ playerValue: pv, dealerValue: dv, bet: h.bet, isBlackjack: playerBJ, isSurrender: false, dealerBlackjack: dealerBJ })
          if (res.result === 'blackjack') {
            totalReturn += h.bet + Math.floor(h.bet * 1.5)
            statsNet += Math.floor(h.bet * 1.5)
          } else if (res.result === 'win') {
            totalReturn += h.bet * 2
            statsNet += h.bet
          } else if (res.result === 'push') {
            totalReturn += h.bet
            // statsNet += 0
          } else {
            // loss or bust: bet already gone, nothing returned
            statsNet -= h.bet
          }
          return { ...h, settled: true, result: res.result }
        })

        set({
          phase: 'settle',
          dealer: finalDealer,
          hands: settled,
          runningCount: finalRc,
          bankroll: st.bankroll + totalReturn,
          stats: updateStats(stats, statsNet, settled),
        })
      }

      function doAdvance() {
        const st = get()
        const next = st.activeHandIndex + 1
        if (next < st.hands.length) {
          set({ activeHandIndex: next })
        } else {
          doSettle()
        }
      }

      function recordDecision(chosenAction: PlayerDecision) {
        const st = get()
        if (st.phase !== 'player') return

        const hand = st.hands[st.activeHandIndex]
        const dealerUpcard = st.dealer.find(c => !c.faceDown)
        if (!hand || !dealerUpcard) return

        const grade = gradeBasicStrategyDecision({
          playerCards: hand.cards,
          dealerUpcard,
          splitCount: st.splitCount,
          surrenderAllowed: st.settings.surrender,
          chosenAction,
        })
        const feedback: DecisionFeedback = {
          id: nextDecisionFeedbackId++,
          handIndex: st.activeHandIndex,
          situation: grade.situation,
          playerCards: hand.cards.map(c => ({ ...c })),
          dealerUpcard: { ...dealerUpcard },
          chosenAction,
          chosenLabel: grade.chosenLabel,
          recommendedAction: grade.action,
          recommendedLabel: grade.label,
          correct: grade.correct,
        }

        set(state => ({
          decisionFeedback: [...state.decisionFeedback, feedback],
          latestDecisionFeedback: feedback,
        }))
      }

      return {
        phase: 'idle',
        shoe: [],
        cardsDealt: 0,
        runningCount: 0,
        dealer: [],
        hands: [],
        activeHandIndex: 0,
        bankroll: 1000,
        currentBet: 0,
        splitCount: 0,
        settings: DEFAULT_SETTINGS,
        stats: DEFAULT_STATS,
        advisorOn: false,
        countHelperOn: false,
        expectedPayoutOn: false,
        decisionFeedback: [],
        latestDecisionFeedback: null,
        isDealing: false,
        pendingInitialSettle: false,
        dealId: 0,

        placeBet: (amount) => {
          const { bankroll, currentBet, phase } = get()
          if (phase !== 'betting' && phase !== 'idle') return
          set({ currentBet: Math.min(currentBet + amount, 500, bankroll), phase: 'betting' })
        },

        clearBet: () => set({ currentBet: 0, phase: 'idle' }),

        deal: () => {
          const st = get()
          if (st.currentBet < 5 || st.currentBet > st.bankroll) return

          let shoe = st.shoe
          let cardsDealt = st.cardsDealt
          let runningCount = st.runningCount

          if (shoe.length < 10 || shouldReshuffle(cardsDealt, st.settings.numDecks * 52)) {
            shoe = buildShoe(st.settings.numDecks)
            cardsDealt = 0
            runningCount = 0
          }

          let p1: Card, p2: Card, d1: Card, d2: Card
          ;[p1, shoe] = popDraw(shoe)
          ;[d1, shoe] = popDraw(shoe)
          ;[p2, shoe] = popDraw(shoe)
          ;[d2, shoe] = popDraw(shoe, true)  // face down

          const rc = countCards(runningCount, [p1, d1, p2])
          const playerCards = [p1, p2]
          const dealerCards = [d1, d2]
          const pv = evaluateHand(playerCards)
          const dealerBJ = dealerHasBlackjack([d1, { ...d2, faceDown: false }])

          set({
            shoe, cardsDealt: cardsDealt + 4, runningCount: rc,
            dealer: dealerCards,
            hands: [{ cards: playerCards, bet: st.currentBet }],
            activeHandIndex: 0, splitCount: 0,
            bankroll: st.bankroll - st.currentBet,
            phase: 'player',
            decisionFeedback: [],
            latestDecisionFeedback: null,
            isDealing: true,
            pendingInitialSettle: pv.blackjack || dealerBJ,
            dealId: st.dealId + 1,
          })
        },

        hit: () => {
          const st = get()
          if (st.isDealing || st.shoe.length === 0) return
          recordDecision('hit')
          const [card, shoe] = popDraw(st.shoe)
          const hands = st.hands.map((h, i) => i === st.activeHandIndex
            ? { ...h, cards: [...h.cards, card] } : h)
          const rc = countCards(st.runningCount, [card])
          const hv = evaluateHand(hands[st.activeHandIndex].cards)
          set({ shoe, hands, runningCount: rc, cardsDealt: st.cardsDealt + 1 })
          if (hv.bust || hv.total === 21) doAdvance()
        },

        stand: () => {
          if (get().isDealing) return
          recordDecision('stand')
          doAdvance()
        },

        double: () => {
          const st = get()
          if (st.isDealing) return
          const hand = st.hands[st.activeHandIndex]
          if (!canDouble(hand.cards) || st.bankroll < hand.bet) return
          recordDecision('double')
          const [card, shoe] = popDraw(st.shoe)
          const rc = countCards(st.runningCount, [card])
          const hands = st.hands.map((h, i) => i === st.activeHandIndex
            ? { ...h, cards: [...h.cards, card], doubled: true, bet: h.bet * 2 } : h)
          set({ shoe, hands, runningCount: rc, bankroll: st.bankroll - hand.bet, cardsDealt: st.cardsDealt + 1 })
          doAdvance()
        },

        split: () => {
          const st = get()
          if (st.isDealing) return
          const hand = st.hands[st.activeHandIndex]
          if (!canSplit(hand.cards, st.splitCount) || st.bankroll < hand.bet) return
          recordDecision('split')
          const [c1, c2] = hand.cards
          let shoe = st.shoe
          let nc1: Card, nc2: Card
          ;[nc1, shoe] = popDraw(shoe)
          ;[nc2, shoe] = popDraw(shoe)
          const rc = countCards(st.runningCount, [nc1, nc2])
          const h1: Hand = { cards: [c1, nc1], bet: hand.bet }
          const h2: Hand = { cards: [c2, nc2], bet: hand.bet }
          const hands = [...st.hands.slice(0, st.activeHandIndex), h1, h2, ...st.hands.slice(st.activeHandIndex + 1)]
          set({ shoe, hands, runningCount: rc, bankroll: st.bankroll - hand.bet, splitCount: st.splitCount + 1, cardsDealt: st.cardsDealt + 2 })
          if (c1.rank === 'A') doAdvance()  // split aces: one card each, auto-advance
        },

        surrender: () => {
          const st = get()
          if (st.isDealing) return
          const hand = st.hands[st.activeHandIndex]
          if (!canSurrender(hand.cards, st.splitCount) || !st.settings.surrender) return
          recordDecision('surrender')
          const hands = st.hands.map((h, i) => i === st.activeHandIndex
            ? { ...h, surrendered: true, result: 'surrender' as const } : h)
          set({ hands })
          doSettle()
        },

        newRound: () => set({ phase: 'idle', dealer: [], hands: [], activeHandIndex: 0, currentBet: 0, splitCount: 0, decisionFeedback: [], latestDecisionFeedback: null, isDealing: false, pendingInitialSettle: false }),
        resetBankroll: () => set({ bankroll: 1000, stats: DEFAULT_STATS }),
        toggleAdvisor: () => set(s => ({ advisorOn: !s.advisorOn })),
        toggleCountHelper: () => set(s => ({ countHelperOn: !s.countHelperOn })),
        toggleExpectedPayout: () => set(s => ({ expectedPayoutOn: !s.expectedPayoutOn })),
        updateSettings: (s) => set(state => ({ settings: { ...state.settings, ...s } })),
        dismissDecisionFeedback: () => set({ latestDecisionFeedback: null }),
        finishInitialDeal: () => {
          const st = get()
          if (!st.isDealing) return
          set({ isDealing: false, pendingInitialSettle: false })
          if (st.pendingInitialSettle) doSettle()
        },
      }
    },
    {
      name: 'bj-trainer-v1',
      partialize: (s) => ({ bankroll: s.bankroll, settings: s.settings, stats: s.stats }),
    }
  )
)
