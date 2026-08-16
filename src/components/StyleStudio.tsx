import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { tryOn, fetchTemplates, type TemplateItem } from '../lib/api'

const FEATURES = [
  { key: 'hair-bang', label: 'Bangs' },
  { key: 'hair-vol', label: 'Volume' },
  { key: 'hair-ext', label: 'Extensions' },
  { key: 'hair-curl', label: 'Curls' },
]

export function StyleStudio() {
  const image = useStore((s) => s.image)
  const analysis = useStore((s) => s.analysis)
  const [feature, setFeature] = useState('hair-bang')
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [selected, setSelected] = useState<TemplateItem | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const demo = analysis?.demo === true

  useEffect(() => {
    if (!image || demo) return
    let cancelled = false
    setLoadingTemplates(true)
    setSelected(null)
    setResultUrl(null)
    void fetchTemplates(feature)
      .then((t) => {
        if (!cancelled) {
          setTemplates(t)
          if (t.length > 0) setSelected(t[0])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTemplates([])
          setSelected(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false)
      })
    return () => { cancelled = true }
  }, [feature, image, demo])

  useEffect(() => {
    if (!image || !selected || demo) return
    let cancelled = false
    setRendering(true)
    setError(null)
    void tryOn(image, feature, { template_id: selected.id })
      .then((res) => { if (!cancelled) setResultUrl(res.url) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Style failed') })
      .finally(() => { if (!cancelled) setRendering(false) })
    return () => { cancelled = true }
  }, [image, selected, feature, demo])

  if (!image) return null

  return (
    <section className="chroma-card px-6 py-6">
      <h2 className="mb-1 text-lg font-bold">Style studio</h2>
      <p className="mb-4 text-sm text-muted">
        Add bangs, volume, length, or waves to your photo with template presets.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FEATURES.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFeature(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              feature === f.key ? 'bg-ink text-white' : 'bg-cream hover:bg-brand/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!demo && loadingTemplates && (
        <p className="text-sm text-muted">Loading styles…</p>
      )}

      {!demo && !loadingTemplates && templates.length === 0 && (
        <p className="text-sm text-amber-700">
          No {FEATURES.find((f) => f.key === feature)?.label.toLowerCase()} templates available.
        </p>
      )}

      {!demo && templates.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setSelected(t); setResultUrl(null) }}
              className={`flex min-w-[88px] flex-col items-center gap-1 rounded-xl border p-2 transition ${
                selected?.id === t.id ? 'border-brand bg-brand/5 ring-2 ring-brand/40' : 'border-transparent bg-cream'
              }`}
            >
              <span className="h-14 w-14 rounded-lg bg-brand/10 text-center leading-[3.5rem]">
                {t.thumb ? <img src={t.thumb} alt={t.title} className="h-full w-full rounded-lg object-cover" /> : '💇'}
              </span>
              <span className="max-w-[80px] truncate text-[11px] font-medium">{t.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Before</p>
          <img src={image} alt="Original selfie" className="w-full rounded-xl border border-black/5 object-cover" />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">After</p>
          {rendering && (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-brand/40 bg-brand/5">
              <div className="flex flex-col items-center gap-2 text-sm text-muted">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                Rendering…
              </div>
            </div>
          )}
          {!rendering && resultUrl && (
            <img src={resultUrl} alt="Style result" className="w-full rounded-xl border border-black/5 object-cover" />
          )}
          {!rendering && !resultUrl && !error && !demo && (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-black/10 bg-cream text-sm text-muted">
              Select a style
            </div>
          )}
          {demo && (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-black/10 bg-cream p-4 text-center text-sm text-muted">
              Style studio is live-only — it renders you with YouCam template
              presets on the API-backed host (Vercel).
            </div>
          )}
          {error && (
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
