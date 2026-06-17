import { describe, it, expect } from 'vitest'
import { buildShoe, cutCardIndex } from '../shoe'

describe('buildShoe', () => {
  it('returns 312 cards for 6 decks', () => {
    const shoe = buildShoe(6)
    expect(shoe.length).toBe(312)
  })

  it('contains each rank+suit combo exactly 6 times', () => {
    const shoe = buildShoe(6)
    const counts: Record<string, number> = {}
    for (const c of shoe) {
      const key = `${c.rank}${c.suit}`
      counts[key] = (counts[key] ?? 0) + 1
    }
    for (const [, count] of Object.entries(counts)) {
      expect(count).toBe(6)
    }
  })

  it('has 52 unique rank+suit combos', () => {
    const shoe = buildShoe(6)
    const unique = new Set(shoe.map(c => `${c.rank}${c.suit}`))
    expect(unique.size).toBe(52)
  })

  it('single deck = 52 cards', () => {
    expect(buildShoe(1).length).toBe(52)
  })
})

describe('cutCardIndex', () => {
  it('≈ 75% of shoe length', () => {
    const shoe = buildShoe(6)
    const idx = cutCardIndex(shoe)
    expect(idx).toBe(Math.floor(312 * 0.75))  // 234
  })
})
