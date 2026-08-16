import { useStore } from '../lib/store'

const LABELS: Record<string, string> = {
  budget: 'Weekly hair budget ($)',
  upkeepTolerance: 'Upkeep tolerance',
  boldness: 'Boldness',
}

const HINTS: Record<string, string> = {
  budget: 'How much you can spend on color each week.',
  upkeepTolerance: 'Low = minimal maintenance. High = happy to touch up.',
  boldness: 'Classic and subtle, or fashion-forward and bold.',
}

export function Preferences() {
  const preferences = useStore((s) => s.preferences)
  const setPreferences = useStore((s) => s.setPreferences)

  return (
    <section className="chroma-card px-6 py-6">
      <h2 className="mb-4 text-lg font-bold">Tune your recommendations</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{LABELS.budget}</label>
            <span className="text-sm font-bold text-brand-dark">${preferences.budget}</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={preferences.budget}
            onChange={(e) => setPreferences({ budget: Number(e.target.value) })}
            className="mt-2 w-full"
          />
          <p className="mt-1 text-xs text-muted">{HINTS.budget}</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{LABELS.upkeepTolerance}</label>
            <span className="text-sm font-bold text-brand-dark">{preferences.upkeepTolerance}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={preferences.upkeepTolerance}
            onChange={(e) => setPreferences({ upkeepTolerance: Number(e.target.value) })}
            className="mt-2 w-full"
          />
          <p className="mt-1 text-xs text-muted">{HINTS.upkeepTolerance}</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{LABELS.boldness}</label>
            <span className="text-sm font-bold text-brand-dark">{preferences.boldness}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={preferences.boldness}
            onChange={(e) => setPreferences({ boldness: Number(e.target.value) })}
            className="mt-2 w-full"
          />
          <p className="mt-1 text-xs text-muted">{HINTS.boldness}</p>
        </div>
      </div>
    </section>
  )
}
