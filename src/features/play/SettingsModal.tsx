import { AnimatePresence, motion } from 'framer-motion'
import type { Settings } from '../../store/gameStore'

interface SettingsModalProps {
  open: boolean
  settings: Settings
  onClose: () => void
  onUpdateSettings: (settings: Partial<Settings>) => void
  onResetBankroll: () => void
}

export function SettingsModal({
  open,
  settings,
  onClose,
  onUpdateSettings,
  onResetBankroll,
}: SettingsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-4 py-5 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="w-full max-w-md rounded-xl border border-white/15 bg-[#071f15] p-5 shadow-2xl"
            initial={{ y: 20, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.98 }}
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="settings-title" className="text-lg font-bold text-white">Settings</h2>
                <p className="mt-1 text-xs text-white/45">Table rules and bankroll controls</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-white/45">Dealer soft 17</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ h17: false })}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                      !settings.h17 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    S17
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ h17: true })}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                      settings.h17 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    H17
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="text-sm font-bold text-white">Late surrender</div>
                  <div className="text-xs text-white/45">{settings.surrender ? 'Available' : 'Hidden from actions'}</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ surrender: !settings.surrender })}
                  className={`relative h-8 w-14 rounded-full transition-colors ${
                    settings.surrender ? 'bg-yellow-400' : 'bg-white/15'
                  }`}
                  aria-pressed={settings.surrender}
                >
                  <motion.span
                    layout
                    className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
                    animate={{ left: settings.surrender ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                  />
                </button>
              </div>

              <button
                onClick={onResetBankroll}
                className="w-full rounded-lg border border-red-400/30 bg-red-900/30 px-4 py-3 text-sm font-bold text-red-200 transition-colors hover:bg-red-800/45"
              >
                Reset bankroll
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
