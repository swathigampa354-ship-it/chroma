import { useEffect } from 'react'
import { useStore } from '../lib/store'
import { buildPalette, detectUndertone } from '../engines/palette'
import { buildUpkeepPlan } from '../engines/retail'
import { tryOn } from '../lib/api'

export function TryOnStudio() {
  const image = useStore((s) => s.image)
  const analysis = useStore((s) => s.analysis)
  const selectedColor = useStore((s) => s.selectedColor)
  const selectColor = useStore((s) => s.selectColor)
  const tryingOn = useStore((s) => s.tryingOn)
  const tryOnUrl = useStore((s) => s.tryOnUrl)
  const tryOnError = useStore((s) => s.tryOnError)
  const setTryingOn = useStore((s) => s.setTryingOn)
  const setTryOnResult = useStore((s) => s.setTryOnResult)

  const color = selectedColor && analysis?.skin_tone
    ? buildPalette({ hex: analysis.skin_tone, undertone: detectUndertone(analysis.skin_tone) }).find((c) => c.name === selectedColor)
    : null

  useEffect(() => {
    if (!color || !image || !analysis) return
    let cancelled = false
    setTryingOn(true)
    setTryOnResult(null, null)
    void (async () => {
      try {
        const res = await tryOn(image, 'hair-color', {
          palettes: color.palette.map((hex) => ({ color: hex })),
        })
        if (!cancelled) setTryOnResult(res.url, null)
      } catch (e) {
        if (!cancelled) setTryOnResult(null, e instanceof Error ? e.message : 'Try-on failed')
      } finally {
        if (!cancelled) setTryingOn(false)
      }
    })()
    return () => { cancelled = true }
  }, [color, image, analysis, setTryingOn, setTryOnResult])

  if (!image) return null

  const plan = color ? buildUpkeepPlan(color.name, color.fadeWeeks, color.upkeepCost) : null

  return (
    <section className="chroma-card px-6 py-6">
      <h2 className="mb-1 text-lg font-bold">Try-on studio</h2>
      <p className="mb-5 text-sm text-muted">
        {color
          ? `Rendering ${color.name} on your photo…`
          : 'Pick a color from your palette to see it on your own photo.'}
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Before</p>
          <img src={image} alt="Original selfie" className="w-full rounded-xl border border-black/5 object-cover" />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">After</p>
          {tryingOn && (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-brand/40 bg-brand/5">
              <div className="flex flex-col items-center gap-2 text-sm text-muted">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                Rendering with YouCam…
              </div>
            </div>
          )}
          {!tryingOn && tryOnUrl && (
            <img
              src={tryOnUrl}
              alt={`${color?.name} hair color result`}
              className="w-full rounded-xl border border-black/5 object-cover"
            />
          )}
          {!tryingOn && !tryOnUrl && !tryOnError && (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-black/10 bg-cream text-sm text-muted">
              Select a color to begin
            </div>
          )}
          {tryOnError && (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              {tryOnError}
            </div>
          )}
        </div>
      </div>

      {color && plan && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-cream px-4 py-3">
            <p className="text-xs font-medium text-muted">Weekly upkeep</p>
            <p className="mt-1 text-xl font-bold">${color.upkeepCost}</p>
          </div>
          <div className="rounded-xl bg-cream px-4 py-3">
            <p className="text-xs font-medium text-muted">Root touch-up</p>
            <p className="mt-1 text-xl font-bold">every {color.fadeWeeks} wks</p>
          </div>
          <div className="rounded-xl bg-cream px-4 py-3">
            <p className="text-xs font-medium text-muted">Est. annual cost</p>
            <p className="mt-1 text-xl font-bold">${plan.annualCost}/yr</p>
          </div>
        </div>
      )}

      {plan && (
        <div className="mt-4 rounded-xl border border-black/5 p-4">
          <p className="mb-2 text-sm font-semibold">Keeping {plan.colorName} fresh</p>
          <ul className="space-y-1 text-sm text-muted">
            {plan.steps.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-0.5 text-brand">•</span>
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.retail.map((r) => (
              <span key={r.name} className="rounded-full bg-white px-3 py-1 text-xs shadow-sm">
                {r.name} <span className="font-semibold text-brand-dark">${r.price}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => selectColor(null)}
        className="mt-5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-cream"
      >
        Clear selection
      </button>
    </section>
  )
}
