import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Basics } from './modules/Basics'
import { Tutorial } from './modules/Tutorial'
import { SpeedDrill } from './modules/SpeedDrill'
import { LiveHelper } from './modules/LiveHelper'
import { CountMeaning } from './modules/CountMeaning'
import {
  loadProgress,
  saveProgress,
  progressScore,
  beltLevel,
} from './progress'
import type { CountingProgress } from './progress'

type TrainerTab = 'basics' | 'tutorial' | 'speed' | 'live' | 'meaning'

const TABS: { id: TrainerTab; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'tutorial', label: 'Tutorial' },
  { id: 'speed', label: 'Speed Drill' },
  { id: 'live', label: 'Live Helper' },
  { id: 'meaning', label: 'Count Meaning' },
]

export function CountingTrainer() {
  const [activeTab, setActiveTab] = useState<TrainerTab>('basics')
  const [progress, setProgress] = useState<CountingProgress>(() => loadProgress())

  const handleProgress = useCallback((updates: Partial<CountingProgress>) => {
    setProgress(prev => {
      const next = { ...prev, ...updates }
      saveProgress(next)
      return next
    })
  }, [])

  const score = progressScore(progress)
  const belt = beltLevel(score)

  return (
    <div className="min-h-screen flex flex-col felt-texture">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 max-w-2xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-white font-bold text-lg tracking-wide">Count Trainer</h1>
          <div className="text-right">
            <div className="text-gold font-bold text-sm">{belt}</div>
            <div className="text-white/40 text-xs">{score}/100</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #fde68a)' }}
            animate={{ width: `${score}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          />
        </div>

        {/* Belt milestones */}
        <div className="flex justify-between mt-1 text-white/20 text-xs px-0.5">
          <span>Basics</span>
          <span>Tutorial</span>
          <span>Speed</span>
          <span>Live</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="max-w-2xl mx-auto w-full px-4">
        <div className="flex gap-1 bg-black/30 rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-felt text-white border border-white/20'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
              {tab.id === 'basics' && progress.basicsComplete && (
                <span className="ml-1 text-green-400 text-xs">✓</span>
              )}
              {tab.id === 'tutorial' && progress.tutorialComplete && (
                <span className="ml-1 text-green-400 text-xs">✓</span>
              )}
              {tab.id === 'speed' && progress.speedDrillBestScore > 0 && (
                <span className="ml-1 text-gold text-xs">{progress.speedDrillBestScore}</span>
              )}
              {tab.id === 'live' && progress.liveBlindComplete && (
                <span className="ml-1 text-green-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 max-w-2xl mx-auto w-full">
        {activeTab === 'basics' && (
          <Basics progress={progress} onProgress={handleProgress} />
        )}
        {activeTab === 'tutorial' && (
          <Tutorial progress={progress} onProgress={handleProgress} />
        )}
        {activeTab === 'speed' && (
          <SpeedDrill progress={progress} onProgress={handleProgress} />
        )}
        {activeTab === 'live' && (
          <LiveHelper progress={progress} onProgress={handleProgress} />
        )}
        {activeTab === 'meaning' && <CountMeaning />}
      </div>
    </div>
  )
}
