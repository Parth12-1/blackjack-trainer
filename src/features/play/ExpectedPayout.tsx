import { useGameStore } from '../../store/gameStore'
import { runMonteCarlo } from '../../engine/montecarlo'
import { aggregateExpectedPayout } from './evPayout'
import type { Card } from '../../engine/cards'

function formatAmount(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

function formatAmountShort(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toFixed(0)}`
}

export function ExpectedPayout() {
  const hands = useGameStore(s => s.hands)
  const dealer = useGameStore(s => s.dealer)
  const shoe = useGameStore(s => s.shoe)
  const settings = useGameStore(s => s.settings)
  const phase = useGameStore(s => s.phase)
  const expectedPayoutOn = useGameStore(s => s.expectedPayoutOn)

  if (!expectedPayoutOn) return null
  if (phase === 'idle' || phase === 'betting') return null
  if (hands.length === 0) return null

  const dealerUpcard: Card | undefined = dealer.find(c => !c.faceDown)
  if (!dealerUpcard) return null

  try {
    const evForHand = (cards: Card[]): number => {
      return runMonteCarlo(cards, dealerUpcard, shoe, 1000, settings.h17).ev
    }

    const { total, perHand } = aggregateExpectedPayout(hands, evForHand)

    const totalColor = total >= 0 ? 'text-green-400' : 'text-red-400'

    return (
      <div className="w-full flex flex-col items-center gap-1 py-1">
        <div className={`text-sm font-semibold ${totalColor}`}>
          Expected return: {formatAmount(total)}
        </div>
        {hands.length > 1 && (
          <div className="flex gap-3 text-xs text-white/50">
            {perHand.map((pv, i) => {
              const color = pv >= 0 ? 'text-green-300/70' : 'text-red-300/70'
              return (
                <span key={i} className={color}>
                  Hand {i + 1}: {formatAmountShort(pv)}
                </span>
              )
            })}
          </div>
        )}
      </div>
    )
  } catch {
    return null
  }
}
