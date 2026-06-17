import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../../store/gameStore'
import { checkDeviation } from '../../../engine/deviations'
import { calcDecksRemaining, calcTrueCount, calcBetUnits } from '../countingUtils'
import type { CountingProgress } from '../progress'

interface Props {
  progress: CountingProgress
  onProgress: (updates: Partial<CountingProgress>) => void
}

type HelperMode = 'reveal' | 'blind'

type BlindPhase = 'rc-input' | 'rc-revealed' | 'tc-input' | 'tc-revealed'

const ACTION_LABELS: Record<string, string> = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double',
  P: 'Split',
  R: 'Surrender',
}

export function LiveHelper({ progress, onProgress }: Props) {
  const runningCount = useGameStore(s => s.runningCount)
  const cardsDealt = useGameStore(s => s.cardsDealt)
  const settings = useGameStore(s => s.settings)
  const dealer = useGameStore(s => s.dealer)
  const hands = useGameStore(s => s.hands)
  const activeHandIndex = useGameStore(s => s.activeHandIndex)
  const phase = useGameStore(s => s.phase)

  const [mode, setMode] = useState<HelperMode>('reveal')
  const [blindPhase, setBlindPhase] = useState<BlindPhase>('rc-input')
  const [rcInput, setRcInput] = useState('')
  const [tcInput, setTcInput] = useState('')
  const [blindResult, setBlindResult] = useState<{ rcDelta: number; tcDelta: number } | null>(null)

  const decksRemaining = calcDecksRemaining(cardsDealt, settings.numDecks)
  const trueCount = calcTrueCount(runningCount, decksRemaining)
  const betUnits = calcBetUnits(trueCount)

  // Find active deviation for current hand state
  const activeHand = hands[activeHandIndex]
  const dealerUpcard = dealer.find(c => !c.faceDown) ?? dealer[0]
  const activeDeviation = activeHand && dealerUpcard && phase === 'player'
    ? checkDeviation(activeHand.cards, dealerUpcard, trueCount, false)
    : null

  const handleRevealRC = () => {
    const userRC = parseInt(rcInput, 10)
    if (isNaN(userRC)) return
    setBlindResult(prev => ({ ...prev ?? { tcDelta: 0 }, rcDelta: userRC - runningCount }))
    setBlindPhase('rc-revealed')
  }

  const handleRevealTC = () => {
    const userTC = parseInt(tcInput, 10)
    if (isNaN(userTC)) return
    setBlindResult(prev => ({ ...prev ?? { rcDelta: 0 }, tcDelta: userTC - trueCount }))
    setBlindPhase('tc-revealed')

    // Mark live blind complete if within ±1 of true count
    const tcDelta = Math.abs(userTC - trueCount)
    if (tcDelta <= 1 && !progress.liveBlindComplete) {
      onProgress({ liveBlindComplete: true })
    }
  }

  const resetBlind = () => {
    setBlindPhase('rc-input')
    setRcInput('')
    setTcInput('')
    setBlindResult(null)
  }

  return (
    <div className="flex flex-col gap-4 py-2 max-w-lg mx-auto w-full">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-black/30 rounded-xl p-1">
        <button
          onClick={() => { setMode('reveal'); resetBlind() }}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'reveal' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          Reveal Mode
        </button>
        <button
          onClick={() => { setMode('blind'); resetBlind() }}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'blind' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          Blind Mode
        </button>
      </div>

      {/* Reveal mode */}
      {mode === 'reveal' && (
        <div className="flex flex-col gap-4">
          {/* Count display */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="bg-black/40 rounded-xl p-4 text-center border border-white/10">
              <div className="text-white/40 text-xs mb-1">Running Count</div>
              <div className={`text-2xl font-bold ${runningCount > 0 ? 'text-green-400' : runningCount < 0 ? 'text-red-400' : 'text-white'}`}>
                {runningCount > 0 ? '+' : ''}{runningCount}
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-4 text-center border border-white/10">
              <div className="text-white/40 text-xs mb-1">True Count</div>
              <div className={`text-2xl font-bold ${trueCount > 0 ? 'text-green-400' : trueCount < 0 ? 'text-red-400' : 'text-white'}`}>
                {trueCount > 0 ? '+' : ''}{trueCount}
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-4 text-center border border-white/10">
              <div className="text-white/40 text-xs mb-1">Decks Left</div>
              <div className="text-2xl font-bold text-white">{decksRemaining.toFixed(1)}</div>
            </div>
            <div className="bg-black/40 rounded-xl p-4 text-center border border-gold/20">
              <div className="text-white/40 text-xs mb-1">Bet Ramp</div>
              <div className="text-2xl font-bold text-gold">{betUnits}u</div>
            </div>
          </div>

          {/* Bet recommendation text */}
          <div className="bg-black/30 rounded-xl border border-white/10 p-3 text-sm">
            <span className="text-white/50">Recommendation: </span>
            <span className="text-white font-medium">
              {betUnits === 1
                ? 'Bet minimum — count is neutral or negative.'
                : betUnits <= 2
                ? `TC +2 — bet ${betUnits} units (slightly player-favorable).`
                : betUnits <= 4
                ? `TC +3 — bet ${betUnits} units (~+1% player edge).`
                : betUnits <= 8
                ? `TC +4 — bet ${betUnits} units (strong advantage).`
                : `TC +5 or higher — bet ${betUnits} units (maximum edge).`
              }
            </span>
          </div>

          {/* Active deviation */}
          <AnimatePresence>
            {activeDeviation && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-yellow-900/40 border border-gold/40 rounded-xl p-3"
              >
                <div className="text-gold text-xs font-bold uppercase tracking-wider mb-1">Count Deviation Active</div>
                <div className="text-white/90 text-sm">{activeDeviation.description}</div>
                <div className="text-white/60 text-xs mt-1">
                  Action: <span className="text-gold font-medium">{ACTION_LABELS[activeDeviation.action] ?? activeDeviation.action}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No active game message */}
          {phase === 'idle' && (
            <div className="text-white/30 text-xs text-center">Start a game in Play mode to see live count data.</div>
          )}

          {/* Illustrious 18 quick reference */}
          <details className="bg-black/20 rounded-xl border border-white/10">
            <summary className="p-3 text-white/60 text-xs cursor-pointer hover:text-white/80 select-none">
              Illustrious 18 Reference (expand)
            </summary>
            <div className="px-3 pb-3 text-xs space-y-1 text-white/60">
              <div className="grid grid-cols-2 gap-x-4">
                <span>Insurance</span><span className="text-white/40">TC ≥ +3</span>
                <span>16 v T: Stand</span><span className="text-white/40">TC ≥ 0</span>
                <span>15 v T: Stand</span><span className="text-white/40">TC ≥ +4</span>
                <span>TT v 5: Split</span><span className="text-white/40">TC ≥ +5</span>
                <span>TT v 6: Split</span><span className="text-white/40">TC ≥ +4</span>
                <span>10 v T: Double</span><span className="text-white/40">TC ≥ +4</span>
                <span>12 v 3: Stand</span><span className="text-white/40">TC ≥ +2</span>
                <span>12 v 2: Stand</span><span className="text-white/40">TC ≥ +3</span>
                <span>11 v A: Double</span><span className="text-white/40">TC ≥ +1</span>
                <span>9 v 2: Double</span><span className="text-white/40">TC ≥ +1</span>
                <span>10 v A: Double</span><span className="text-white/40">TC ≥ +4</span>
                <span>9 v 7: Double</span><span className="text-white/40">TC ≥ +3</span>
                <span>16 v 9: Stand</span><span className="text-white/40">TC ≥ +5</span>
                <span>13 v 2: Stand</span><span className="text-white/40">TC ≥ -1</span>
                <span>12 v 4: Stand</span><span className="text-white/40">TC ≥ 0</span>
                <span>12 v 5: Stand</span><span className="text-white/40">TC ≥ -2</span>
                <span>12 v 6: Stand</span><span className="text-white/40">TC ≥ -1</span>
                <span>13 v 3: Stand</span><span className="text-white/40">TC ≥ -2</span>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Blind mode */}
      {mode === 'blind' && (
        <div className="flex flex-col gap-4">
          <div className="bg-black/30 rounded-xl border border-blue-400/20 p-3 text-sm text-blue-200 text-center">
            Blind mode: commit your count, then see how accurate you are.
          </div>

          {/* RC step */}
          <div className={`rounded-xl border p-4 transition-all ${blindPhase !== 'rc-input' ? 'border-white/5 opacity-70' : 'border-white/20 bg-black/30'}`}>
            <div className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wider">Step 1 — Running Count</div>
            {blindPhase === 'rc-input' ? (
              <div className="flex gap-3">
                <input
                  type="number"
                  value={rcInput}
                  onChange={e => setRcInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRevealRC()}
                  placeholder="Your running count..."
                  className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:outline-none focus:border-blue-400 placeholder-white/30"
                />
                <button
                  onClick={handleRevealRC}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all"
                >
                  Reveal
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Your answer: <span className="text-white font-bold">{parseInt(rcInput) > 0 ? '+' : ''}{rcInput}</span></span>
                <div className={`font-bold text-lg ${blindResult && blindResult.rcDelta === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {blindResult && blindResult.rcDelta === 0
                    ? `Exact! RC = ${runningCount > 0 ? '+' : ''}${runningCount}`
                    : `RC = ${runningCount > 0 ? '+' : ''}${runningCount} (off by ${blindResult && blindResult.rcDelta > 0 ? '+' : ''}${blindResult?.rcDelta ?? 0})`
                  }
                </div>
              </div>
            )}
          </div>

          {/* TC step */}
          <div className={`rounded-xl border p-4 transition-all ${
            blindPhase === 'rc-input' ? 'border-white/5 opacity-40 pointer-events-none' :
            blindPhase !== 'tc-input' && blindPhase !== 'tc-revealed' ? 'border-white/20 bg-black/30' :
            blindPhase === 'tc-input' ? 'border-white/20 bg-black/30' :
            'border-white/5 opacity-70'
          }`}>
            <div className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wider">Step 2 — True Count</div>
            {(blindPhase === 'tc-input') ? (
              <div className="flex gap-3">
                <input
                  type="number"
                  value={tcInput}
                  onChange={e => setTcInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRevealTC()}
                  placeholder="Your true count..."
                  className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:outline-none focus:border-blue-400 placeholder-white/30"
                />
                <button
                  onClick={handleRevealTC}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all"
                >
                  Reveal
                </button>
              </div>
            ) : blindPhase === 'rc-revealed' ? (
              <div className="flex gap-3">
                <input
                  type="number"
                  value={tcInput}
                  onChange={e => setTcInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRevealTC()}
                  placeholder="Your true count..."
                  className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:outline-none focus:border-blue-400 placeholder-white/30"
                />
                <button
                  onClick={handleRevealTC}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all"
                >
                  Reveal
                </button>
              </div>
            ) : blindPhase === 'tc-revealed' ? (
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Your answer: <span className="text-white font-bold">{parseInt(tcInput) > 0 ? '+' : ''}{tcInput}</span></span>
                <div className={`font-bold text-lg ${blindResult && Math.abs(blindResult.tcDelta) <= 1 ? 'text-green-400' : 'text-red-400'}`}>
                  {blindResult && blindResult.tcDelta === 0
                    ? `Exact! TC = ${trueCount > 0 ? '+' : ''}${trueCount}`
                    : blindResult && Math.abs(blindResult.tcDelta) <= 1
                    ? `Close! TC = ${trueCount > 0 ? '+' : ''}${trueCount} (±1 accepted)`
                    : `TC = ${trueCount > 0 ? '+' : ''}${trueCount} (off by ${blindResult && blindResult.tcDelta > 0 ? '+' : ''}${blindResult?.tcDelta ?? 0})`
                  }
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm text-center">Enter running count first</div>
            )}
          </div>

          {/* Reveal summary */}
          <AnimatePresence>
            {blindPhase === 'tc-revealed' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 rounded-xl border border-white/10 p-4"
              >
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <div className="text-white/40 text-xs">Running Count</div>
                    <div className={`font-bold text-lg ${runningCount > 0 ? 'text-green-400' : runningCount < 0 ? 'text-red-400' : 'text-white'}`}>
                      {runningCount > 0 ? '+' : ''}{runningCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs">True Count</div>
                    <div className={`font-bold text-lg ${trueCount > 0 ? 'text-green-400' : trueCount < 0 ? 'text-red-400' : 'text-white'}`}>
                      {trueCount > 0 ? '+' : ''}{trueCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs">Decks Left</div>
                    <div className="font-bold text-lg text-white">{decksRemaining.toFixed(1)}</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-white/50 text-sm">Bet recommendation: </span>
                  <span className="text-gold font-bold">{betUnits}u</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {blindPhase === 'tc-revealed' && (
            <button
              onClick={resetBlind}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
            >
              Test Again
            </button>
          )}

          {progress.liveBlindComplete && (
            <div className="bg-gradient-to-r from-gold/20 to-yellow-300/20 border border-gold rounded-xl p-3 text-center">
              <div className="text-gold font-bold">Live Blind Complete!</div>
              <div className="text-white/60 text-xs mt-1">You confirmed your count within ±1 true count.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
