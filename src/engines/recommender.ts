// ---------------------------------------------------------------------------
// CHROMA recommender engine — ranks hair colors for a user by combining
// color science + style profile + budget preferences + upkeep tolerance.
// Self-learning: user 👍/👎 ratings shift a per-user weight model.
// Pure functions where possible; learning state stored via zustand/idb.
// ---------------------------------------------------------------------------

import type { HairColor } from './palette'
import type { HairProfile } from './hairprofile'

export interface UserPreferences {
  /** weekly budget ceiling in USD */
  budget: number
  /** 0 (barely any upkeep) - 10 (happy to maintain a bold look) */
  upkeepTolerance: number
  /** 0 (classic/conservative) - 10 (bold/fashion-forward) */
  boldness: number
}

export interface LearningState {
  /** color name -> net upvotes accumulated from this user */
  likes: Record<string, number>
  /** total interactions per color */
  tries: Record<string, number>
}

export interface Recommendation extends HairColor {
  /** blended 0-100 final score */
  score: number
  /** budget-ok flag */
  withinBudget: boolean
}

export const emptyLearning = (): LearningState => ({ likes: {}, tries: {} })

/** Add a rating to learning state (pure — returns a new object). */
export function applyRating(state: LearningState, colorName: string, liked: boolean): LearningState {
  return {
    likes: { ...state.likes, [colorName]: (state.likes[colorName] ?? 0) + (liked ? 1 : -1) },
    tries: { ...state.tries, [colorName]: (state.tries[colorName] ?? 0) + 1 },
  }
}

/** Personalized boost (-15..+15) from learning history. */
export function learningBoost(state: LearningState, colorName: string): number {
  const likes = state.likes[colorName] ?? 0
  const tries = state.tries[colorName] ?? 0
  if (tries === 0) return 0
  const net = likes / Math.sqrt(tries)
  return Math.max(-15, Math.min(15, net * 8))
}

/**
 * Rank colors for a user.
 * score = color suitability * profile fit * preference fit + learning boost
 */
export function rankRecommendations(
  colors: HairColor[],
  profile: HairProfile,
  prefs: UserPreferences,
  learning: LearningState = emptyLearning(),
): Recommendation[] {
  const ranked = colors.map((c) => {
    let score = c.suitability

    // profile fit: hair hold vs vibrancy of the color
    const holdFit = Math.max(0, 100 - Math.abs(c.vibrancy * 10 - profile.colorHold))
    score += holdFit * 0.15

    // boldness fit
    const boldFit = 100 - Math.abs(c.vibrancy * 11 - prefs.boldness * 10)
    score += boldFit * 0.12

    // upkeep tolerance fit
    const upkeepFit = 100 - Math.min(100, Math.max(0, c.upkeepCost - prefs.upkeepTolerance * 3.5)) * 0.8
    score += upkeepFit * 0.1

    // budget gate
    const withinBudget = c.upkeepCost <= prefs.budget

    score += learningBoost(learning, c.name)

    return {
      ...c,
      score: Math.max(0, Math.min(100, Math.round(score))),
      withinBudget,
    }
  })

  return ranked.sort((a, b) => b.score - a.score)
}

/** Top N for display, budget-filtered variants for the panel. */
export function topRecommendations(
  colors: HairColor[],
  profile: HairProfile,
  prefs: UserPreferences,
  learning: LearningState = emptyLearning(),
  n = 6,
): Recommendation[] {
  return rankRecommendations(colors, profile, prefs, learning).slice(0, n)
}
