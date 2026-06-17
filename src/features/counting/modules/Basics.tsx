import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../../../components/Card'
import { buildShoe } from '../../../engine/shoe'
import { hiLoValue } from '../../../engine/cards'
import type { Card as CardType } from '../../../engine/cards'
import { hiLoLabel } from '../countingUtils'
import type { CountingProgress } from '../progress'

interface Props {
  progress: CountingProgress
  onProgress: (updates: Partial<CountingProgress>) => void
}

const PASS_GATE = 30

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type FlashState = 'idle' | 'correct' | 'wrong'

export function Basics({ progress, onProgress }: Props) {
  const [deck, setDeck] = useState<CardType[]>(() => shuffle(buildShoe(1)))
  const [deckIndex, setDeckIndex] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [flashState, setFlashState] = useState<FlashState>('idle')
  const [showCorrect, setShowCorrect] = useState<-1 | 0 | 1 | null>(null)
  const [completed, setCompleted] = useState(progress.basicsComplete)
  const [avgMs, setAvgMs] = useState(0)
  const cardShownAtRef = useRef<number>(Date.now())
  const timingsRef = useRef<number[]>([])
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentCard = deck[deckIndex]
  const correctValue = currentCard ? hiLoValue(currentCard.rank) : 0

  const advanceCard = useCallback(() => {
    setDeck(prev => {
      const next = deckIndex + 1
      if (next >= prev.length) {
        setDeckIndex(0)
        return shuffle(buildShoe(1))
      }
      setDeckIndex(next)
      return prev
    })
    setShowCorrect(null)
    setFlashState('idle')
    cardShownAtRef.current = Date.now()
  }, [deckIndex])

  useEffect(() => {
    cardShownAtRef.current = Date.now()
  }, [])

  const handleAnswer = useCallback((answer: -1 | 0 | 1) => {
    if (flashState !== 'idle') return

    const elapsed = Date.now() - cardShownAtRef.current
    timingsRef.current = [...timingsRef.current.slice(-29), elapsed]
    const avg = timingsRef.current.reduce((a, b) => a + b, 0) / timingsRef.current.length
    setAvgMs(Math.round(avg))

    const isCorrect = answer === correctValue
    setTotalAttempts(prev => prev + 1)

    if (isCorrect) {
      setTotalCorrect(prev => prev + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      setFlashState('correct')

      if (newStreak >= PASS_GATE && !completed) {
        setCompleted(true)
        onProgress({ basicsComplete: true, basicsStreak: newStreak })
      } else {
        onProgress({ basicsStreak: newStreak })
      }

      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = setTimeout(() => {
        advanceCard()
      }, 400)
    } else {
      setStreak(0)
      setShowCorrect(correctValue)
      setFlashState('wrong')
      onProgress({ basicsStreak: 0 })

      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = setTimeout(() => {
        advanceCard()
      }, 1200)
    }
  }, [flashState, correctValue, streak, completed, onProgress, advanceCard])

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
  }, [])

  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  const cardGlow =
    flashState === 'correct'
      ? '0 0 32px 8px rgba(34,197,94,0.7)'
      : flashState === 'wrong'
      ? '0 0 32px 8px rgba(239,68,68,0.7)'
      : 'none'

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Theory section */}
      <div className="w-full max-w-lg bg-black/30 rounded-xl border border-white/10 p-4">
        <p className="text-gold font-bold text-sm mb-2 uppercase tracking-wider">Hi-Lo Card Values</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-900/40 rounded-lg p-2 border border-green-500/30">
            <div className="text-green-400 font-bold text-lg">+1</div>
            <div className="text-white/70 text-xs">2 · 3 · 4 · 5 · 6</div>
            <div className="text-white/40 text-xs mt-1">Low cards dealt</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/10">
            <div className="text-white font-bold text-lg">0</div>
            <div className="text-white/70 text-xs">7 · 8 · 9</div>
            <div className="text-white/40 text-xs mt-1">Neutral</div>
          </div>
          <div className="bg-red-900/40 rounded-lg p-2 border border-red-500/30">
            <div className="text-red-400 font-bold text-lg">-1</div>
            <div className="text-white/70 text-xs">10 · J · Q · K · A</div>
            <div className="text-white/40 text-xs mt-1">High cards dealt</div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-6 text-sm text-center">
        <div>
          <div className="text-white/40 text-xs">Streak</div>
          <div className={`font-bold text-lg ${streak >= 20 ? 'text-gold' : streak >= 10 ? 'text-green-400' : 'text-white'}`}>
            {streak}/{PASS_GATE}
          </div>
        </div>
        <div>
          <div className="text-white/40 text-xs">Accuracy</div>
          <div className="font-bold text-lg text-white">{accuracy}%</div>
        </div>
        <div>
          <div className="text-white/40 text-xs">Avg Speed</div>
          <div className="font-bold text-lg text-white">{avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : '—'}</div>
        </div>
      </div>

      {/* Streak progress bar */}
      <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full"
          animate={{ width: `${Math.min((streak / PASS_GATE) * 100, 100)}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>
      <p className="text-white/40 text-xs -mt-4">{PASS_GATE} in a row to complete</p>

      {/* Card display */}
      <AnimatePresence mode="wait">
        {currentCard && (
          <motion.div
            key={`${deckIndex}-${currentCard.rank}-${currentCard.suit}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{ filter: `drop-shadow(${cardGlow === 'none' ? '1px 3px 8px rgba(0,0,0,0.5)' : cardGlow.replace('drop-shadow(', '').replace(')', '')})` }}
          >
            <Card card={currentCard} size="lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wrong answer feedback */}
      <AnimatePresence>
        {flashState === 'wrong' && showCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm font-medium"
          >
            Correct answer: <span className="font-bold text-white">{hiLoLabel(showCorrect as -1 | 0 | 1)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer buttons */}
      <div className="flex gap-4">
        {([-1, 0, 1] as const).map(val => (
          <motion.button
            key={val}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleAnswer(val)}
            disabled={flashState !== 'idle'}
            className={`
              w-20 h-16 rounded-xl font-bold text-xl border-2 transition-all
              ${val === 1 ? 'border-green-500 text-green-400 hover:bg-green-500/20 disabled:opacity-50' : ''}
              ${val === 0 ? 'border-white/30 text-white hover:bg-white/10 disabled:opacity-50' : ''}
              ${val === -1 ? 'border-red-500 text-red-400 hover:bg-red-500/20 disabled:opacity-50' : ''}
            `}
          >
            {val === 1 ? '+1' : val === -1 ? '-1' : '0'}
          </motion.button>
        ))}
      </div>

      {/* Completion badge */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-gold/20 to-yellow-300/20 border border-gold rounded-xl p-4 text-center"
          >
            <div className="text-gold font-bold text-lg">Module Complete!</div>
            <div className="text-white/70 text-sm mt-1">You passed the 30-in-a-row gate. Keep drilling to sharpen speed.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
