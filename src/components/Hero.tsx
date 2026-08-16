export function Hero() {
  return (
    <section className="chroma-gradient chroma-card relative overflow-hidden px-6 py-12 text-center sm:px-12">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#7c5cff]/10 blur-2xl" />
      <div className="relative">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">
          One selfie · Three steps
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Your hair color,
          <br />
          <span className="text-brand">scientifically matched.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
          CHROMA reads your skin tone and hair profile, ranks the colors that
          flatter you, then lets you try them on your own photo — with real
          upkeep costs before you commit.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="rounded-full bg-white px-3 py-1 font-medium">Powered by YouCam AI Beauty API</span>
          <span className="rounded-full bg-white px-3 py-1 font-medium">Try-on on your own photo</span>
          <span className="rounded-full bg-white px-3 py-1 font-medium">Ranks get smarter as you rate</span>
        </div>
      </div>
    </section>
  )
}
