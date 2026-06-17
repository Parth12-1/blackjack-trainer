import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

const CHIPS = [
  { value: 5 },
  { value: 25 },
  { value: 100 },
  { value: 500 },
]

const CHIP_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  5:   { bg: '#dc2626', border: '#ef4444', text: '#fff' },
  25:  { bg: '#16a34a', border: '#22c55e', text: '#fff' },
  100: { bg: '#1c1c1c', border: '#404040', text: '#fff' },
  500: { bg: '#7c3aed', border: '#a78bfa', text: '#fff' },
}

function ChipSVG({ value, size = 48 }: { value: number; size?: number }) {
  const c = CHIP_COLORS[value] ?? CHIP_COLORS[5]
  const r = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Shadow */}
      <circle cx={r} cy={r+size*0.03} r={r*0.9} fill="rgba(0,0,0,0.4)" />
      {/* Main chip */}
      <circle cx={r} cy={r} r={r*0.9} fill={c.bg} />
      {/* Rim */}
      <circle cx={r} cy={r} r={r*0.9} fill="none" stroke={c.border} strokeWidth={size*0.06} />
      {/* Edge stripes at 4 positions */}
      {[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180
        const x1 = r + Math.cos(rad) * r * 0.72
        const y1 = r + Math.sin(rad) * r * 0.72
        const x2 = r + Math.cos(rad) * r * 0.9
        const y2 = r + Math.sin(rad) * r * 0.9
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={size*0.08} strokeLinecap="round" />
      })}
      {/* Center circle */}
      <circle cx={r} cy={r} r={r*0.52} fill={c.bg} stroke={c.border} strokeWidth={size*0.03} />
      {/* Denomination */}
      <text x={r} y={r + size*0.065} textAnchor="middle" fontSize={size*0.22} fontWeight="bold" fill={c.text} fontFamily="system-ui">
        {value >= 100 ? value : `$${value}`}
      </text>
    </svg>
  )
}

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
            className="disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={`$${chip.value}`}
          >
            <ChipSVG value={chip.value} />
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
