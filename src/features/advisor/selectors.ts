import type { Card } from '../../engine/cards'
import type { GameState } from '../../store/gameStore'

const EMPTY_PLAYER_CARDS: Card[] = []

type ActiveHandState = Pick<GameState, 'hands' | 'activeHandIndex'>

export function selectActivePlayerCards(state: ActiveHandState): Card[] {
  return state.hands[state.activeHandIndex]?.cards ?? EMPTY_PLAYER_CARDS
}
