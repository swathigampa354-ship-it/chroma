// ---------------------------------------------------------------------------
// CHROMA hair profile engine — interprets YouCam hair detection outputs
// into an actionable personal hair profile + style guidance.
// Pure functions, deterministic, unit-testable.
// ---------------------------------------------------------------------------

export type HairLengthTerm = 'very short' | 'short' | 'above the ears' | 'shoulder length' | 'medium' | 'long' | 'very long' | string
export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily'
export type FrizzLevel = 'low' | 'medium' | 'high'

export interface HairProfileInput {
  /** hair-length-detection term, e.g. "above the ears" */
  lengthTerm?: HairLengthTerm
  /** hair-type-detection mapping/term */
  typeMapping?: string
  typeTerm?: string
  /** hair-frizziness-detection mapping (number) */
  frizzMapping?: number
  frizzTerm?: string
}

export interface HairProfile {
  length: string
  /** estimated length category 0-3 (0=very short .. 3=long) */
  lengthScore: number
  texture: HairTexture
  frizz: FrizzLevel
  /** 0-100 volume potential based on texture */
  volumePotential: number
  /** 0-100 how well the hair holds color/fashion shades */
  colorHold: number
  /** recommended style features */
  recommended: string[]
  /** warnings / care notes */
  notes: string[]
}

const LENGTH_ORDER: [string, number][] = [
  ['very long', 3],
  ['very short', 0],
  ['long', 3],
  ['medium', 2],
  ['shoulder length', 2],
  ['above the ears', 1],
  ['short', 1],
]

const TEXTURE_SCORE: Record<HairTexture, { volume: number; hold: number }> = {
  straight: { volume: 40, hold: 75 },
  wavy: { volume: 60, hold: 65 },
  curly: { volume: 80, hold: 50 },
  coily: { volume: 90, hold: 40 },
}

function norm(term?: string): string {
  return (term ?? '').toLowerCase().trim()
}

export function detectTexture(mapping?: string, term?: string): HairTexture {
  const t = norm(mapping || term || '')
  if (t.includes('curly') || t.includes('wave')) return 'curly'
  if (t.includes('coil') || t.includes('kink') || t.includes('afro')) return 'coily'
  if (t.includes('straight')) return 'straight'
  if (t.includes('wavy') || t.includes('wave')) return 'wavy'
  return 'wavy'
}

export function detectFrizz(mapping?: number, term?: string): FrizzLevel {
  if (mapping != null) {
    if (mapping > 66) return 'high'
    if (mapping > 33) return 'medium'
    return 'low'
  }
  const t = norm(term)
  if (t.includes('high')) return 'high'
  if (t.includes('medium')) return 'medium'
  return 'low'
}

export function lengthScore(term?: HairLengthTerm): number {
  const t = norm(term)
  for (const [label, score] of LENGTH_ORDER) {
    if (t.includes(label) || (label === 'short' && (t.includes('ear') || t === 'short'))) return score
  }
  if (t) return 2 // default medium if we got an unknown term
  return 1
}

export function buildHairProfile(input: HairProfileInput): HairProfile {
  const texture = detectTexture(input.typeMapping, input.typeTerm)
  const frizz = detectFrizz(input.frizzMapping, input.frizzTerm)
  const length = input.lengthTerm ? input.lengthTerm.toLowerCase() : 'medium'
  const ls = lengthScore(input.lengthTerm)
  const { volume, hold } = TEXTURE_SCORE[texture]

  const recommended: string[] = []
  const notes: string[] = []

  if (ls <= 1) {
    recommended.push('hair-vol', 'hair-ext')
    notes.push('Short styles: try volume & extensions to add movement')
  } else if (ls === 2) {
    recommended.push('hair-bang', 'hair-curl')
    notes.push('Medium length: bangs or soft curls reshape the frame instantly')
  } else {
    recommended.push('hair-style', 'hair-bang')
    notes.push('Long hair: full style transform or face-framing bangs')
  }

  if (frizz === 'high') {
    recommended.push('hair-curl')
    notes.push('High frizz: define curls or go smoothing; avoid bone-straight looks')
  }

  if (texture === 'coily' || texture === 'curly') {
    notes.push('Curly/coily texture holds fashion colors with a pre-lightening plan')
  }

  if (hold < 55) {
    notes.push('Vibrant pastels will fade fast — budget a gloss at week 4')
  }

  return {
    length,
    lengthScore: ls,
    texture,
    frizz,
    volumePotential: volume,
    colorHold: hold,
    recommended: [...new Set(recommended)],
    notes,
  }
}
