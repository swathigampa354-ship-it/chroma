// ---------------------------------------------------------------------------
// CHROMA retail engine — deterministic product + upkeep recommendations.
// Curated catalog of salons/retail matches per hair color with costs.
// ---------------------------------------------------------------------------

export interface RetailItem {
  name: string
  brand: string
  price: number
  category: 'dye' | 'gloss' | 'toner' | 'care' | 'styling'
  url: string
}

export interface UpkeepPlan {
  colorName: string
  rootTouchUpWeeks: number
  glossWeeks: number
  annualCost: number
  steps: string[]
  retail: RetailItem[]
}

const RETAIL: Record<string, RetailItem[]> = {
  JetBlack: [
    { name: 'Permanent Black Hair Dye', brand: 'L’Oréal Paris', price: 12, category: 'dye', url: '#' },
    { name: 'Gloss Black Toner', brand: 'Redken', price: 18, category: 'toner', url: '#' },
  ],
  ChocolateBrown: [
    { name: 'Brunette Conditioning Dye', brand: 'Garnier', price: 10, category: 'dye', url: '#' },
    { name: 'Color Care Shampoo', brand: 'Olaplex', price: 28, category: 'care', url: '#' },
  ],
  HoneyBlonde: [
    { name: 'Blonde Balayage Kit', brand: 'L’Oréal Paris', price: 20, category: 'dye', url: '#' },
    { name: 'Purple Toner', brand: 'Fanola', price: 15, category: 'toner', url: '#' },
  ],
  PlatinumBlonde: [
    { name: 'Platinum Bleach Kit', brand: 'Schwarzkopf', price: 24, category: 'dye', url: '#' },
    { name: 'Silver Shampoo', brand: 'Fanola', price: 16, category: 'toner', url: '#' },
  ],
  AshGray: [
    { name: 'Smokey Ash Dye', brand: 'Wella', price: 18, category: 'dye', url: '#' },
    { name: 'Cool-Tone Gloss', brand: 'Redken', price: 19, category: 'gloss', url: '#' },
  ],
  RoseGold: [
    { name: 'Rose Gold Semi-Permanent', brand: 'Arctic Fox', price: 16, category: 'dye', url: '#' },
    { name: 'Pink Deposit Mask', brand: 'Keracolor', price: 14, category: 'care', url: '#' },
  ],
  Burgundy: [
    { name: 'Burgundy Permanent Dye', brand: 'L’Oréal Paris', price: 12, category: 'dye', url: '#' },
    { name: 'Color-Deposit Conditioner', brand: 'Keracolor', price: 14, category: 'care', url: '#' },
  ],
  CopperRed: [
    { name: 'Copper Red Dye', brand: 'L’Oréal Paris', price: 12, category: 'dye', url: '#' },
    { name: 'Red Boosting Shampoo', brand: 'Redken', price: 22, category: 'care', url: '#' },
  ],
}

const DEFAULT_RETAIL: RetailItem[] = [
  { name: 'Color Care Shampoo', brand: 'Olaplex', price: 28, category: 'care', url: '#' },
  { name: 'Heat Protectant', brand: 'TRESemmé', price: 9, category: 'styling', url: '#' },
]

export function buildUpkeepPlan(colorName: string, fadeWeeks: number, upkeepCost: number): UpkeepPlan {
  const retail = RETAIL[colorName] ?? DEFAULT_RETAIL
  const rootTouchUps = Math.ceil(52 / Math.max(2, fadeWeeks))
  const glosses = colorName.match(/Platinum|Ash|Rose|Lavender|Teal/) ? 12 : 4
  const annualCost = Math.round(rootTouchUps * upkeepCost + glosses * 8)
  const steps = [
    `Root touch-up every ${fadeWeeks} weeks (${rootTouchUps}×/yr)`,
    `Gloss / deposit mask ${glosses}×/yr to keep ${colorName} from fading`,
    'Use sulfate-free color-safe shampoo',
    'Heat protectant before any styling tool',
  ]
  return { colorName, rootTouchUpWeeks: fadeWeeks, glossWeeks: glosses, annualCost, steps, retail }
}
