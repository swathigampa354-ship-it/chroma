import { useStore } from '../lib/store'

export function Profile() {
  const analysis = useStore((s) => s.analysis)
  if (!analysis) return null

  const items = [
    { label: 'Skin tone', value: analysis.skin_tone ?? '—', swatch: analysis.skin_tone },
    { label: 'Hair length', value: analysis.hair_length ?? '—' },
    { label: 'Face quality', value: analysis.face_quality?.area ?? '—' },
    { label: 'Eye color', value: analysis.eye_color ?? '—' },
  ]

  return (
    <section className="chroma-card px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Your profile</h2>
        {analysis.demo && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Demo mode
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl bg-cream px-4 py-3">
            <p className="text-xs font-medium text-muted">{it.label}</p>
            <div className="mt-1 flex items-center gap-2">
              {it.swatch && (
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ background: it.swatch }}
                />
              )}
              <p className="text-sm font-semibold capitalize">{it.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
