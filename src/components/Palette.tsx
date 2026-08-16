import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { buildPalette, detectUndertone } from '../engines/palette'

export function Palette() {
  const analysis = useStore((s) => s.analysis)
  const selectedColor = useStore((s) => s.selectedColor)
  const selectColor = useStore((s) => s.selectColor)

  const colors = useMemo(() => {
    if (!analysis?.skin_tone) return []
    return buildPalette({ hex: analysis.skin_tone, undertone: detectUndertone(analysis.skin_tone) }, 8)
  }, [analysis])

  if (colors.length === 0) return null

  return (
    <section className="chroma-card px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Your personal palette</h2>
        <span className="text-xs text-muted">Ranked for your skin tone</span>
      </div>
      <p className="mb-5 text-sm text-muted">
        Tap a color to see it on your photo. Higher match = better harmony with your complexion.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {colors.map((c) => {
          const active = selectedColor === c.name
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => selectColor(active ? null : c.name)}
              className={`rounded-xl border p-3 text-left transition ${
                active ? 'border-brand bg-brand/5 ring-2 ring-brand/40' : 'border-transparent bg-cream hover:border-brand/30'
              }`}
            >
              <span
                className="block h-12 w-full rounded-lg border border-black/10"
                style={{ background: `linear-gradient(135deg, ${c.hex}, ${c.hex}bb)` }}
              />
              <p className="mt-2 text-sm font-semibold">{c.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${c.suitability}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted">{c.suitability}%</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-muted">{c.reason}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
