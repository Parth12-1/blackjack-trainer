import type { Card, Rank, Suit } from './cards'

const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','T','J','Q','K']
const SUITS: Suit[] = ['♠','♥','♦','♣']

export function buildShoe(numDecks = 6): Card[] {
  const shoe: Card[] = []
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit })
      }
    }
  }
  // Fisher-Yates shuffle
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]]
  }
  return shoe
}

export function cutCardIndex(shoe: Card[]): number {
  // Cut at 75% penetration — reshuffle when 25% remains
  return Math.floor(shoe.length * 0.75)
}

export function needsShuffle(shoe: Card[], cutIndex: number): boolean {
  return shoe.length <= (shoe.length + cutIndex) - cutIndex || shoe.length < (312 - cutIndex)
}

export function shouldReshuffle(cardsDealt: number, totalCards: number): boolean {
  return (totalCards - cardsDealt) <= Math.floor(totalCards * 0.25)
}
