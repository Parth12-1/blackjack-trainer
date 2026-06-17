import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../../../components/Card'
import { buildShoe } from '../../../engine/shoe'
import { hiLoValue } from '../../../engine/cards'
import type { Card as CardType } from '../../../engine/cards'
import { calcDecksRemaining, calcTrueCount, hiLoLabel } from '../countingUtils'
import type { CountingProgress } from '../progress'

interface Props {
  progress: CountingProgress
  onProgress: (updates: Partial<CountingProgress>) => void
}

type TutorialPhase =
  | 'dealing'
  | 'rc-prompt'
  | 'rc-feedback'
  | 'decks-prompt'
  | 'tc-prompt'
  | 'round-end'

const NUM_DECKS = 6
const CARDS_PER_HAND = 6
const CLEAN_ROUND_THRESHOLD = 10
const HINT_FADE_ROUNDS = 5

interface RoundStats {
  correct: number
  total: number
}

export function Tutorial({ progress, onProgress }: Props) {
  // Shoe state
  const [shoe, setShoe] = useState<CardType[]>(() => buildShoe(NUM_DECKS))
  const [cardsDealt, setCardsDealt] = useState(0)
  // Running count across the shoe
  const [runningCount, setRunningCount] = useState(0)
  // RC at the start of the current hand (before any cards revealed)
  const rcAtHandStartRef = useRef(0)

  // Hand state
  const [handCards, setHandCards] = useState<CardType[]>([])
  const [handCardIndex, setHandCardIndex] = useState(0)
  const [revealedCards, setRevealedCards] = useState<CardType[]>([])

  // UI state
  const [phase, setPhase] = useState<TutorialPhase>('dealing')
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isNewShoe, setIsNewShoe] = useState(false)
  const [showHint, setShowHint] = useState(true)

  // Progress state
  const [roundsCompleted, setRoundsCompleted] = useState(progress.tutorialRounds)
  const [cleanRounds, setCleanRounds] = useState(0)
  const [tutorialComplete, setTutorialComplete] = useState(progress.tutorialComplete)
  const [roundStats, setRoundStats] = useState<RoundStats>({ correct: 0, total: 0 })
  const [cumulativeStats, setCumulativeStats] = useState<RoundStats>({ correct: 0, total: 0 })

  const inputRef = useRef<HTMLInputElement>(null)
  // Stores the last validated correct RC so advanceAfterFeedback doesn't close over stale revealedCards
  const lastValidatedRCRef = useRef(0)

  const showHints = roundsCompleted < HINT_FADE_ROUNDS || showHint

  const startRound = useCallback((
    currentShoe: CardType[],
    currentDealt: number,
    currentRC: number,
    forced?: boolean
  ) => {
    let newShoe = currentShoe
    let newDealt = currentDealt
    let newRC = currentRC
    let shoeReset = false

    if (forced || currentShoe.length < CARDS_PER_HAND || currentDealt >= NUM_DECKS * 52 * 0.75) {
      newShoe = buildShoe(NUM_DECKS)
      newDealt = 0
      newRC = 0
      shoeReset = true
    }

    const handCount = Math.min(CARDS_PER_HAND, newShoe.length)
    const cards = newShoe.slice(0, handCount)
    const remaining = newShoe.slice(handCount)

    setShoe(remaining)
    setCardsDealt(newDealt + handCount)
    setRunningCount(newRC)
    rcAtHandStartRef.current = newRC
    setHandCards(cards)
    setHandCardIndex(0)
    setRevealedCards([])
    setPhase('dealing')
    setInput('')
    setFeedback(null)
    setFeedbackText('')
    setRoundStats({ correct: 0, total: 0 })
    setIsNewShoe(shoeReset)
  }, [])

  // Initialize first round
  useEffect(() => {
    const s = buildShoe(NUM_DECKS)
    const handCount = Math.min(CARDS_PER_HAND, s.length)
    const cards = s.slice(0, handCount)
    const remaining = s.slice(handCount)
    setShoe(remaining)
    setCardsDealt(handCount)
    setHandCards(cards)
    rcAtHandStartRef.current = 0
  }, [])

  const currentCard = handCards[handCardIndex] ?? null

  // Expected RC after all currently revealed cards
  const expectedRCNow = (): number => {
    return rcAtHandStartRef.current + revealedCards.reduce((acc, c) => acc + hiLoValue(c.rank), 0)
  }

  const revealNextCard = useCallback(() => {
    if (!currentCard) return
    const card = { ...currentCard, faceDown: false }
    setRevealedCards(prev => [...prev, card])
    setPhase('rc-prompt')
  }, [currentCard])

  const validateRC = useCallback(() => {
    const userRC = parseInt(input, 10)
    if (isNaN(userRC)) return

    // revealedCards already includes the card just revealed in revealNextCard.
    // expectedRCNow() = rcAtHandStart + sum of all revealed so far.
    const correct = expectedRCNow()
    // Stash the correct RC so advanceAfterFeedback can read it without a stale closure.
    lastValidatedRCRef.current = correct
    const isCorrect = userRC === correct

    const thisCard = revealedCards[revealedCards.length - 1]
    const thisCardValue = hiLoValue(thisCard.rank)

    setRoundStats(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }))
    setCumulativeStats(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }))

    const sign = (n: number) => n > 0 ? '+' : ''
    if (isCorrect) {
      setFeedback('correct')
      setFeedbackText(`Correct! ${thisCard.rank === 'T' ? '10' : thisCard.rank} is ${hiLoLabel(thisCardValue as -1 | 0 | 1)}, running count = ${sign(correct)}${correct}`)
    } else {
      setFeedback('wrong')
      setFeedbackText(`${thisCard.rank === 'T' ? '10' : thisCard.rank} is ${hiLoLabel(thisCardValue as -1 | 0 | 1)}. Running count = ${sign(correct)}${correct}, not ${sign(userRC)}${userRC}.`)
    }

    setPhase('rc-feedback')
    setInput('')
  }, [input, revealedCards])

  const advanceAfterFeedback = useCallback(() => {
    // Use the ref set in validateRC — avoids a stale closure over revealedCards.
    const correct = lastValidatedRCRef.current
    setRunningCount(correct)
    setFeedback(null)
    setFeedbackText('')

    if (handCardIndex + 1 < handCards.length) {
      setHandCardIndex(prev => prev + 1)
      setPhase('dealing')
    } else {
      setPhase('decks-prompt')
    }
  }, [handCardIndex, handCards.length])

  const validateDecks = useCallback(() => {
    const userDecks = parseFloat(input)
    if (isNaN(userDecks)) return
    const expected = calcDecksRemaining(cardsDealt, NUM_DECKS)
    const isClose = Math.abs(userDecks - expected) <= 0.5

    setRoundStats(prev => ({ correct: prev.correct + (isClose ? 1 : 0), total: prev.total + 1 }))
    setCumulativeStats(prev => ({ correct: prev.correct + (isClose ? 1 : 0), total: prev.total + 1 }))

    if (isClose) {
      setFeedback('correct')
      setFeedbackText(`Good — ${expected.toFixed(1)} decks remain (${NUM_DECKS * 52 - cardsDealt} cards ÷ 52).`)
    } else {
      setFeedback('wrong')
      setFeedbackText(`${expected.toFixed(1)} decks remain (${NUM_DECKS * 52 - cardsDealt} cards left ÷ 52).`)
    }
    setPhase('tc-prompt')
    setInput('')
  }, [input, cardsDealt])

  const validateTC = useCallback(() => {
    const userTC = parseInt(input, 10)
    if (isNaN(userTC)) return
    const decks = calcDecksRemaining(cardsDealt, NUM_DECKS)
    const expected = calcTrueCount(runningCount, decks)
    const isCorrect = userTC === expected

    setRoundStats(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }))
    setCumulativeStats(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }))

    const sign = (n: number) => n > 0 ? '+' : ''
    if (isCorrect) {
      setFeedback('correct')
      setFeedbackText(`Correct! TC = RC (${sign(runningCount)}${runningCount}) ÷ ${decks.toFixed(1)} decks = ${sign(expected)}${expected}`)
    } else {
      setFeedback('wrong')
      setFeedbackText(`TC = ${sign(runningCount)}${runningCount} ÷ ${decks.toFixed(1)} = ${sign(expected)}${expected}, not ${sign(userTC)}${userTC}.`)
    }
    setPhase('round-end')
    setInput('')
  }, [input, cardsDealt, runningCount])

  const finishRound = useCallback(() => {
    const roundAccuracy = roundStats.total > 0 ? roundStats.correct / roundStats.total : 0
    const isClean = roundAccuracy >= 0.8
    const newClean = isClean ? cleanRounds + 1 : Math.max(0, cleanRounds - 1)
    const newRoundsCompleted = roundsCompleted + 1
    setCleanRounds(newClean)
    setRoundsCompleted(newRoundsCompleted)

    if (newClean >= CLEAN_ROUND_THRESHOLD && !tutorialComplete) {
      setTutorialComplete(true)
      onProgress({ tutorialComplete: true, tutorialRounds: newRoundsCompleted })
    } else {
      onProgress({ tutorialRounds: newRoundsCompleted })
    }

    startRound(shoe, cardsDealt, runningCount)
  }, [roundStats, cleanRounds, roundsCompleted, tutorialComplete, onProgress, startRound, shoe, cardsDealt, runningCount])

  const handleSubmit = useCallback(() => {
    if (phase === 'rc-prompt') validateRC()
    else if (phase === 'decks-prompt') validateDecks()
    else if (phase === 'tc-prompt') validateTC()
  }, [phase, validateRC, validateDecks, validateTC])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (phase === 'rc-feedback') advanceAfterFeedback()
      else if (phase === 'round-end') finishRound()
      else handleSubmit()
    }
  }

  useEffect(() => {
    if (phase === 'rc-prompt' || phase === 'decks-prompt' || phase === 'tc-prompt') {
      inputRef.current?.focus()
    }
  }, [phase])

  const overallAccuracy = cumulativeStats.total > 0
    ? Math.round((cumulativeStats.correct / cumulativeStats.total) * 100)
    : 0

  const decksRemaining = calcDecksRemaining(cardsDealt, NUM_DECKS)
  const trueCount = calcTrueCount(runningCount, decksRemaining)
  const sign = (n: number) => n > 0 ? '+' : ''

  return (
    <div className="flex flex-col gap-4 py-2 max-w-2xl mx-auto w-full">
      {/* New shoe reminder */}
      <AnimatePresence>
        {isNewShoe && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-blue-900/50 border border-blue-400/40 rounded-xl p-3 text-center text-blue-200 text-sm"
          >
            New shoe — running count reset to 0.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top stats */}
      <div className="flex gap-4 justify-between text-sm text-center flex-wrap">
        <div>
          <div className="text-white/40 text-xs">Rounds</div>
          <div className="font-bold text-white">{roundsCompleted}</div>
        </div>
        <div>
          <div className="text-white/40 text-xs">Clean Rounds</div>
          <div className={`font-bold ${cleanRounds >= 8 ? 'text-gold' : 'text-white'}`}>{cleanRounds}/{CLEAN_ROUND_THRESHOLD}</div>
        </div>
        <div>
          <div className="text-white/40 text-xs">Accuracy</div>
          <div className={`font-bold ${overallAccuracy >= 80 ? 'text-green-400' : 'text-white'}`}>{overallAccuracy}%</div>
        </div>
        <div>
          <div className="text-white/40 text-xs">Running Count</div>
          <div className={`font-bold ${runningCount > 0 ? 'text-green-400' : runningCount < 0 ? 'text-red-400' : 'text-white'}`}>
            {sign(runningCount)}{runningCount}
          </div>
        </div>
      </div>

      {/* Revealed cards */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[80px] items-center bg-black/20 rounded-xl p-3">
        {revealedCards.length === 0 && (
          <span className="text-white/30 text-sm">Cards will appear here...</span>
        )}
        {revealedCards.map((c, i) => (
          <Card key={i} card={c} size="sm" delay={i === revealedCards.length - 1 ? 0.05 : 0} />
        ))}
      </div>

      {/* Coach panel */}
      {showHints && (
        <div className="bg-black/30 rounded-xl border border-blue-400/20 p-3 text-sm">
          <div className="text-blue-300 font-semibold text-xs uppercase tracking-wider mb-1">Coach</div>
          {phase === 'dealing' && (
            <p className="text-white/70">Click "Reveal Card" to see the next card, then tell me the running count.</p>
          )}
          {(phase === 'rc-prompt' || phase === 'rc-feedback') && revealedCards.length > 0 && (() => {
            const last = revealedCards[revealedCards.length - 1]
            const v = hiLoValue(last.rank)
            return (
              <p className="text-white/70">
                {last.rank === 'T' ? '10' : last.rank} = {hiLoLabel(v as -1 | 0 | 1)}
                {v === 1 ? ' (low card — good for player)' : v === -1 ? ' (high card — good for dealer)' : ' (neutral)'}
                . Add this to your running count.
              </p>
            )
          })()}
          {phase === 'decks-prompt' && (
            <p className="text-white/70">
              {NUM_DECKS * 52 - cardsDealt} cards remain. Divide by 52 and round to nearest 0.5 deck.
            </p>
          )}
          {phase === 'tc-prompt' && (
            <p className="text-white/70">
              True Count = Running Count ({sign(runningCount)}{runningCount}) ÷ Decks Remaining ({decksRemaining.toFixed(1)}). Round to nearest integer.
            </p>
          )}
          {phase === 'round-end' && (
            <p className="text-white/70">
              TC {sign(trueCount)}{trueCount}. {trueCount >= 3 ? 'High count — consider increasing bets.' : trueCount <= -1 ? 'Negative count — bet minimum.' : 'Near even — standard bet.'}
            </p>
          )}
        </div>
      )}

      {/* Hint toggle */}
      {roundsCompleted >= HINT_FADE_ROUNDS && (
        <button
          onClick={() => setShowHint(h => !h)}
          className="text-xs text-white/40 hover:text-white/70 underline self-center"
        >
          {showHint ? 'Hide hints' : 'Show hint'}
        </button>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl p-3 text-sm font-medium border ${
              feedback === 'correct'
                ? 'bg-green-900/40 border-green-500/40 text-green-300'
                : 'bg-red-900/40 border-red-500/40 text-red-300'
            }`}
          >
            {feedbackText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action area */}
      <div className="flex flex-col gap-3">
        {phase === 'dealing' && (
          <button
            onClick={revealNextCard}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
          >
            Reveal Card ({handCardIndex + 1}/{handCards.length})
          </button>
        )}

        {(phase === 'rc-prompt' || phase === 'decks-prompt' || phase === 'tc-prompt') && (
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                phase === 'rc-prompt' ? 'Running count...' :
                phase === 'decks-prompt' ? 'Decks remaining (e.g. 5.5)...' :
                'True count...'
              }
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:outline-none focus:border-blue-400 placeholder-white/30"
              step={phase === 'decks-prompt' ? 0.5 : 1}
            />
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-gold text-black font-bold hover:bg-yellow-400 transition-all"
            >
              Check
            </button>
          </div>
        )}

        {phase === 'rc-feedback' && (
          <button
            onClick={advanceAfterFeedback}
            onKeyDown={handleKeyDown}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
          >
            Next Card
          </button>
        )}

        {phase === 'round-end' && (
          <div className="flex flex-col gap-2 items-center">
            <div className="text-white/60 text-sm">
              Round accuracy: {roundStats.total > 0 ? Math.round((roundStats.correct / roundStats.total) * 100) : 0}%
              {roundStats.total > 0 && roundStats.correct / roundStats.total >= 0.8 && (
                <span className="text-green-400 ml-2">Clean round!</span>
              )}
            </div>
            <button
              onClick={finishRound}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
            >
              Next Round
            </button>
          </div>
        )}
      </div>

      {/* Tutorial complete badge */}
      <AnimatePresence>
        {tutorialComplete && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-gold/20 to-yellow-300/20 border border-gold rounded-xl p-4 text-center"
          >
            <div className="text-gold font-bold text-lg">Tutorial Complete!</div>
            <div className="text-white/70 text-sm mt-1">10 clean rounds done. Move on to the Speed Drill!</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
