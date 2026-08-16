// ---------------------------------------------------------------------------
// CHROMA palette engine — deterministic color science.
// Maps skin tone + undertone -> a ranked personal hair-color palette.
// Pure functions, fully unit-testable.
// ---------------------------------------------------------------------------

export type Undertone = 'warm' | 'cool' | 'neutral'

export interface SkinTone {
  /** #rrggbb from YouCam skin-tone-analysis */
  hex: string
  undertone?: Undertone
}

export interface HairColor {
  name: string
  hex: string
  /** 0-100 how well this color suits the skin tone (score) */
  suitability: number
  /** 1-10 vibrancy / how much upkeep the look demands */
  vibrancy: number
  /** weekly maintenance cost in USD (color + product) */
  upkeepCost: number
  /** weeks between root touch-ups */
  fadeWeeks: number
  /** 'full' | 'ombre' | 'highlight' application mode for VTO */
  application: 'full' | 'ombre' | 'highlight'
  /** preset name for the YouCam hair-color VTO API */
  preset: string
  /** palette hex (1 for full, 2 for ombre) for custom VTO */
  palette: string[]
  reason: string
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

// ---- hex math ----
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  if (h.length === 3) return [h[0] + h[0], h[1] + h[1], h[2] + h[2]].map((x) => parseInt(x, 16)) as [number, number, number]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Relative luminance 0-1 */
export function relLuminance(hex: string): number {
  return luminance(hexToRgb(hex))
}

/** Skin brightness 0-100 (perceived) */
export function skinLightness(hex: string): number {
  return clamp(Math.round(relLuminance(hex) * 100 * 1.2))
}

/** Warm vs cool estimate from RGB ratios (used when undertone not provided) */
export function detectUndertone(hex: string): Undertone {
  const [r, g, b] = hexToRgb(hex)
  // warm: red/yellow dominant; cool: blue dominant
  const warmth = r + g - 2 * b
  if (warmth > 40) return 'warm'
  if (warmth < -40) return 'cool'
  return 'neutral'
}

/** Delta-E (simplified CIE76 in RGB space) — lower = closer */
export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2))
}

// ---- hair color catalog (curated, all YouCam hair-color presets) ----
export const HAIR_CATALOG: Omit<HairColor, 'suitability' | 'reason' | 'palette'>[] = [
  { name: 'Jet Black', hex: '#1b1a1f', vibrancy: 1, upkeepCost: 14, fadeWeeks: 6, application: 'full', preset: 'Jet Black' },
  { name: 'Chocolate Brown', hex: '#46302a', vibrancy: 2, upkeepCost: 10, fadeWeeks: 8, application: 'full', preset: 'Chocolate Brown' },
  { name: 'Honey Blonde', hex: '#c59a62', vibrancy: 6, upkeepCost: 26, fadeWeeks: 5, application: 'full', preset: 'Honey Blonde' },
  { name: 'Platinum Blonde', hex: '#e8ddc5', vibrancy: 8, upkeepCost: 34, fadeWeeks: 4, application: 'full', preset: 'Platinum Blonde' },
  { name: 'Ash Gray', hex: '#9a9aa0', vibrancy: 7, upkeepCost: 30, fadeWeeks: 4, application: 'full', preset: 'Ash Gray' },
  { name: 'Rose Gold', hex: '#e3a3a5', vibrancy: 9, upkeepCost: 32, fadeWeeks: 4, application: 'full', preset: 'Rose Gold' },
  { name: 'Burgundy', hex: '#6e2438', vibrancy: 7, upkeepCost: 22, fadeWeeks: 6, application: 'full', preset: 'Burgundy' },
  { name: 'Copper Red', hex: '#b04a2e', vibrancy: 7, upkeepCost: 20, fadeWeeks: 5, application: 'full', preset: 'Copper Red' },
  { name: 'Lavender', hex: '#b3a7d9', vibrancy: 9, upkeepCost: 36, fadeWeeks: 3, application: 'full', preset: 'Lavender' },
  { name: 'Teal Blue', hex: '#1d8a97', vibrancy: 9, upkeepCost: 36, fadeWeeks: 3, application: 'full', preset: 'Teal Blue' },
  { name: 'Caramel Ombre', hex: '#8a5a35', vibrancy: 5, upkeepCost: 18, fadeWeeks: 8, application: 'ombre', preset: 'Dark Brown/Caramel Blonde' },
  { name: 'Silver Ombre', hex: '#6a6a72', vibrancy: 6, upkeepCost: 28, fadeWeeks: 6, application: 'ombre', preset: 'Jet Black/Silver Gray' },
  { name: 'Lilac Ombre', hex: '#7a6fa8', vibrancy: 8, upkeepCost: 32, fadeWeeks: 5, application: 'ombre', preset: 'Ash Brown/Lavender' },
  { name: 'Peach Ombre', hex: '#c98f8a', vibrancy: 8, upkeepCost: 30, fadeWeeks: 5, application: 'ombre', preset: 'Rose Gold/Peach Blonde' },
  { name: 'Magenta Ombre', hex: '#8f2f4e', vibrancy: 9, upkeepCost: 32, fadeWeeks: 4, application: 'ombre', preset: 'Burgundy/Magenta Pink' },
  { name: 'Teal Ombre', hex: '#1f6d80', vibrancy: 9, upkeepCost: 32, fadeWeeks: 4, application: 'ombre', preset: 'Deep Blue/Teal Green' },
]

