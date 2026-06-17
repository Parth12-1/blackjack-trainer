import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

const CHIPS = [
  { value: 5,   bg: '#dc2626', label: '$5' },
  { value: 25,  bg: '#16a34a', label: '$25' },
  { value: 100, bg: '#2563eb', label: '$100' },
  { value: 500, bg: '#111827', label: '$500' },
]

export function ChipSelector() {
  const placeBet = useGameStore(s => s.placeBet)
  const clearBet = useGameStore(s => s.clearBet)
  const currentBet = useGameStore(s => s.currentBet)
  const bankroll = useGameStore(s => s.bankroll)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2 flex-wrap justify-center">
        {CHIPS.map(chip => (
          <motion.button
            key={chip.value}
            whileTap={{ scale: 0.82 }}
            whileHover={{ y: -4, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 360, damping: 18 }}
            onClick={() => placeBet(chip.value)}
            disabled={currentBet + chip.value > bankroll}
            className="relative w-14 h-14 rounded-full text-white text-xs font-bold shadow-lg border-2 border-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors before:absolute before:inset-2 before:rounded-full before:border before:border-white/25"
            style={{ backgroundColor: chip.bg }}
          >
            {chip.label}
          </motion.button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-white">
        <motion.span
          key={currentBet}
          initial={{ scale: 0.92, opacity: 0.65 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-gold font-bold text-xl"
        >
          Bet: ${currentBet}
        </motion.span>
        {currentBet > 0 && (
          <button onClick={clearBet} className="text-xs text-white/50 hover:text-white underline transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
