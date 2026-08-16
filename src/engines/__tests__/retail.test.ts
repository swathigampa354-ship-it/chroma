import { describe, it, expect } from 'vitest'
import { buildUpkeepPlan } from '../retail'

describe('buildUpkeepPlan', () => {
  it('computes annual cost from fade weeks', () => {
    const plan = buildUpkeepPlan('Chocolate Brown', 8, 10)
    expect(plan.rootTouchUpWeeks).toBe(8)
    expect(plan.annualCost).toBeGreaterThan(0)
    expect(plan.steps.length).toBeGreaterThan(0)
  })
  it('returns retail items', () => {
    const plan = buildUpkeepPlan('Rose Gold', 4, 32)
    expect(plan.retail.length).toBeGreaterThan(0)
    expect(plan.retail[0].name).toBeTruthy()
  })
  it('fashion colors get more glosses', () => {
    const plain = buildUpkeepPlan('Chocolate Brown', 8, 10)
    const fashion = buildUpkeepPlan('Platinum Blonde', 4, 34)
    expect(fashion.glossWeeks).toBeGreaterThan(plain.glossWeeks)
  })
  it('falls back to default retail for unknown colors', () => {
    const plan = buildUpkeepPlan('NotARealColor', 6, 20)
    expect(plan.retail.length).toBeGreaterThan(0)
  })
})
