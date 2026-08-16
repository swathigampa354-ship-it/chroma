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

export async function analyze(image: string): Promise<AnalyzeResult> {
  const res = await fetch(PROXY_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'analyze', image }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`analyze failed (${res.status})`)
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
