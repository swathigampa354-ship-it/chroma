import { describe, it, expect } from 'vitest'
import {
  hexToRgb, relLuminance, skinLightness, detectUndertone, colorDistance,
  buildPalette, topPalette, suitabilityFor, nearestPreset,
} from '../palette'

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
  })
  it('parses 3-digit hex', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255])
  })
})

describe('color science', () => {
  it('black is dark, white is light', () => {
    expect(relLuminance('#000000')).toBeLessThan(0.01)
    expect(relLuminance('#ffffff')).toBeGreaterThan(0.9)
  })
  it('skinLightness is in 0..100', () => {
    expect(skinLightness('#b08d76')).toBeGreaterThan(0)
    expect(skinLightness('#b08d76')).toBeLessThanOrEqual(100)
  })
  it('detectUndertone: warm skin', () => {
    expect(detectUndertone('#c9805a')).toBe('warm')
  })
  it('detectUndertone: cool skin', () => {
    expect(detectUndertone('#8ba8c9')).toBe('cool')
  })
  it('colorDistance: identical is 0', () => {
    expect(colorDistance('#aabbcc', '#aabbcc')).toBe(0)
  })
})

describe('suitabilityFor', () => {
  it('returns 0..100', () => {
    const s = suitabilityFor('#46302a', { hex: '#b08d76' }, 'warm')
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(100)
  })
  it('warm skin prefers warm hair', () => {
    const warm = suitabilityFor('#b04a2e', { hex: '#c9805a' }, 'warm')
    const cool = suitabilityFor('#9a9aa0', { hex: '#c9805a' }, 'warm')
    expect(warm).toBeGreaterThan(cool)
  })
})

describe('buildPalette', () => {
  it('ranks catalog by suitability, descending', () => {
    const p = buildPalette({ hex: '#b08d76', undertone: 'warm' })
    for (let i = 1; i < p.length; i++) {
      expect(p[i - 1].suitability).toBeGreaterThanOrEqual(p[i].suitability)
    }
  })
  it('topPalette respects limit', () => {
    expect(topPalette({ hex: '#b08d76' }, 4)).toHaveLength(4)
  })
  it('every color has a preset and palette hexes', () => {
    for (const c of buildPalette({ hex: '#b08d76' })) {
      expect(c.preset).toBeTruthy()
      expect(c.palette.length).toBeGreaterThan(0)
      expect(c.palette[0]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
  it('dark skin boosts bold warm colors', () => {
    const dark = buildPalette({ hex: '#4a2f2a' }, 20)
    const copper = dark.find((c) => c.name === 'Copper Red')
    expect(copper && copper.suitability).toBeGreaterThan(50)
  })
})

describe('nearestPreset', () => {
  it('maps exact catalog hex to its preset', () => {
    expect(nearestPreset('#46302a')).toBe('Chocolate Brown')
  })
})
