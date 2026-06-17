import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { basicStrategy, resolveAction } from '../../engine/strategy'
import { checkDeviation } from '../../engine/deviations'
import { canDouble, canSplit, canSurrender } from '../../engine/hand'
import type { MonteCarloResult, ActionEV } from '../../engine/montecarlo'
import { getTeachingNote } from './notes'
import { selectActivePlayerCards } from './selectors'

// Resolved action labels and colors
const ACTION_LABEL: Record<string, string> = {
  H: 'HIT',
  S: 'STAND',
  D: 'DOUBLE',
  P: 'SPLIT',
  R: 'SURRENDER',
}

const ACTION_COLOR: Record<string, string> = {
  H: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
  S: 'text-green-400 bg-green-500/20 border-green-500/40',
  D: 'text-green-300 bg-green-500/20 border-green-500/40',
  P: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
  R: 'text-red-400 bg-red-500/20 border-red-500/40',
}

interface WorkerResult {
  result: MonteCarloResult
  evs: ActionEV[]
  requestId: number
}

function formatEV(ev: number): string {
  const sign = ev >= 0 ? '+' : ''
  return `${sign}${ev.toFixed(2)}`
}

function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function ActionBadge({ action }: { action: string }) {
  const colors = ACTION_COLOR[action] ?? 'text-white bg-white/10 border-white/20'
  return (
    <span className={`text-3xl font-black tracking-wider px-4 py-2 rounded-xl border-2 ${colors}`}>
      {ACTION_LABEL[action] ?? action}
    </span>
  )
}

