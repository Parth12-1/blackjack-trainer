import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { evaluateHand } from '../../engine/hand'
import { Card as CardComp } from '../../components/Card'
import { ChipSelector } from '../../components/ChipSelector'
import { ActionButtons } from '../../components/ActionButtons'
import { StatsBar } from '../../components/StatsBar'
import { AdvisorPanel } from '../advisor/AdvisorPanel'
import { CountHelperPanel } from '../counting/CountHelperPanel'
import { DecisionSummary, DecisionToast } from './DecisionFeedback'
import { SettingsModal } from './SettingsModal'
import type { Hand } from '../../types/game'
import type { Card } from '../../engine/cards'

const RESULT_LABELS: Record<string, string> = {
  blackjack: '🃏 BLACKJACK!',
  win: 'WIN',
  lose: 'LOSE',
  bust: 'BUST',
  push: 'PUSH',
  surrender: 'SURRENDER',
}

const RESULT_COLORS: Record<string, string> = {
  blackjack: 'text-yellow-400',
  win: 'text-green-400',
  lose: 'text-red-400',
  bust: 'text-red-500',
  push: 'text-white/60',
  surrender: 'text-orange-400',
}

function PanelWaiting({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl bg-black/50 border border-white/15 p-4 text-center">
      <p className="text-white/60 text-xs font-medium tracking-wide uppercase">{title}</p>
      <p className="text-white/30 text-xs mt-1">{message}</p>
    </div>
  )
}

