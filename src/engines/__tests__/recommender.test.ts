import { describe, it, expect } from 'vitest'
import { applyRating, learningBoost, rankRecommendations, topRecommendations, emptyLearning } from '../recommender'
import { buildPalette } from '../palette'
import { buildHairProfile } from '../hairprofile'

const colors = buildPalette({ hex: '#b08d76', undertone: 'warm' }, 10)
const profile = buildHairProfile({ lengthTerm: 'medium', typeMapping: 'wavy', frizzMapping: 30 })
const prefs = { budget: 25, upkeepTolerance: 5, boldness: 5 }

describe('applyRating', () => {
  it('is pure — returns new state', () => {
    const s = emptyLearning()
    const s2 = applyRating(s, 'Rose Gold', true)
    expect(s).toEqual(emptyLearning())
    expect(s2.likes['Rose Gold']).toBe(1)
  })
  it('tracks likes and tries', () => {
    let s = emptyLearning()
    s = applyRating(s, 'A', true)
    s = applyRating(s, 'A', false)
    expect(s.likes['A']).toBe(0)
    expect(s.tries['A']).toBe(2)
  })
})

describe('learningBoost', () => {
  it('is 0 with no history', () => {
    expect(learningBoost(emptyLearning(), 'Jet Black')).toBe(0)
  })
  it('positive net likes boost, negative reduce', () => {
    const liked = applyRating(emptyLearning(), 'Jet Black', true)
    const disliked = applyRating(emptyLearning(), 'Jet Black', false)
    expect(learningBoost(liked, 'Jet Black')).toBeGreaterThan(0)
    expect(learningBoost(disliked, 'Jet Black')).toBeLessThan(0)
  })
  it('clamps at ±15', () => {
    let s = emptyLearning()
    for (let i = 0; i < 10; i++) s = applyRating(s, 'Jet Black', true)
    expect(learningBoost(s, 'Jet Black')).toBeLessThanOrEqual(15)
  })
})

describe('rankRecommendations', () => {
  it('sorts by score descending', () => {
    const r = rankRecommendations(colors, profile, prefs)
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score)
    }
  })
  it('flags withinBudget', () => {
    const r = rankRecommendations(colors, profile, { ...prefs, budget: 12 })
    const expensive = r.find((c) => c.upkeepCost > 12)
    if (expensive) expect(expensive.withinBudget).toBe(false)
  })
  it('learning moves liked color up', () => {
    const base = rankRecommendations(colors, profile, prefs)
    const topName = base[0].name
    let s = emptyLearning()
    for (let i = 0; i < 5; i++) s = applyRating(s, topName, true)
    const boosted = rankRecommendations(colors, profile, prefs, s)
    expect(boosted[0].score).toBeGreaterThanOrEqual(base[0].score)
  })
})

describe('topRecommendations', () => {
  it('returns exactly n', () => {
    expect(topRecommendations(colors, profile, prefs, emptyLearning(), 4)).toHaveLength(4)
  })
})
