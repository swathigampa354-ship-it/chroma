import { useEffect } from 'react'
import { useStore } from './lib/store'
import { Hero } from './components/Hero'
import { UploadCard } from './components/UploadCard'
import { Palette } from './components/Palette'
import { Profile } from './components/Profile'
import { TryOnStudio } from './components/TryOnStudio'
import { StyleStudio } from './components/StyleStudio'
import { Recommendations } from './components/Recommendations'
import { Preferences } from './components/Preferences'

function App() {
  const hydrate = useStore((s) => s.hydrate)
  const hydrated = useStore((s) => s.hydrated)
  const analysis = useStore((s) => s.analysis)
  const image = useStore((s) => s.image)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <div className="bg-grain min-h-screen">
      <header className="mx-auto max-w-5xl px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl text-lg font-bold text-white chroma-gradient">
              C
            </span>
            <span className="text-xl font-bold tracking-tight">CHROMA</span>
          </div>
          <span className="rounded-full border border-brand/30 bg-white px-3 py-1 text-xs font-medium text-brand-dark">
            Hair Transformation Copilot
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 pb-24">
        <Hero />

        {!image && !hydrated && <div className="h-24" />}
        {!image && hydrated && <UploadCard />}

        {image && !analysis && (
          <div className="flex flex-col items-center gap-4 py-8">
            <img src={image} alt="Your selfie" className="h-56 w-auto rounded-2xl object-cover shadow-lg" />
            <p className="text-sm text-muted">Analysis in progress — reading your skin tone & hair profile…</p>
          </div>
        )}

        {image && analysis && (
          <>
            <Profile />
            <Palette />
            <Preferences />
            <Recommendations />
            <TryOnStudio />
            <StyleStudio />
          </>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs text-muted">
        <p>CHROMA — built on the YouCam AI Beauty API for the YouCam AI Hackathon.</p>
        <p className="mt-1">Try-on renders your own photo. Nothing is stored on our servers.</p>
      </footer>
    </div>
  )
}

export default App