function HandDisplay({ cards, label, result, active }: { cards: Card[]; label: string; result?: string; active?: boolean }) {
  const visible = cards.filter(c => !c.faceDown)
  const hv = visible.length > 0 ? evaluateHand(visible) : null
  const isDealer = label.toLowerCase().includes('dealer')

  return (
    <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all md:gap-1 md:p-2 ${active ? 'ring-2 ring-yellow-400 bg-white/5' : ''}`}>
      <div className="text-white/50 text-xs uppercase tracking-widest">{label}</div>
      {hv && (
        <div className={`text-sm font-bold ${hv.bust ? 'text-red-400' : hv.soft ? 'text-blue-300' : 'text-white/80'}`}>
          {hv.soft ? `Soft ${hv.total}` : hv.total}
          {hv.bust ? ' (Bust)' : ''}
          {hv.blackjack ? ' ★' : ''}
        </div>
      )}
      <div className="flex gap-1 flex-wrap justify-center min-h-[100px] items-center">
        {cards.length === 0
          ? <div className="w-[72px] h-[100px] rounded-lg border-2 border-dashed border-white/15" />
          : cards.map((c, i) => (
              <CardComp
                key={`${c.rank}-${c.suit}-${i}`}
                card={c}
                size="md"
                delay={i * 0.08}
                fromTop={isDealer}
                fromSide={isDealer ? 'right' : 'left'}
              />
            ))
        }
      </div>
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-bold text-base uppercase tracking-wide ${RESULT_COLORS[result] ?? 'text-white'}`}
          >
            {RESULT_LABELS[result] ?? result.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PlayTable() {
  const phase = useGameStore(s => s.phase)
  const dealer = useGameStore(s => s.dealer)
  const hands = useGameStore(s => s.hands)
  const activeHandIndex = useGameStore(s => s.activeHandIndex)
  const advisorOn = useGameStore(s => s.advisorOn)
  const countHelperOn = useGameStore(s => s.countHelperOn)
  const toggleAdvisor = useGameStore(s => s.toggleAdvisor)
  const toggleCountHelper = useGameStore(s => s.toggleCountHelper)
  const resetBankroll = useGameStore(s => s.resetBankroll)
  const updateSettings = useGameStore(s => s.updateSettings)
  const settings = useGameStore(s => s.settings)
  const decisionFeedback = useGameStore(s => s.decisionFeedback)
  const latestDecisionFeedback = useGameStore(s => s.latestDecisionFeedback)
  const dismissDecisionFeedback = useGameStore(s => s.dismissDecisionFeedback)
  const isDealing = useGameStore(s => s.isDealing)
  const dealId = useGameStore(s => s.dealId)
  const finishInitialDeal = useGameStore(s => s.finishInitialDeal)
  const [summaryDismissed, setSummaryDismissed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dealStep, setDealStep] = useState(4)
  const [isDesktopLayout, setIsDesktopLayout] = useState(false)

  useEffect(() => {
    if (phase !== 'settle') setSummaryDismissed(false)
  }, [phase])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktopLayout(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!isDealing) {
      setDealStep(4)
      return
    }

    setDealStep(0)
    const timers = [
      window.setTimeout(() => setDealStep(1), 80),
      window.setTimeout(() => setDealStep(2), 260),
      window.setTimeout(() => setDealStep(3), 440),
      window.setTimeout(() => setDealStep(4), 620),
      window.setTimeout(() => finishInitialDeal(), 860),
    ]

    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [dealId, finishInitialDeal, isDealing])

  const initialDealAnimating = isDealing && dealer.length === 2 && hands.length === 1
  const dealerCards = initialDealAnimating
    ? dealer.slice(0, dealStep >= 4 ? 2 : dealStep >= 2 ? 1 : 0)
    : dealer

  function cardsForHand(hand: Hand, index: number): Card[] {
    if (!initialDealAnimating || index !== 0) return hand.cards
    return hand.cards.slice(0, dealStep >= 3 ? 2 : dealStep >= 1 ? 1 : 0)
  }

  const panelShell = 'hidden min-h-0 lg:flex lg:flex-col lg:overflow-y-auto'
  const panelPlaceholder = 'hidden lg:block'

  return (
    <div className="min-h-screen flex flex-col md:h-full md:min-h-0 md:overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #1a5c38 0%, #0f3d26 100%)' }}>
      <StatsBar />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:py-3 lg:overflow-hidden">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center gap-6 md:gap-3 lg:grid lg:h-full lg:min-h-0 lg:max-w-[1500px] lg:grid-cols-[minmax(240px,320px)_minmax(420px,680px)_minmax(240px,320px)] lg:items-stretch lg:gap-4">
          {advisorOn && isDesktopLayout ? (
            <motion.aside
              className={panelShell}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {isDealing ? <PanelWaiting title="Strategy Advisor" message="Dealing cards..." /> : <AdvisorPanel />}
            </motion.aside>
          ) : <div className={panelPlaceholder} />}

          <div className="flex min-h-full w-full flex-col items-center justify-center gap-6 md:gap-3 lg:min-h-0 lg:overflow-y-auto lg:py-1">
            {/* Dealer area */}
            <div className="w-full">
              <HandDisplay
                cards={dealerCards}
                label="Dealer"
              />
            </div>

            {/* Mobile advisor panel mount */}
            <AnimatePresence>
              {advisorOn && !isDesktopLayout && (
                <motion.div className="w-full lg:hidden" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {isDealing ? <PanelWaiting title="Strategy Advisor" message="Dealing cards..." /> : <AdvisorPanel />}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Player hands */}
            <div className="w-full">
              {hands.length === 0 ? (
                <HandDisplay cards={[]} label="Your Hand" />
              ) : (
                <div className="flex flex-wrap gap-3 justify-center">
                  {hands.map((hand: Hand, i: number) => (
                    <HandDisplay
                      key={i}
                      cards={cardsForHand(hand, i)}
                      label={hands.length > 1 ? `Hand ${i + 1}  ($${hand.bet})` : `Your Hand  ($${hand.bet})`}
                      result={hand.result}
                      active={i === activeHandIndex && phase === 'player' && !isDealing}
                    />
                  ))}
                </div>
              )}
            </div>

            <DecisionToast
              feedback={phase === 'settle' ? null : latestDecisionFeedback}
              onDismiss={dismissDecisionFeedback}
            />

            {phase === 'settle' && decisionFeedback.length > 0 && !summaryDismissed && (
              <DecisionSummary
                decisions={decisionFeedback}
                onDismiss={() => setSummaryDismissed(true)}
              />
            )}

            {/* Bet / actions */}
            <div className="w-full bg-black/25 rounded-2xl p-4 flex flex-col items-center gap-4 border border-white/10 md:gap-3 md:p-3">
              {(phase === 'idle' || phase === 'betting') && <ChipSelector />}
              <ActionButtons />
            </div>
          </div>

          {countHelperOn && isDesktopLayout ? (
            <motion.aside
              className={panelShell}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <CountHelperPanel />
            </motion.aside>
          ) : <div className={panelPlaceholder} />}
        </div>
      </div>

      {/* Mobile count helper panel */}
      <AnimatePresence>
        {countHelperOn && !isDesktopLayout && (
          <motion.div className="px-4 pb-3 max-w-2xl mx-auto w-full md:pb-2 lg:hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
            <CountHelperPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer controls */}
      <div className="flex shrink-0 flex-wrap gap-2 justify-center px-4 py-3 bg-black/40 border-t border-white/10 text-xs md:py-2">
        <button
          onClick={toggleAdvisor}
          className={`px-3 py-1.5 rounded-lg transition-all font-medium ${advisorOn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'}`}
        >
          {advisorOn ? '✓ Advisor' : 'Advisor'}
        </button>
        <button
          onClick={toggleCountHelper}
          className={`px-3 py-1.5 rounded-lg transition-all font-medium ${countHelperOn ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'}`}
        >
          {countHelperOn ? '✓ Count Helper' : 'Count Helper'}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          Settings
        </button>
      </div>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onResetBankroll={resetBankroll}
      />
    </div>
  )
}