function ProbBar({ win, push }: { win: number; push: number; lose: number }) {
  const winPct = Math.round(win * 100)
  const pushPct = Math.round(push * 100)
  const losePct = 100 - winPct - pushPct

  return (
    <div className="space-y-1.5">
      <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
        <div
          className="bg-green-500 h-full transition-all duration-700"
          style={{ width: `${winPct}%` }}
        />
        <div
          className="bg-white/30 h-full transition-all duration-700"
          style={{ width: `${pushPct}%` }}
        />
        <div
          className="bg-red-500 h-full transition-all duration-700"
          style={{ width: `${losePct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-green-400 font-medium">Win {winPct}%</span>
        <span className="text-white/50">Push {pushPct}%</span>
        <span className="text-red-400 font-medium">Lose {losePct}%</span>
      </div>
    </div>
  )
}

function EVTable({ evs, bestAction }: { evs: ActionEV[]; bestAction: string }) {
  const actionToKey: Record<ActionEV['action'], string> = {
    stand: 'S',
    hit: 'H',
    double: 'D',
    split: 'P',
    surrender: 'R',
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-white/40 uppercase text-[10px] tracking-wider">
          <th className="text-left pb-1 font-medium">Action</th>
          <th className="text-right pb-1 font-medium">EV</th>
          <th className="text-right pb-1 font-medium">Win%</th>
        </tr>
      </thead>
      <tbody>
        {evs.map((row) => {
          const key = actionToKey[row.action]
          const isBest = key === bestAction
          return (
            <tr
              key={row.action}
              className={`${isBest ? 'bg-yellow-400/10 text-yellow-300' : 'text-white/70'}`}
            >
              <td className="py-0.5 pl-1 rounded-l capitalize font-medium">
                {isBest && <span className="mr-1 text-yellow-400">*</span>}
                {ACTION_LABEL[key] ?? row.action}
              </td>
              <td className={`text-right ${row.ev >= 0 ? 'text-green-400' : 'text-red-400'} font-mono`}>
                {formatEV(row.ev)}
              </td>
              <td className="text-right pr-1 rounded-r text-white/50 font-mono">
                {formatPct(row.win)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function AdvisorPanel() {
  const playerCards = useGameStore(selectActivePlayerCards)
  const dealerCards = useGameStore(s => s.dealer)
  const remainingShoe = useGameStore(s => s.shoe)
  const phase = useGameStore(s => s.phase)
  const splitCount = useGameStore(s => s.splitCount)
  const settings = useGameStore(s => s.settings)
  const runningCount = useGameStore(s => s.runningCount)
  const cardsDealt = useGameStore(s => s.cardsDealt)
  const countHelperOn = useGameStore(s => s.countHelperOn)
  const activeHandIndex = useGameStore(s => s.activeHandIndex)

  const dealerUpcard = dealerCards.find(c => !c.faceDown)

  const trueCount = runningCount / Math.max((settings.numDecks * 52 - cardsDealt) / 52, 0.5)

  // Worker setup
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)

  const [simResult, setSimResult] = useState<MonteCarloResult | null>(null)
  const [evs, setEvs] = useState<ActionEV[]>([])
  const [simulating, setSimulating] = useState(false)

  // Quiz-me state
  const [quizMode, setQuizMode] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizRevealed, setQuizRevealed] = useState(false)

  // Mount/unmount worker once
  useEffect(() => {
    const w = new Worker(
      new URL('../../workers/montecarlo.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = w

    w.onmessage = (e: MessageEvent<WorkerResult>) => {
      const { result, evs: newEvs, requestId } = e.data
      // Guard stale responses
      if (requestId !== requestIdRef.current) return
      setSimResult(result)
      setEvs(newEvs)
      setSimulating(false)
    }

    return () => {
      w.terminate()
      workerRef.current = null
    }
  }, [])

  // Derive legal actions
  const legalActions: string[] = []
  if (playerCards.length >= 2 && dealerUpcard) {
    legalActions.push('hit', 'stand')
    if (canDouble(playerCards)) legalActions.push('double')
    if (canSplit(playerCards, splitCount)) legalActions.push('split')
    if (settings.surrender && canSurrender(playerCards, splitCount)) legalActions.push('surrender')
  }

  // Build a stable signature to key the worker effect
  const playerSig = playerCards.map(c => c.rank).join(',')
  const dealerSig = dealerUpcard?.rank ?? ''
  const shoeLenSig = remainingShoe.length

  // Run simulation when relevant state changes
  useEffect(() => {
    if (phase !== 'player' || !dealerUpcard || playerCards.length < 2) return
    if (!workerRef.current) return

    const id = ++requestIdRef.current
    setSimulating(true)
    setSimResult(null)
    setEvs([])

    workerRef.current.postMessage({
      playerCards,
      dealerUpcard,
      remainingShoe,
      legalActions,
      numSimulations: 3000,
      h17: settings.h17,
      requestId: id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerSig, dealerSig, shoeLenSig, activeHandIndex, settings.h17])

  // Reset quiz when hand changes
  useEffect(() => {
    setQuizAnswer(null)
    setQuizRevealed(false)
  }, [playerSig, dealerSig, activeHandIndex])

  if (phase !== 'player' || !dealerUpcard || playerCards.length < 2) {
    return (
      <div className="bg-black/50 border border-yellow-400/40 rounded-xl p-4 text-center">
        <p className="text-yellow-400/60 text-xs font-medium tracking-wide uppercase">Strategy Advisor</p>
        <p className="text-white/30 text-xs mt-1">Waiting for player turn...</p>
      </div>
    )
  }

  // Compute recommended action
  const rawAction = basicStrategy(playerCards, dealerUpcard, splitCount, { das: true, surrender: settings.surrender })
  const canDoubleNow = canDouble(playerCards)
  const canSplitNow = canSplit(playerCards, splitCount)
  const canSurrenderNow = settings.surrender && canSurrender(playerCards, splitCount)
  const resolvedAction = resolveAction(rawAction, canDoubleNow, canSplitNow, canSurrenderNow)

  // Check for count deviation and resolve it through legality the same way basic strategy is
  const rawDeviation = countHelperOn
    ? checkDeviation(playerCards, dealerUpcard, trueCount, false)
    : null

  const devResolved = rawDeviation
    ? resolveAction(rawDeviation.action, canDoubleNow, canSplitNow, canSurrenderNow)
    : null

  // Only treat it as a real deviation when it actually changes the final play
  const isRealDeviation = devResolved !== null && devResolved !== resolvedAction
  const displayAction = isRealDeviation ? devResolved : resolvedAction
  const deviation = isRealDeviation ? rawDeviation : null

  const teachingNote = getTeachingNote(playerCards, dealerUpcard)

  // Quiz grading
  const QUIZ_ACTIONS = [
    { key: 'H', label: 'HIT' },
    { key: 'S', label: 'STAND' },
    { key: 'D', label: 'DOUBLE' },
    { key: 'P', label: 'SPLIT' },
    { key: 'R', label: 'SURRENDER' },
  ].filter(a => {
    if (a.key === 'D') return canDoubleNow
    if (a.key === 'P') return canSplitNow
    if (a.key === 'R') return canSurrenderNow
    return true
  })

  const isQuizCorrect = quizAnswer === displayAction

  return (
    <div className="bg-black/50 border border-yellow-400/40 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-yellow-400 font-bold text-sm tracking-wide uppercase">Strategy Advisor</p>
        <button
          onClick={() => {
            setQuizMode(q => !q)
            setQuizAnswer(null)
            setQuizRevealed(false)
          }}
          className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
            quizMode
              ? 'bg-yellow-400/20 border-yellow-400/60 text-yellow-300'
              : 'bg-white/5 border-white/20 text-white/50 hover:text-white/80'
          }`}
        >
          {quizMode ? 'Quiz On' : 'Quiz Me'}
        </button>
      </div>

      {/* Deviation badge */}
      {deviation && (
        <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/50 rounded-lg px-3 py-1.5">
          <span className="text-yellow-400 text-xs font-bold tracking-wide uppercase">Count Deviation</span>
          <span className="text-yellow-300/80 text-xs">{deviation.description}</span>
        </div>
      )}

      {/* Quiz mode or direct display */}
      {quizMode && !quizRevealed ? (
        <div className="space-y-3">
          <p className="text-white/70 text-sm text-center">What would you do?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUIZ_ACTIONS.map(a => (
              <button
                key={a.key}
                onClick={() => setQuizAnswer(a.key)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                  quizAnswer === a.key
                    ? ACTION_COLOR[a.key] + ' border-opacity-100'
                    : 'border-white/20 text-white/60 hover:text-white hover:border-white/40 bg-white/5'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          {quizAnswer && (
            <div className="text-center">
              <button
                onClick={() => setQuizRevealed(true)}
                className="text-xs bg-yellow-400 text-black font-bold px-4 py-1.5 rounded-lg hover:bg-yellow-300 transition-all"
              >
                Reveal Answer
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Quiz result feedback */}
          {quizMode && quizRevealed && quizAnswer && (
            <div className={`rounded-lg px-3 py-2 text-sm font-medium text-center ${
              isQuizCorrect
                ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}>
              {isQuizCorrect
                ? 'Correct! Great read.'
                : `Not quite — you picked ${ACTION_LABEL[quizAnswer] ?? quizAnswer}, correct is ${ACTION_LABEL[displayAction] ?? displayAction}`}
            </div>
          )}

          {/* Recommended action */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/40 text-xs uppercase tracking-wider">
              {deviation ? 'Count Override' : 'Recommended'}
            </span>
            <ActionBadge action={displayAction} />
          </div>

          {/* Teaching note */}
          <p className="text-white/55 text-xs text-center italic leading-relaxed">
            {teachingNote}
          </p>
        </>
      )}

      {/* Count display (when count helper is on) */}
      {countHelperOn && (
        <div className="flex items-center justify-center gap-4 py-1.5 border-t border-white/10 text-xs">
          <span className="text-white/40">Running Count</span>
          <span className={`font-bold ${runningCount > 0 ? 'text-green-400' : runningCount < 0 ? 'text-red-400' : 'text-white/60'}`}>
            {runningCount > 0 ? '+' : ''}{runningCount}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-white/40">True Count</span>
          <span className={`font-bold ${trueCount > 0 ? 'text-green-400' : trueCount < 0 ? 'text-red-400' : 'text-white/60'}`}>
            {trueCount > 0 ? '+' : ''}{trueCount.toFixed(1)}
          </span>
        </div>
      )}

      {/* Probability bar */}
      <div>
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Win / Push / Lose</span>
          {simulating && (
            <span className="text-yellow-400/70 animate-pulse">Simulating...</span>
          )}
        </div>
        {simResult ? (
          <>
            <ProbBar win={simResult.win} push={simResult.push} lose={simResult.lose} />
            <div className="mt-1 text-right text-xs text-white/40">
              EV{' '}
              <span className={`font-mono font-bold ${simResult.ev >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatEV(simResult.ev)} units
              </span>
            </div>
          </>
        ) : (
          <div className="h-5 rounded-full bg-white/10 animate-pulse" />
        )}
      </div>

      {/* Per-action EV table */}
      {evs.length > 0 && (
        <div>
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Action EV</div>
          <EVTable evs={evs} bestAction={displayAction} />
        </div>
      )}
    </div>
  )
}
