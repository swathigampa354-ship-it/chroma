// ---------------------------------------------------------------------------
// CHROMA — YouCam proxy client (browser side).
// All calls go through /api/youcam (Vercel function). The API key never
// leaves the server. Verified live: hair-color 1u, skin-tone 20u, hair-length 2u.
// ---------------------------------------------------------------------------

export interface AnalyzeResult {
  demo?: boolean
  skin_tone?: string
  eye_color?: string
  lip_color?: string
  eyebrow_color?: string
  hair_length?: string
  face_quality?: { has_face: boolean; area: string; frontal: string; lighting: string; faceangle: string }
}

export interface TryOnResult {
  demo?: boolean
  url: string | null
  feature: string
}

// A stylized front-facing selfie used by the one-click demo. Rendered entirely
// client-side so the whole flow works on static hosts (GitHub Pages) with no API.
export const DEMO_SELFIE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<rect width="640" height="480" fill="#fdf6f0"/>
<rect x="0" y="440" width="640" height="40" fill="#efe0cc"/>
<path d="M140 480 V370 Q140 250 320 250 Q500 250 500 370 V480 Z" fill="#c68863"/>
<path d="M140 300 Q140 120 320 120 Q500 120 500 300 Q500 215 470 205 Q485 150 430 165 Q420 100 320 112 Q220 100 210 165 Q155 150 170 205 Q140 215 140 300 Z" fill="#4a3525"/>
<ellipse cx="258" cy="345" rx="28" ry="13" fill="#3a2a1e"/>
<ellipse cx="382" cy="345" rx="28" ry="13" fill="#3a2a1e"/>
<path d="M298 380 Q320 394 342 380" stroke="#8d5a3b" stroke-width="6" fill="none" stroke-linecap="round"/>
<ellipse cx="320" cy="342" rx="8" ry="10" fill="#8d5a3b"/>
<ellipse cx="312" cy="339" rx="3" ry="4" fill="#fff"/>
<ellipse cx="328" cy="339" rx="3" ry="4" fill="#fff"/>
<path d="M258 414 Q320 440 382 414" stroke="#a96f4e" stroke-width="7" fill="none" stroke-linecap="round"/>
<rect x="96" y="430" width="176" height="90" rx="26" fill="#dcc1a6"/>
<rect x="368" y="430" width="176" height="90" rx="26" fill="#dcc1a6"/>
<path d="M320 92 L340 30 L320 8 L300 30 Z" fill="#e86a8f"/>
</svg>`,
  )

export interface TemplateItem {
  id: string
  title: string
  category_name: string
  thumb: string | null
}

const PROXY_BASE = '/api/youcam'

export const UNIT_COST = {
  'hair-color': 1,
  'skin-tone-analysis': 20,
  'hair-length-detection': 2,
} as const

function demoHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const DEMO_SKINS = ['#f1c5a0', '#c68863', '#8d5a3b', '#5b3a29']
const DEMO_LENGTHS = ['above the ears', 'at the chin', 'at the shoulders', 'below the shoulders', 'at the waist']

// Deterministic local scan used when the API-backed proxy is unreachable
// (static hosting). Mirrors the shape returned by the real endpoint.
export function demoAnalyze(image: string): AnalyzeResult {
  const h = demoHash(image)
  const skin_tone = DEMO_SKINS[h % DEMO_SKINS.length]
  return {
    demo: true,
    skin_tone,
    eye_color: h % 2 ? '#4a3525' : '#3a2a1e',
    lip_color: '#b86b5e',
    eyebrow_color: '#3a2a1e',
    hair_length: DEMO_LENGTHS[h % DEMO_LENGTHS.length],
    face_quality: { has_face: true, area: 'good', frontal: 'good', lighting: 'good', faceangle: 'frontal' },
  }
}

export async function analyze(image: string): Promise<AnalyzeResult> {
  let res: Response
  try {
    res = await fetch(PROXY_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'analyze', image }),
      signal: AbortSignal.timeout(120000),
    })
  } catch {
    return demoAnalyze(image)
  }
  if (!res.ok) return demoAnalyze(image)
  return res.json()
}

export async function tryOn(
  image: string,
  feature: string,
  params: { preset?: string; palettes?: { color: string }[]; template_id?: string },
): Promise<TryOnResult> {
  const res = await fetch(PROXY_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'tryon', image, feature, ...params }),
    signal: AbortSignal.timeout(180000),
  })
  if (!res.ok) throw new Error(`tryon failed (${res.status})`)
  return res.json()
}

export async function fetchTemplates(feature: string): Promise<TemplateItem[]> {
  const res = await fetch(`${PROXY_BASE}?action=templates&feature=${feature}`, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`templates failed (${res.status})`)
  const json = (await res.json()) as { templates?: TemplateItem[] }
  return json.templates ?? []
}

// ---- image prep (client-side crop to 640×480 center — SD rule from prior projects) ----
export function prepareImage(file: File | Blob, w = 640, h = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.max(w / img.width, h / img.height) * 1.15
      const sw = w / scale
      const sh = h / scale
      const sx = (img.width - sw) / 2
      const sy = (img.height - sh) * 0.35
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}
