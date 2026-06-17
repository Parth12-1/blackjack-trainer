import { useGameStore } from '../store/gameStore'

export function StatsBar() {
  const bankroll = useGameStore(s => s.bankroll)
  const stats = useGameStore(s => s.stats)
  const net = stats.netDollars
  const netColor = net >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 bg-black/30 text-xs text-white/70 border-b border-white/10">
      <span>Bankroll: <strong className="text-yellow-400 text-sm">${bankroll}</strong></span>
      <span>Hands: <strong className="text-white">{stats.handsPlayed}</strong></span>
      <span>W/L/P: <strong className="text-white">{stats.wins}/{stats.losses}/{stats.pushes}</strong></span>
      <span>Net: <strong className={netColor}>{net >= 0 ? '+' : ''}${net}</strong></span>
      {stats.currentStreak !== 0 && (
        <span>
          Streak: <strong className={stats.currentStreak > 0 ? 'text-green-400' : 'text-red-400'}>
            {stats.currentStreak > 0 ? '+' : ''}{stats.currentStreak}
          </strong>
        </span>
      )}
    </div>
  )
}
