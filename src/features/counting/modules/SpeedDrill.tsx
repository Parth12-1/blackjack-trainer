import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../../../components/Card'
import { buildShoe } from '../../../engine/shoe'
import { hiLoValue } from '../../../engine/cards'
import type { Card as CardType } from '../../../engine/cards'
import type { CountingProgress } from '../progress'

interface Props {
  progress: CountingProgress
  onProgress: (updates: Partial<CountingProgress>) => void
}

type SpeedTier = 'slow' | 'medium' | 'fast' | 'custom'
type DrillState = 'idle' | 'running' | 'checkpoint' | 'complete'

const SPEED_MAP: Record<SpeedTier, number> = {
  slow: 2000,
  medium: 1000,
  fast: 500,
  custom: 1000,
}

const CHECKPOINT_EVERY = 20

interface CheckpointResult {
  cardIndex: number
  expected: number
  submitted: number
  isCorrect: boolean
}

export function SpeedDrill({ progress, onProgress }: Props) {
  const [speedTier, setSpeedTier] = useState<SpeedTier>('slow')
  const [customMs, setCustomMs] = useState(1000)
  const [drillState, setDrillState] = useState<DrillState>('idle')
  const [cardIndex, setCardIndex] = useState(0)
  const [currentCard, setCurrentCard] = useState<CardType | null>(null)
  const [checkpoints, setCheckpoints] = useState<CheckpointResult[]>([])
  const [input, setInput] = useState('')
  const [bestScore, setBestScore] = useState(progress.speedDrillBestScore)
  const [score, setScore] = useState(0)
  const [cardVisible, setCardVisible] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningCountRef = useRef(0)
  const cardIndexRef = useRef(0)
  const shoeRef = useRef<CardType[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const intervalMs = speedTier === 'custom' ? customMs : SPEED_MAP[speedTier]

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startDrill = useCallback(() => {
    const newShoe = buildShoe(6)
    shoeRef.current = newShoe
    runningCountRef.current = 0
    cardIndexRef.current = 0
    setCardIndex(0)
    setCheckpoints([])
    setInput('')
    setScore(0)
    setCardVisible(false)

    setDrillState('running')

    // Show first card immediately
    const firstCard = newShoe[0]
    setCurrentCard(firstCard)
    setCardVisible(true)

    intervalRef.current = setInterval(() => {
      const idx = cardIndexRef.current
      const s = shoeRef.current

      if (idx >= s.length) {
        stopInterval()
        setDrillState('checkpoint') // final checkpoint at shoe end
        return
      }

      // Update running count for current card
      runningCountRef.current += hiLoValue(s[idx].rank)
      cardIndexRef.current++

      const nextIdx = cardIndexRef.current

      // Check if we hit a checkpoint
      if (nextIdx % CHECKPOINT_EVERY === 0 && nextIdx < s.length) {
        stopInterval()
        setCardIndex(nextIdx)
        setCardVisible(false)
        setDrillState('checkpoint')
        return
      }

      if (nextIdx >= s.length) {
        stopInterval()
        setCardIndex(nextIdx)
        setCardVisible(false)
        setDrillState('checkpoint')
        return
      }

      // Show next card
      setCardVisible(false)
      setTimeout(() => {
        setCurrentCard(s[nextIdx])
        setCardVisible(true)
        setCardIndex(nextIdx)
      }, 80)
    }, intervalMs)
  }, [intervalMs, stopInterval])

  useEffect(() => {
    return () => stopInterval()
  }, [stopInterval])

  const resumeDrill = useCallback(() => {
    const idx = cardIndexRef.current
    const s = shoeRef.current

    if (idx >= s.length) {
      setDrillState('complete')
      return
    }

    setDrillState('running')
    setCurrentCard(s[idx])
    setCardVisible(true)

    intervalRef.current = setInterval(() => {
      const currentIdx = cardIndexRef.current
      const shoe = shoeRef.current

      // Count current card
      runningCountRef.current += hiLoValue(shoe[currentIdx].rank)
      cardIndexRef.current++

      const nextIdx = cardIndexRef.current

      if (nextIdx >= shoe.length) {
        stopInterval()
        setCardIndex(nextIdx)
        setCardVisible(false)
        setDrillState('checkpoint')
        return
      }

      if (nextIdx % CHECKPOINT_EVERY === 0) {
        stopInterval()
        setCardIndex(nextIdx)
        setCardVisible(false)
        setDrillState('checkpoint')
        return
      }

      setCardVisible(false)
      setTimeout(() => {
        setCurrentCard(shoe[nextIdx])
        setCardVisible(true)
        setCardIndex(nextIdx)
      }, 80)
    }, intervalMs)
  }, [intervalMs, stopInterval])

  const handleCheckpoint = useCallback(() => {
    const userRC = parseInt(input, 10)
    if (isNaN(userRC)) return

    const expected = runningCountRef.current
    const isCorrect = userRC === expected

    const result: CheckpointResult = {
      cardIndex: cardIndexRef.current,
      expected,
      submitted: userRC,
      isCorrect,
    }

    setCheckpoints(prev => {
      const updated = [...prev, result]

      // Check if this is the final checkpoint (shoe end)
      if (cardIndexRef.current >= shoeRef.current.length) {
        // Calculate score
        const correct = updated.filter(c => c.isCorrect).length
        const total = updated.length
        const accuracy = total > 0 ? correct / total : 0
        const speedBonus = speedTier === 'fast' ? 20 : speedTier === 'medium' ? 10 : 0
        const newScore = Math.round(accuracy * 80 + speedBonus)

        setScore(newScore)
        if (newScore > bestScore) {
          setBestScore(newScore)
          onProgress({ speedDrillBestScore: newScore })
        }
        setDrillState('complete')
      }

      return updated
    })

    setInput('')

    if (cardIndexRef.current < shoeRef.current.length) {
      setTimeout(() => resumeDrill(), 300)
    }
  }, [input, bestScore, speedTier, onProgress, resumeDrill])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCheckpoint()
  }

  useEffect(() => {
    if (drillState === 'checkpoint') {
      inputRef.current?.focus()
    }
  }, [drillState])

  const totalCards = shoeRef.current.length || 312
  const progress_pct = Math.round((cardIndex / totalCards) * 100)
  const checkpointNum = Math.ceil(cardIndex / CHECKPOINT_EVERY)
  const totalCheckpoints = Math.ceil(totalCards / CHECKPOINT_EVERY)
  const correctCheckpoints = checkpoints.filter(c => c.isCorrect).length

  return (
    <div className="flex flex-col gap-5 py-2 max-w-lg mx-auto w-full">
      {/* Controls */}
      {drillState === 'idle' && (
        <div className="flex flex-col gap-4">
          <div className="bg-black/30 rounded-xl border border-white/10 p-4">
            <p className="text-white/60 text-sm mb-3">Speed</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['slow', 'medium', 'fast', 'custom'] as SpeedTier[]).map(tier => (
                <button
                  key={tier}
                  onClick={() => setSpeedTier(tier)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize ${
                    speedTier === tier
                      ? 'bg-gold text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {tier === 'slow' ? 'Slow (2s)' : tier === 'medium' ? 'Medium (1s)' : tier === 'fast' ? 'Fast (0.5s)' : 'Custom'}
                </button>
              ))}
            </div>
            {speedTier === 'custom' && (
              <div className="mt-3 flex flex-col gap-1">
                <label className="text-white/50 text-xs">{(customMs / 1000).toFixed(1)}s per card</label>
                <input
                  type="range"
                  min={300}
                  max={3000}
                  step={100}
                  value={customMs}
                  onChange={e => setCustomMs(Number(e.target.value))}
                  className="w-full accent-gold"
                />
                <div className="flex justify-between text-white/30 text-xs">
                  <span>0.3s (fast)</span>
                  <span>3s (slow)</span>
                </div>
              </div>
            )}
          </div>

          {bestScore > 0 && (
            <div className="bg-black/20 rounded-xl border border-gold/20 p-3 flex items-center justify-between">
              <span className="text-white/60 text-sm">Best Score</span>
              <span className="text-gold font-bold text-lg">{bestScore}</span>
            </div>
          )}

          <button
            onClick={startDrill}
            className="w-full py-4 rounded-xl bg-gold text-black font-bold text-lg hover:bg-yellow-400 transition-all"
          >
            Start Drill — 6-Deck Shoe
          </button>
        </div>
      )}

      {/* Running drill */}
      {drillState === 'running' && (
        <div className="flex flex-col items-center gap-5">
          {/* Progress */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gold rounded-full"
                animate={{ width: `${progress_pct}%` }}
              />
            </div>
            <span className="text-white/40 text-xs whitespace-nowrap">{cardIndex}/{totalCards}</span>
          </div>

          {/* Card display */}
          <AnimatePresence mode="wait">
            {currentCard && cardVisible && (
              <motion.div
                key={`${cardIndex}-${currentCard.rank}-${currentCard.suit}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.08 }}
              >
                <Card card={currentCard} size="lg" />
              </motion.div>
            )}
            {!cardVisible && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ width: 88, height: 124 }}
                className="rounded-lg border-2 border-dashed border-white/10"
              />
            )}
          </AnimatePresence>

          <div className="text-white/40 text-sm">Keep the running count in your head...</div>

          <div className="flex gap-6 text-center text-sm">
            <div>
              <div className="text-white/40 text-xs">Checkpoint</div>
              <div className="text-white font-bold">{checkpointNum}/{totalCheckpoints}</div>
            </div>
            <div>
              <div className="text-white/40 text-xs">Correct so far</div>
              <div className="text-green-400 font-bold">{correctCheckpoints}</div>
            </div>
          </div>
        </div>
      )}

      {/* Checkpoint prompt */}
      {drillState === 'checkpoint' && (
        <div className="flex flex-col gap-4 items-center">
          <div className="text-gold font-bold text-lg">
            {cardIndex >= totalCards ? 'Shoe Complete!' : `Checkpoint — Card ${cardIndex}`}
          </div>
          <div className="text-white/60 text-sm text-center">
            What is the running count right now?
          </div>

          <div className="flex gap-3 w-full max-w-xs">
            <input
              ref={inputRef}
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Running count..."
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:outline-none focus:border-gold placeholder-white/30"
            />
            <button
              onClick={handleCheckpoint}
              className="px-5 py-3 rounded-xl bg-gold text-black font-bold hover:bg-yellow-400 transition-all"
            >
              OK
            </button>
          </div>

          {checkpoints.length > 0 && (() => {
            const last = checkpoints[checkpoints.length - 1]
            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-3 text-sm border text-center ${
                  last.isCorrect
                    ? 'bg-green-900/40 border-green-500/40 text-green-300'
                    : 'bg-red-900/40 border-red-500/40 text-red-300'
                }`}
              >
                {last.isCorrect
                  ? `Correct! Count was ${last.expected > 0 ? '+' : ''}${last.expected}`
                  : `Expected ${last.expected > 0 ? '+' : ''}${last.expected}, you said ${last.submitted > 0 ? '+' : ''}${last.submitted} (off by ${last.submitted - last.expected > 0 ? '+' : ''}${last.submitted - last.expected})`
                }
              </motion.div>
            )
          })()}
        </div>
      )}

      {/* Complete */}
      {drillState === 'complete' && (
        <div className="flex flex-col gap-4 items-center">
          <div className="text-gold font-bold text-2xl">Drill Complete!</div>

          <div className="grid grid-cols-3 gap-4 text-center w-full">
            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-white/40 text-xs">Checkpoints</div>
              <div className="text-white font-bold text-xl">{correctCheckpoints}/{checkpoints.length}</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-white/40 text-xs">Accuracy</div>
              <div className="text-white font-bold text-xl">
                {checkpoints.length > 0 ? Math.round((correctCheckpoints / checkpoints.length) * 100) : 0}%
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-white/40 text-xs">Score</div>
              <div className={`font-bold text-xl ${score === bestScore ? 'text-gold' : 'text-white'}`}>{score}</div>
            </div>
          </div>

          {score === bestScore && bestScore > 0 && (
            <div className="text-gold text-sm font-medium">New personal best!</div>
          )}

          {/* Checkpoint breakdown */}
          <div className="w-full bg-black/20 rounded-xl p-3 max-h-40 overflow-y-auto">
            <div className="text-white/40 text-xs mb-2">Checkpoint Results</div>
            {checkpoints.map((cp, i) => (
              <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                <span className="text-white/50">Card {cp.cardIndex}</span>
                <span className={cp.isCorrect ? 'text-green-400' : 'text-red-400'}>
                  {cp.isCorrect ? `Correct (${cp.expected > 0 ? '+' : ''}${cp.expected})` : `Expected ${cp.expected > 0 ? '+' : ''}${cp.expected}, got ${cp.submitted > 0 ? '+' : ''}${cp.submitted}`}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDrillState('idle')}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
            >
              Change Speed
            </button>
            <button
              onClick={startDrill}
              className="flex-1 py-3 rounded-xl bg-gold text-black font-bold hover:bg-yellow-400 transition-all"
            >
              Drill Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
