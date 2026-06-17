import { AnimatePresence, motion } from 'framer-motion'
import type { DecisionFeedback as DecisionFeedbackType } from '../../store/gameStore'

interface DecisionToastProps {
  feedback: DecisionFeedbackType | null
  onDismiss: () => void
}

interface DecisionSummaryProps {
  decisions: DecisionFeedbackType[]
  onDismiss: () => void
}

export function DecisionToast({ feedback, onDismiss }: DecisionToastProps) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key={feedback.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`w-full rounded-xl border px-4 py-3 shadow-lg ${
            feedback.correct
              ? 'border-green-400/50 bg-green-950/70'
              : 'border-red-400/50 bg-red-950/70'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`text-xs font-bold uppercase tracking-widest ${feedback.correct ? 'text-green-300' : 'text-red-300'}`}>
                {feedback.correct ? 'Correct decision' : 'Strategy check'}
              </div>
              <div className="mt-1 text-sm text-white/85">
                {feedback.situation}: you chose <strong>{feedback.chosenLabel}</strong>
                {!feedback.correct && <>; chart says <strong>{feedback.recommendedLabel}</strong></>}
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss decision feedback"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function DecisionSummary({ decisions, onDismiss }: DecisionSummaryProps) {
  if (decisions.length === 0) return null

  const correct = decisions.filter(decision => decision.correct).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-xl border border-yellow-400/40 bg-black/55 p-4 shadow-lg"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold uppercase tracking-widest text-yellow-300">Hand review</div>
          <div className="mt-1 text-xs text-white/55">
            {correct}/{decisions.length} decisions matched the basic strategy chart.
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          Hide
        </button>
      </div>

      <div className="space-y-2">
        {decisions.map(decision => (
          <div
            key={decision.id}
            className={`grid gap-2 rounded-lg px-3 py-2 text-sm sm:grid-cols-[1fr_auto_auto] ${
              decision.correct ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}
          >
            <div className="font-medium text-white/80">
              Hand {decision.handIndex + 1}: {decision.situation}
            </div>
            <div className="text-white/55">
              You: <span className="font-semibold text-white/85">{decision.chosenLabel}</span>
            </div>
            <div className={decision.correct ? 'text-green-300' : 'text-red-300'}>
              Chart: <span className="font-semibold">{decision.recommendedLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
