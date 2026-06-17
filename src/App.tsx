import { useState } from 'react'
import { PlayTable } from './features/play/PlayTable'
import { CountingTrainer } from './features/counting/CountingTrainer'
import { CalculatorTab } from './features/calculator/CalculatorTab'

type AppView = 'play' | 'count' | 'calc'

export default function App() {
  const [view, setView] = useState<AppView>('play')

  return (
    <div className="min-h-screen md:h-dvh md:min-h-0 flex flex-col md:overflow-hidden">
      {/* Top nav */}
      <nav className="flex shrink-0 gap-1 justify-center px-4 py-2 bg-black/60 border-b border-white/10 sticky top-0 z-50 md:static">
        <button
          onClick={() => setView('play')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'play'
              ? 'bg-felt border border-white/20 text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          Play
        </button>
        <button
          onClick={() => setView('count')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'count'
              ? 'bg-felt border border-white/20 text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          Count Trainer
        </button>
        <button
          onClick={() => setView('calc')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'calc'
              ? 'bg-felt border border-white/20 text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          Calculator
        </button>
      </nav>

      {/* Views */}
      <div className="flex-1 min-h-0">
        {view === 'play' ? (
          <PlayTable />
        ) : view === 'count' ? (
          <CountingTrainer />
        ) : (
          <CalculatorTab />
        )}
      </div>
    </div>
  )
}
