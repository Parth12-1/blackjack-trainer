/**
 * Mastery gating and belt levels for the Counting Trainer.
 * Persisted in localStorage key 'bj-counting-progress'.
 */

export interface CountingProgress {
  basicsComplete: boolean
  basicsStreak: number
  tutorialComplete: boolean
  tutorialRounds: number
  speedDrillBestScore: number
  liveBlindComplete: boolean
}

const STORAGE_KEY = 'bj-counting-progress'

export const DEFAULT_PROGRESS: CountingProgress = {
  basicsComplete: false,
  basicsStreak: 0,
  tutorialComplete: false,
  tutorialRounds: 0,
  speedDrillBestScore: 0,
  liveBlindComplete: false,
}

export function loadProgress(): CountingProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress: CountingProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // localStorage not available — silently ignore
  }
}

/**
 * Score 0-100 based on progress milestones.
 * Basics = 25, Tutorial = 50, Speed Drill = 75, Live Blind = 100.
 */
export function progressScore(p: CountingProgress): number {
  let score = 0
  if (p.basicsComplete) score += 25
  if (p.tutorialComplete) score += 25
  if (p.speedDrillBestScore > 0) score += 25
  if (p.liveBlindComplete) score += 25
  return score
}

/**
 * Belt level names for each 25-point tier.
 */
export function beltLevel(score: number): string {
  if (score >= 100) return 'Expert Counter'
  if (score >= 75) return 'Speed Counter'
  if (score >= 50) return 'Tutorial Graduate'
  if (score >= 25) return 'Basics Complete'
  return 'Beginner'
}
