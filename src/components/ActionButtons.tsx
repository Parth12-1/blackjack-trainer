import { useGameStore } from '../store/gameStore'
import { evaluateHand, canDouble, canSplit, canSurrender } from '../engine/hand'

interface BtnProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'hit' | 'stand' | 'double' | 'split' | 'surrender'
}

function Btn({ label, onClick, disabled, variant = 'stand' }: BtnProps) {
  const cls = {
    primary:   'bg-yellow-400 text-black hover:bg-yellow-300 font-bold',
    hit:       'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-md hover:from-emerald-400 hover:to-emerald-600 active:scale-95 transition-all',
    stand:     'bg-gradient-to-b from-slate-600 to-slate-800 text-white shadow-md hover:from-slate-500 hover:to-slate-700 active:scale-95 transition-all',
    double:    'bg-gradient-to-b from-amber-500 to-amber-700 text-white shadow-md hover:from-amber-400 hover:to-amber-600 active:scale-95 transition-all',
    split:     'bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-md hover:from-purple-400 hover:to-purple-600 active:scale-95 transition-all',
    surrender: 'bg-gradient-to-b from-rose-600 to-rose-800 text-white shadow-md hover:from-rose-500 hover:to-rose-700 active:scale-95 transition-all',
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${cls}`}
    >
      {label}
    </button>
  )
}

export function ActionButtons() {
  const phase = useGameStore(s => s.phase)
  const hands = useGameStore(s => s.hands)
  const activeHandIndex = useGameStore(s => s.activeHandIndex)
  const splitCount = useGameStore(s => s.splitCount)
  const currentBet = useGameStore(s => s.currentBet)
  const bankroll = useGameStore(s => s.bankroll)
  const settings = useGameStore(s => s.settings)
  const isDealing = useGameStore(s => s.isDealing)
  const { deal, hit, stand, double, split, surrender, newRound } = useGameStore.getState()

  if (phase === 'idle' || phase === 'betting') {
    return (
      <Btn
        label={currentBet >= 5 ? `Deal  ($${currentBet})` : 'Place a bet first'}
        onClick={deal}
        disabled={currentBet < 5}
        variant="primary"
      />
    )
  }

  if (phase === 'settle') {
    return <Btn label="Next Hand →" onClick={newRound} variant="primary" />
  }

  if (isDealing || phase === 'dealer') {
    return <div className="text-white/50 text-sm">{isDealing ? 'Dealing cards…' : 'Dealer playing…'}</div>
  }

  // phase === 'player'
  const hand = hands[activeHandIndex]
  if (!hand) return null
  const hv = evaluateHand(hand.cards)
  const canDbl = canDouble(hand.cards) && bankroll >= hand.bet
  const canSpl = canSplit(hand.cards, splitCount) && bankroll >= hand.bet
  const canSrr = canSurrender(hand.cards, splitCount) && settings.surrender

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Btn label="Hit" onClick={hit} variant="hit" disabled={hv.bust || hv.total === 21} />
      <Btn label="Stand" onClick={stand} variant="stand" disabled={hv.bust} />
      {canDbl && <Btn label="Double" onClick={double} variant="double" />}
      {canSpl && <Btn label="Split" onClick={split} variant="split" />}
      {canSrr && <Btn label="Surrender" onClick={surrender} variant="surrender" />}
    </div>
  )
}
