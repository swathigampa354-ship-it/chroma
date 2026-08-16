// ---------------------------------------------------------------------------
// CHROMA global store — scan results, preferences, learning (persisted to
// IndexedDB via idb). Learning ratings feed the recommender engine.
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import { openDB } from 'idb'
import { emptyLearning, applyRating } from '../engines/recommender'
import type { LearningState } from '../engines/recommender'
import type { AnalyzeResult } from './api'

const DB_NAME = 'chroma'
const DB_VERSION = 1

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv')
    },
  })
}

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const d = await db()
    const v = await d.get('kv', key)
    return (v as T) ?? fallback
  } catch {
    return fallback
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    const d = await db()
    await d.put('kv', value, key)
  } catch {
    /* storage unavailable — ignore */
  }
}

export interface Preferences {
  budget: number
  upkeepTolerance: number
  boldness: number
}

interface ChromaState {
  analysis: AnalyzeResult | null
  image: string | null
  analyzing: boolean
  analyzingError: string | null
  selectedColor: string | null
  tryingOn: boolean
  tryOnUrl: string | null
  tryOnError: string | null
  preferences: Preferences
  learning: LearningState
  hydrated: boolean

  setImage: (image: string | null) => void
  setAnalysis: (a: AnalyzeResult | null) => void
  setAnalyzing: (b: boolean) => void
  setAnalyzingError: (e: string | null) => void
  selectColor: (name: string | null) => void
  setTryingOn: (b: boolean) => void
  setTryOnResult: (url: string | null, error: string | null) => void
  setPreferences: (p: Partial<Preferences>) => void
  rateColor: (name: string, liked: boolean) => void
  hydrate: () => Promise<void>
}

export const useStore = create<ChromaState>((set, get) => ({
  analysis: null,
  image: null,
  analyzing: false,
  analyzingError: null,
  selectedColor: null,
  tryingOn: false,
  tryOnUrl: null,
  tryOnError: null,
  preferences: { budget: 20, upkeepTolerance: 5, boldness: 5 },
  learning: emptyLearning(),
  hydrated: false,

  setImage: (image) => {
    set({ image, tryOnUrl: null, tryOnError: null, selectedColor: null })
    if (image) kvSet('image', image)
  },
  setAnalysis: (analysis) => {
    set({ analysis })
    if (analysis) kvSet('analysis', analysis)
  },
  setAnalyzing: (analyzing) => set({ analyzing }),
  setAnalyzingError: (analyzingError) => set({ analyzingError }),
  selectColor: (selectedColor) => set({ selectedColor, tryOnUrl: null, tryOnError: null }),
  setTryingOn: (tryingOn) => set({ tryingOn }),
  setTryOnResult: (tryOnUrl, tryOnError) => set({ tryOnUrl, tryOnError }),
  setPreferences: (p) => {
    const preferences = { ...get().preferences, ...p }
    set({ preferences })
    kvSet('preferences', preferences)
  },
  rateColor: (name, liked) => {
    const learning = applyRating(get().learning, name, liked)
    set({ learning })
    kvSet('learning', learning)
  },
  hydrate: async () => {
    const [image, analysis, preferences, learning] = await Promise.all([
      kvGet<string | null>('image', null),
      kvGet<AnalyzeResult | null>('analysis', null),
      kvGet<Preferences>('preferences', { budget: 20, upkeepTolerance: 5, boldness: 5 }),
      kvGet<LearningState>('learning', emptyLearning()),
    ])
    set({ image, analysis, preferences, learning, hydrated: true })
  },
}))
