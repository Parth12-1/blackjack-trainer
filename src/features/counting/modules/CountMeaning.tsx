import { useState } from 'react'
import { getDeviationRulesSummary } from '../../../engine/deviations'
import { calcBetUnits } from '../countingUtils'
import type { Deviation } from '../../../engine/deviations'

export interface DeviationPrompt {
  ruleId: number
  situation: string
  threshold: number
  action: Deviation['action']
  actionLabel: string
  why: string
}

export function buildDeviationPrompts(): DeviationPrompt[] {
  const all = getDeviationRulesSummary()
  const SELECTED_IDS = [2, 3, 9, 19, 20]
  const WHY: Record<number, string> = {
    2: 'At TC≥0 the deck is neutral or rich — dealer is more likely to bust, stand and let them.',
    3: 'At TC≥+4 enough 10s remain to make dealer bust likely, even with your 15.',
    9: 'At TC≥+1 the shoe is rich — doubling 11 vs Ace overcomes the ace advantage.',
    19: 'At TC≥+3 the deck is 10-rich — your 14 vs T is now a clear long-shot, surrender.',
    20: 'At TC≥0 surrendering 15 vs T saves half your bet vs a likely 10-hole.',
  }
  const actionLabels: Record<Deviation['action'], string> = {
    H: 'Hit',
    S: 'Stand',
    D: 'Double',
    P: 'Split',
    R: 'Surrender',
  }
  return SELECTED_IDS.map(id => {
    const rule = all.find(r => r.id === id)!
    return {
      ruleId: rule.id,
      situation: rule.description.replace(/ at TC.*/, ''),
      threshold: rule.threshold,
      action: rule.action,
      actionLabel: actionLabels[rule.action],
      why: WHY[id] ?? rule.description,
    }
  })
}

const BET_RAMP_TCS = [-2, -1, 0, 1, 2, 3, 4, 5]

const EDGE_TABLE = [
  { tc: -2, edge: '+1.0%', who: 'house' },
  { tc: 0,  edge: '+0.5%', who: 'house' },
  { tc: 2,  edge: '+0.5%', who: 'player' },
  { tc: 4,  edge: '+1.5%', who: 'player' },
]

export function CountMeaning() {
  const [revealed, setReveal] = useState<Record<number, boolean>>({})
  const prompts = buildDeviationPrompts()

  const toggleReveal = (id: number) => {
    setReveal(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col gap-6 py-4">

      {/* Section 1: Edge */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-2">
          True Count → Player Edge
        </p>
        <p className="text-white/70 text-sm mb-3">
          Each true count point shifts the edge by roughly 0.5%. At neutral (TC 0) the house
          still holds ~0.5% against basic strategy. Formula:
        </p>
        <div className="bg-black/40 rounded-lg px-3 py-2 text-center font-mono text-yellow-300 text-sm mb-4">
          edge ≈ TC × 0.5%
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase">
                <th className="text-left pb-2">True Count</th>
                <th className="text-left pb-2">Edge</th>
                <th className="text-left pb-2">Favors</th>
              </tr>
            </thead>
            <tbody>
              {EDGE_TABLE.map(row => (
                <tr key={row.tc} className="border-t border-white/5">
                  <td className="py-1.5 text-yellow-300 font-bold">
                    {row.tc > 0 ? `+${row.tc}` : row.tc}
                  </td>
                  <td className="py-1.5 text-white">{row.edge}</td>
                  <td className={`py-1.5 font-medium ${row.who === 'player' ? 'text-green-400' : 'text-red-400'}`}>
                    {row.who === 'player' ? 'Player' : 'House'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Bet Ramp */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-2">
          Bet Ramp
        </p>
        <p className="text-white/70 text-sm mb-3">
          Raise your bet as the count goes positive to extract maximum value when the shoe favors you.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase">
                <th className="text-left pb-2">True Count</th>
                <th className="text-left pb-2">Bet Units</th>
                <th className="text-left pb-2">vs Min Bet</th>
              </tr>
            </thead>
            <tbody>
              {BET_RAMP_TCS.map(tc => {
                const units = calcBetUnits(tc)
                return (
                  <tr key={tc} className="border-t border-white/5">
                    <td className="py-1.5 text-yellow-300 font-bold">
                      {tc > 0 ? `+${tc}` : tc}
                    </td>
                    <td className="py-1.5 text-white">{units}u</td>
                    <td className={`py-1.5 font-medium ${units > 1 ? 'text-green-400' : 'text-white/50'}`}>
                      {units > 1 ? `×${units}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Interactive Deviations */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-4">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-1">
          Key Deviations
        </p>
        <p className="text-white/70 text-sm mb-4">
          These are the most important plays where the true count changes the correct action.
          Tap each to reveal what to do and why.
        </p>
        <div className="flex flex-col gap-3">
          {prompts.map(prompt => (
            <div
              key={prompt.ruleId}
              className="bg-black/30 border border-white/10 rounded-lg p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-white font-medium text-sm">{prompt.situation}</span>
                  <span className="ml-2 text-yellow-300 text-xs font-mono">
                    TC {prompt.threshold >= 0 ? `+${prompt.threshold}` : prompt.threshold}+
                  </span>
                </div>
                <button
                  onClick={() => toggleReveal(prompt.ruleId)}
                  className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium border transition-all
                    border-white/20 text-white/60 hover:text-white hover:border-white/40"
                >
                  {revealed[prompt.ruleId] ? 'Hide' : 'Reveal'}
                </button>
              </div>
              {revealed[prompt.ruleId] && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/50 text-xs">Action:</span>
                    <span className="text-green-400 font-bold text-sm">{prompt.actionLabel}</span>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">{prompt.why}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
