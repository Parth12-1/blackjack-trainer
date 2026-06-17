import { useState } from 'react'
import type { Card, Rank } from '../../engine/cards'
import { basicStrategy, resolveAction } from '../../engine/strategy'
import { checkDeviation } from '../../engine/deviations'
import { runMonteCarlo, allActionEVs } from '../../engine/montecarlo'
import { canDouble, canSplit, canSurrender } from '../../engine/hand'
import { calcDecksRemaining, calcBetUnits } from '../counting/countingUtils'
import { buildSyntheticShoe, deriveTrueCount } from './calculatorUtils'

const DISPLAY_RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T']

interface CalcResult {
  strategyCall: string
  deviationDesc: string | null
  trueCount: number
  decksRemaining: number
  betUnits: number
  win: number
  push: number
  lose: number
  evPerUnit: number
  actionEVs: Array<{ action: string; ev: number; win: number; push: number; lose: number }>
}

const ACTION_LABELS: Record<string, string> = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double',
  P: 'Split',
  R: 'Surrender',
}

const ACTION_EV_LABELS: Record<string, string> = {
  stand: 'Stand',
  hit: 'Hit',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}

function fmt(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(3)
}

export function CalculatorTab() {
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [dealerUpcard, setDealerUpcard] = useState<Card | null>(null)
  const [isSplit, setIsSplit] = useState(false)
  const [runningCount, setRunningCount] = useState(0)
  const [cardsSeen, setCardsSeen] = useState(0)
  const [numDecks, setNumDecks] = useState(6)
  const [result, setResult] = useState<CalcResult | null>(null)
  const [loading, setLoading] = useState(false)

  function addPlayerCard(rank: Rank) {
    setPlayerCards(prev => [...prev, { rank, suit: '♠', faceDown: false }])
  }

  function removePlayerCard(idx: number) {
    setPlayerCards(prev => prev.filter((_, i) => i !== idx))
  }

  function setDealer(rank: Rank) {
    setDealerUpcard(prev =>
      prev && prev.rank === rank ? null : { rank, suit: '♠', faceDown: false },
    )
  }

  function calculate() {
    if (playerCards.length < 2 || !dealerUpcard) return
    setLoading(true)
    try {
      const allCards = [...playerCards, dealerUpcard]
      const syntheticShoe = buildSyntheticShoe(numDecks, allCards)
      const tc = deriveTrueCount(runningCount, cardsSeen, numDecks)
      const decksRem = calcDecksRemaining(cardsSeen, numDecks)
      const betUnits = calcBetUnits(tc)

      // Strategy call
      const splitCount = isSplit ? 1 : 0
      const rawAction = basicStrategy(playerCards, dealerUpcard, splitCount, {
        das: true,
        surrender: true,
      })
      const canDbl = canDouble(playerCards)
      const canSpl = canSplit(playerCards, splitCount)
      const canSurr = canSurrender(playerCards, splitCount)
      const resolved = resolveAction(rawAction, canDbl, canSpl, canSurr)
      const strategyCall = ACTION_LABELS[resolved] ?? resolved

      // Deviation
      const dev = checkDeviation(playerCards, dealerUpcard, tc, false)

      // Legal actions for MC
      const legalActions: string[] = ['stand', 'hit']
      if (canDbl) legalActions.push('double')
      if (canSpl) legalActions.push('split')
      if (canSurr) legalActions.push('surrender')

      // MC (synchronous, 1500 sims)
      const mc = runMonteCarlo(playerCards, dealerUpcard, syntheticShoe, 1500, false)
      const actionEVs = allActionEVs(
        playerCards,
        dealerUpcard,
        syntheticShoe,
        legalActions,
        1000,
        false,
      )

      setResult({
        strategyCall,
        deviationDesc: dev ? dev.description : null,
        trueCount: tc,
        decksRemaining: decksRem,
        betUnits,
        win: mc.win,
        push: mc.push,
        lose: mc.lose,
        evPerUnit: mc.ev,
        actionEVs: actionEVs.map(a => ({
          action: a.action,
          ev: a.ev,
          win: a.win,
          push: a.push,
          lose: a.lose,
        })),
      })
    } finally {
      setLoading(false)
    }
  }

  const canCalculate = playerCards.length >= 2 && dealerUpcard !== null

  return (
    <div className="min-h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Calculator</h2>
          <p className="text-white/50 text-sm mt-1">Enter a real-table situation for strategic analysis</p>
        </div>

        {/* Player Hand */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Your Hand</h3>

          {/* Rank picker */}
          <div className="flex flex-wrap gap-1">
            {DISPLAY_RANKS.map(rank => (
              <button
                key={rank}
                onClick={() => addPlayerCard(rank)}
                className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                {rank}
              </button>
            ))}
          </div>

          {/* Current hand */}
          <div className="flex flex-wrap items-center gap-2 min-h-[2rem]">
            {playerCards.length === 0 ? (
              <span className="text-white/30 text-xs">No cards — click ranks above</span>
            ) : (
              playerCards.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => removePlayerCard(idx)}
                  className="px-2 py-1 rounded bg-white/20 text-white text-xs font-bold hover:bg-red-500/50 transition-colors"
                  title="Click to remove"
                >
                  {card.rank}♠
                </button>
              ))
            )}
            {playerCards.length > 0 && (
              <button
                onClick={() => setPlayerCards([])}
                className="px-2 py-1 rounded bg-white/5 text-white/40 text-xs hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Split pair toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSplit}
              onChange={e => setIsSplit(e.target.checked)}
              className="rounded"
            />
            <span className="text-white/70 text-xs">Split pair (already split once)</span>
          </label>
        </div>

        {/* Dealer Upcard */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Dealer Upcard</h3>

          <div className="flex flex-wrap gap-1">
            {DISPLAY_RANKS.map(rank => (
              <button
                key={rank}
                onClick={() => setDealer(rank)}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  dealerUpcard?.rank === rank
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {rank}
              </button>
            ))}
          </div>

          <div className="text-white/50 text-xs">
            {dealerUpcard ? (
              <span className="text-yellow-400 font-bold">Selected: {dealerUpcard.rank}♠</span>
            ) : (
              <span>None selected</span>
            )}
          </div>
        </div>

        {/* Count Inputs */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Count</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Running Count */}
            <div className="space-y-1">
              <label className="text-white/60 text-xs">Running Count</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRunningCount(v => v - 1)}
                  className="w-6 h-6 rounded bg-white/10 text-white text-sm font-bold hover:bg-white/20 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center text-white font-bold text-sm">
                  {runningCount >= 0 ? '+' : ''}{runningCount}
                </span>
                <button
                  onClick={() => setRunningCount(v => v + 1)}
                  className="w-6 h-6 rounded bg-white/10 text-white text-sm font-bold hover:bg-white/20 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Cards Seen */}
            <div className="space-y-1">
              <label className="text-white/60 text-xs">Cards Seen</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCardsSeen(v => Math.max(0, v - 1))}
                  className="w-6 h-6 rounded bg-white/10 text-white text-sm font-bold hover:bg-white/20 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center text-white font-bold text-sm">{cardsSeen}</span>
                <button
                  onClick={() => setCardsSeen(v => v + 1)}
                  className="w-6 h-6 rounded bg-white/10 text-white text-sm font-bold hover:bg-white/20 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Decks */}
          <div className="space-y-1">
            <label className="text-white/60 text-xs">Number of Decks</label>
            <div className="flex gap-1">
              {[1, 2, 4, 6, 8].map(d => (
                <button
                  key={d}
                  onClick={() => setNumDecks(d)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                    numDecks === d
                      ? 'bg-yellow-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculate}
          disabled={!canCalculate || loading}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            canCalculate && !loading
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        {/* Results */}
        {result && (
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide border-b border-white/10 pb-2">
              Results
            </h3>

            {/* Strategy */}
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Basic Strategy</span>
              <span className="text-green-400 font-bold text-lg">{result.strategyCall}</span>
            </div>

            {/* Deviation */}
            {result.deviationDesc && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide shrink-0">
                  Deviation
                </span>
                <span className="text-yellow-300 text-xs">{result.deviationDesc}</span>
              </div>
            )}

            {/* Count info */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-white font-bold text-sm">
                  TC {result.trueCount >= 0 ? '+' : ''}{result.trueCount}
                </div>
                <div className="text-white/40 text-xs">True Count</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-white font-bold text-sm">{result.decksRemaining.toFixed(1)}</div>
                <div className="text-white/40 text-xs">Decks Left</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-white font-bold text-sm">{result.betUnits}u</div>
                <div className="text-white/40 text-xs">Bet Units</div>
              </div>
            </div>

            {/* Win/Push/Lose odds */}
            <div className="space-y-2">
              <span className="text-white/60 text-xs uppercase tracking-wide">Odds (Basic Strategy)</span>
              <div className="flex gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-400 font-semibold">Win {pct(result.win)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-300">Push {pct(result.push)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-400 font-semibold">Lose {pct(result.lose)}</span>
                </div>
              </div>
              {/* Progress bars */}
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: pct(result.win) }}
                />
                <div
                  className="bg-gray-500 transition-all"
                  style={{ width: pct(result.push) }}
                />
                <div
                  className="bg-red-500 transition-all"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* EV per unit */}
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">EV / unit</span>
              <span
                className={`font-bold text-sm ${
                  result.evPerUnit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {fmt(result.evPerUnit)}
              </span>
            </div>

            {/* Per-action EVs */}
            {result.actionEVs.length > 0 && (
              <div className="space-y-2">
                <span className="text-white/60 text-xs uppercase tracking-wide">Action EVs</span>
                <div className="space-y-1">
                  {result.actionEVs.map((a, idx) => (
                    <div
                      key={a.action}
                      className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${
                        idx === 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'
                      }`}
                    >
                      <span
                        className={`font-semibold ${idx === 0 ? 'text-green-400' : 'text-white/70'}`}
                      >
                        {ACTION_EV_LABELS[a.action] ?? a.action}
                        {idx === 0 && (
                          <span className="ml-1 text-green-500/60 text-xs font-normal">best</span>
                        )}
                      </span>
                      <div className="flex gap-3 text-right">
                        <span className="text-green-400/70">{pct(a.win)} W</span>
                        <span className="text-gray-400/70">{pct(a.push)} P</span>
                        <span className="text-red-400/70">{pct(a.lose)} L</span>
                        <span
                          className={`font-bold w-12 ${
                            a.ev >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {fmt(a.ev)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
