import { describe, it, expect } from 'vitest'
import { buildDeviationPrompts } from '../modules/CountMeaning'
import { getDeviationRulesSummary } from '../../../engine/deviations'

describe('buildDeviationPrompts', () => {
  it('returns prompts derived from the deviations table, not hardcoded', () => {
    const rules = getDeviationRulesSummary()
    const prompts = buildDeviationPrompts()
    // Every prompt threshold must come from an actual rule
    for (const p of prompts) {
      const match = rules.find(r => r.id === p.ruleId)
      expect(match).toBeDefined()
      expect(p.threshold).toBe(match!.threshold)
      expect(p.action).toBe(match!.action)
    }
  })

  it('includes the classic 16 vs T deviation (id=2)', () => {
    const prompts = buildDeviationPrompts()
    const p = prompts.find(x => x.ruleId === 2)
    expect(p).toBeDefined()
    expect(p!.threshold).toBe(0)
    expect(p!.action).toBe('S')
  })
})
