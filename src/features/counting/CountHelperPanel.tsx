import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { checkDeviation } from '../../engine/deviations'
import { calcDecksRemaining, calcTrueCount, calcBetUnits } from './countingUtils'

type PanelMode = 'reveal' | 'blind'
type BlindPhase = 'rc-input' | 'rc-revealed' | 'tc-input' | 'tc-revealed'

export function CountHelperPanel() {
  const runningCount = useGameStore(s => s.runningCount)
  const cardsDealt = useGameStore(s => s.cardsDealt)
  const settings = useGameStore(s => s.settings)
  const dealer = useGameStore(s => s.dealer)
  const hands = useGameStore(s => s.hands)
  const activeHandIndex = useGameStore(s => s.activeHandIndex)
  const phase = useGameStore(s => s.phase)

  const [mode, setMode] = useState<PanelMode>('reveal')
  const [blindPhase, setBlindPhase] = useState<BlindPhase>('rc-input')
  const [rcInput, setRcInput] = useState('')
  const [tcInput, setTcInput] = useState('')
  const [blindRcDelta, setBlindRcDelta] = useState<number | null>(null)
  const [blindTcDelta, setBlindTcDelta] = useState<number | null>(null)

  const decksRemaining = calcDecksRemaining(cardsDealt, settings.numDecks)
  const trueCount = calcTrueCount(runningCount, decksRemaining)
  const betUnits = calcBetUnits(trueCount)

  const activeHand = hands[activeHandIndex]
  const dealerUpcard = dealer.find(c => !c.faceDown) ?? dealer[0]
  const activeDeviation = activeHand && dealerUpcard && phase === 'player'
    ? checkDeviation(activeHand.cards, dealerUpcard, trueCount, false)
    : null

  const resetBlind = () => {
    setBlindPhase('rc-input')
    setRcInput('')
    setTcInput('')
    setBlindRcDelta(null)
    setBlindTcDelta(null)
  }

  const handleRevealRC = () => {
    const userRC = parseInt(rcInput, 10)
    if (isNaN(userRC)) return
    setBlindRcDelta(userRC - runningCount)
    setBlindPhase('tc-input')
  }

  const handleRevealTC = () => {
    const userTC = parseInt(tcInput, 10)
    if (isNaN(userTC)) return
    setBlindTcDelta(userTC - trueCount)
    setBlindPhase('tc-revealed')
  }

  return (
    <div className="rounded-xl bg-black/50 border border-blue-500/30 p-4">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-blue-400 font-bold text-sm">Count Helper</p>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => { setMode('reveal'); resetBlind() }}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${mode === 'reveal' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
          >
            Reveal
          </button>
          <button
            onClick={() => { setMode('blind'); resetBlind() }}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${mode === 'blind' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
          >
            Blind
          </button>
        </div>
      </div>

      {/* Reveal mode */}
      {mode === 'reveal' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="text-center">
              <div className="text-white/50 text-xs">Running Count</div>
              <div className={`text-xl font-bold ${runningCount > 0 ? 'text-green-400' : runningCount < 0 ? 'text-red-400' : 'text-white'}`}>
                {runningCount > 0 ? '+' : ''}{runningCount}
              </div>
            </div>
            <div className="text-center">
              <div className="text-white/50 text-xs">True Count</div>
              <div className={`text-xl font-bold ${trueCount > 0 ? 'text-green-400' : trueCount < 0 ? 'text-red-400' : 'text-white'}`}>
                {trueCount > 0 ? '+' : ''}{trueCount}
              </div>
            </div>
            <div className="text-center">
              <div className="text-white/50 text-xs">Decks Left</div>
              <div className="text-xl font-bold text-white">{decksRemaining.toFixed(1)}</div>
            </div>
            <div className="text-center">
              <div className="text-white/50 text-xs">Bet Ramp</div>
              <div className="text-xl font-bold text-yellow-400">{betUnits}u</div>
            </div>
          </div>

          <AnimatePresence>
            {activeDeviation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-yellow-900/40 border border-gold/30 rounded-lg p-2 text-xs"
              >
                <span className="text-gold font-bold">Deviation: </span>
                <span className="text-white/80">{activeDeviation.description}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Blind mode */}
      {mode === 'blind' && (
        <div className="flex flex-col gap-3">
          <p className="text-white/40 text-xs text-center">Enter your count, then reveal the true values.</p>

          {/* RC row */}
          <div className="flex gap-2">
            <div className="text-white/50 text-xs self-center w-20 shrink-0">Running Count</div>
            {blindPhase === 'rc-input' ? (
              <>
                <input
                  type="number"
                  value={rcInput}
                  onChange={e => setRcInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRevealRC()}
                  placeholder="Your RC..."
                  className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-blue-400 placeholder-white/30"
                />
                <button
                  onClick={handleRevealRC}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all"
                >
                  Reveal
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-between text-sm">
                <span className="text-white/60">You: <strong className="text-white">{rcInput}</strong></span>
                <span className={`font-bold ${blindRcDelta === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Actual: {runningCount > 0 ? '+' : ''}{runningCount}
                  {blindRcDelta !== null && blindRcDelta !== 0 && (
                    <span className="text-red-400 text-xs ml-1">({blindRcDelta > 0 ? '+' : ''}{blindRcDelta})</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* TC row */}
          <div className="flex gap-2">
            <div className="text-white/50 text-xs self-center w-20 shrink-0">True Count</div>
            {(blindPhase === 'tc-input') ? (
              <>
                <input
                  type="number"
                  value={tcInput}
                  onChange={e => setTcInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRevealTC()}
                  placeholder="Your TC..."
                  className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-blue-400 placeholder-white/30"
                />
                <button
                  onClick={handleRevealTC}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all"
                >
                  Reveal
                </button>
              </>
            ) : blindPhase === 'tc-revealed' ? (
              <div className="flex-1 flex items-center justify-between text-sm">
                <span className="text-white/60">You: <strong className="text-white">{tcInput}</strong></span>
                <span className={`font-bold ${blindTcDelta !== null && Math.abs(blindTcDelta) <= 1 ? 'text-green-400' : 'text-red-400'}`}>
                  Actual: {trueCount > 0 ? '+' : ''}{trueCount}
                  {blindTcDelta !== null && blindTcDelta !== 0 && (
                    <span className="text-xs ml-1">({blindTcDelta > 0 ? '+' : ''}{blindTcDelta})</span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex-1 text-white/20 text-xs self-center">Enter running count first</div>
            )}
          </div>

          {blindPhase === 'tc-revealed' && (
            <div className="flex gap-2">
              <div className="text-white/50 text-xs self-center w-20 shrink-0">Bet Ramp</div>
              <div className="text-yellow-400 font-bold text-sm">{betUnits}u</div>
              <button
                onClick={resetBlind}
                className="ml-auto text-xs text-white/40 hover:text-white/70 underline"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