/** how well a hair color suits a skin tone (0-100) */
export function suitabilityFor(hairHex: string, skin: SkinTone, undertone: Undertone): number {
  const hl = relLuminance(hairHex)
  const sl = relLuminance(skin.hex)
  const lightnessGap = Math.abs(hl - sl) * 100

  let score = 100

  // classic guidance: very light skin -> avoid pitch dark; deep skin -> dark tones look rich
  if (sl > 0.55 && hl < 0.05) score -= 18
  if (sl < 0.12 && hl > 0.85) score -= 14

  // warm skin: warm hair colors (+copper/red/gold/brown); cool skin: ash/platinum/burgundy/cool tints
  const [hr, hg, hb] = hexToRgb(hairHex)
  const hairWarmth = hr + hg - 2 * hb
  if (undertone === 'warm' && hairWarmth < -20) score -= 12
  if (undertone === 'cool' && hairWarmth > 40) score -= 12
  if (undertone === 'warm' && hairWarmth > 80) score += 10
  if (undertone === 'cool' && hairWarmth < -30) score += 10

  // extreme vibrancy on very fair skin reads harsh
  if (sl > 0.6 && (hairHex === '#b3a7d9' || hairHex === '#1d8a97' || hairHex === '#e3a3a5')) score -= 8

  // dark skintones carry bold colors exceptionally well
  if (sl < 0.18 && hairWarmth > 30) score += 8

  // medium contrast ideal; extremely close to skin reads washed out
  if (lightnessGap < 6) score -= 15

  return clamp(Math.round(score))
}

export function reasonFor(undertone: Undertone, score: number): string {
  const warm = undertone === 'warm'
  if (score > 85) return warm ? 'Warm undertones make this color glow on you' : 'Cool undertones let this color pop'
  if (score > 70) return 'A versatile, low-risk pick for your tone'
  if (score > 55) return 'Worth a virtual try-on before committing'
  return 'High contrast — best as an accent or ombre'
}

/**
 * Rank the full catalog for a skin tone.
 * @param limit number of colors to return (default all)
 */
export function buildPalette(skin: SkinTone, limit?: number): HairColor[] {
  const undertone = skin.undertone ?? detectUndertone(skin.hex)
  const colors: HairColor[] = HAIR_CATALOG.map((c) => {
    const suit = suitabilityFor(c.hex, skin, undertone)
    // ombre presets have 2 palette hexes
    const palette = c.application === 'ombre' ? [skin.hex, c.hex] : [c.hex]
    return {
      ...c,
      palette,
      suitability: suit,
      reason: reasonFor(undertone, suit),
    }
  })
  return colors.sort((a, b) => b.suitability - a.suitability).slice(0, limit ?? colors.length)
}

/** Top-N personal palette for UI */
export function topPalette(skin: SkinTone, n = 6): HairColor[] {
  return buildPalette(skin, n)
}

/** Nearest named preset to an arbitrary hex (e.g. for user-picked colors) */
export function nearestPreset(hex: string): string {
  let best = HAIR_CATALOG[0]
  let bestD = Infinity
  for (const c of HAIR_CATALOG) {
    const d = colorDistance(c.hex, hex)
    if (d < bestD) { bestD = d; best = c }
  }
  return best.preset
}
