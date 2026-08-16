import { useRef } from 'react'
import { useStore } from '../lib/store'
import { analyze, prepareImage, demoAnalyze, DEMO_SELFIE } from '../lib/api'

export function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const setImage = useStore((s) => s.setImage)
  const setAnalysis = useStore((s) => s.setAnalysis)
  const setAnalyzing = useStore((s) => s.setAnalyzing)
  const setAnalyzingError = useStore((s) => s.setAnalyzingError)
  const analyzing = useStore((s) => s.analyzing)
  const analyzingError = useStore((s) => s.analyzingError)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setAnalyzingError(null)
    setAnalyzing(true)
    try {
      const dataUrl = await prepareImage(file)
      setImage(dataUrl)
      const result = await analyze(dataUrl)
      if (!result.skin_tone) {
        setAnalyzingError('No face detected in this photo. Try a well-lit, front-facing selfie.')
      } else {
        setAnalysis(result)
      }
    } catch (e) {
      setAnalyzingError(e instanceof Error ? e.message : 'Analysis failed — please retry.')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleDemo() {
    setAnalyzingError(null)
    setImage(DEMO_SELFIE)
    setAnalysis(demoAnalyze(DEMO_SELFIE))
  }

  return (
    <section className="chroma-card mx-auto max-w-2xl px-6 py-10 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-3xl">
        📸
      </div>
      <h2 className="text-2xl font-bold">Start with one selfie</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Use a clear, well-lit, front-facing photo. Your image is processed
        through the YouCam API and rendered for try-on — it never leaves your
        browser for storage.
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={analyzing}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {analyzing ? 'Analyzing…' : 'Upload a selfie'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {analyzing && (
        <p className="mt-4 text-xs text-muted">
          Skin tone + hair profile — ~2 API calls · ~22 units
        </p>
      )}
      {analyzingError && (
        <p className="mt-4 text-sm font-medium text-red-600">{analyzingError}</p>
      )}
      <button
        type="button"
        onClick={handleDemo}
        className="mt-3 text-xs text-muted underline"
      >
        or try the demo look
      </button>
    </section>
  )
}
