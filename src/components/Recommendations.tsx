import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { buildPalette, detectUndertone } from '../engines/palette'
import { rankRecommendations } from '../engines/recommender'

export function Recommendations() {
  const analysis = useStore((s) => s.analysis)
  const preferences = useStore((s) => s.preferences)
  const learning = useStore((s) => s.learning)
  const selectedColor = useStore((s) => s.selectedColor)
  const selectColor = useStore((s) => s.selectColor)

  const recommendations = useMemo(() => {
    if (!analysis?.skin_tone) return []
    const profile = {
      colorHold: analysis.hair_length ? 65 : 60,
      volumePotential: 60,
      lengthScore: 2,
      length: analysis.hair_length ?? 'medium',
      texture: 'wavy' as const,
      frizz: 'medium' as const,
      recommended: [],
      notes: [],
    }
    const colors = buildPalette({ hex: analysis.skin_tone, undertone: detectUndertone(analysis.skin_tone) })
    return rankRecommendations(colors, profile, preferences, learning).slice(0, 5)
  }, [analysis, preferences, learning])

  if (recommendations.length === 0) return null

  return (
    <section className="chroma-card px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Ranked picks for you</h2>
        {learning && Object.keys(learning.tries).length > 0 && (
          <span className="text-xs text-muted">Includes your ratings</span>
        )}
      </div>
      <p className="mb-5 text-sm text-muted">
        Blends color match, your preferences, and your feedback history.
      </p>
      <div className="space-y-3">
        {recommendations.map((r, i) => {
          const active = selectedColor === r.name
          return (
            <div
              key={r.name}
              className={`flex flex-col gap-4 rounded-xl border p-4 transition sm:flex-row sm:items-center ${
                active ? 'border-brand bg-brand/5 ring-2 ring-brand/40' : 'border-transparent bg-cream'
              }`}
            >
              <div className="flex w-full items-center gap-4 sm:w-auto sm:flex-1">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span
                  className="h-14 w-14 shrink-0 rounded-xl border border-black/10"
                  style={{ background: r.hex }}
                />
                <div className="min-w-0">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted">
                    Match {r.score}% · ${r.upkeepCost}/wk · touch-up every {r.fadeWeeks} wks
                  </p>
                  {!r.withinBudget && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                      Above budget
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectColor(active ? null : r.name)}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-85"
                >
                  Try it on
                </button>
                <button
                  type="button"
                  aria-label="Like"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm transition hover:bg-brand/10"
                  onClick={() => useStore.getState().rateColor(r.name, true)}
                >
                  👍
                </button>
                <button
                  type="button"
                  aria-label="Dislike"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm transition hover:bg-brand/10"
                  onClick={() => useStore.getState().rateColor(r.name, false)}
                >
                  👎
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-muted">
        Upkeep cost = dye + gloss + care products split weekly. Your 👍/👎 reranks future suggestions.
      </p>
    </section>
  )
}
