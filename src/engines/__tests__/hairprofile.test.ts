import { describe, it, expect } from 'vitest'
import { buildHairProfile, detectTexture, detectFrizz, lengthScore } from '../hairprofile'

describe('detectTexture', () => {
  it('detects straight', () => {
    expect(detectTexture('straight', 'straight')).toBe('straight')
  })
  it('detects wavy', () => {
    expect(detectTexture('wavy', 'wavy')).toBe('wavy')
  })
  it('detects curly', () => {
    expect(detectTexture('curly', 'curly')).toBe('curly')
  })
  it('detects coily', () => {
    expect(detectTexture('coily', 'coily')).toBe('coily')
  })
  it('falls back to wavy', () => {
    expect(detectTexture(undefined, undefined)).toBe('wavy')
  })
})

describe('detectFrizz', () => {
  it('maps numeric mapping', () => {
    expect(detectFrizz(80)).toBe('high')
    expect(detectFrizz(50)).toBe('medium')
    expect(detectFrizz(10)).toBe('low')
  })
  it('parses terms', () => {
    expect(detectFrizz(undefined, 'High frizz')).toBe('high')
  })
})

describe('lengthScore', () => {
  it('scores known terms', () => {
    expect(lengthScore('above the ears')).toBe(1)
    expect(lengthScore('long')).toBe(3)
    expect(lengthScore('very short')).toBe(0)
  })
})

describe('buildHairProfile', () => {
  it('long + curly + low frizz → recommends style/bangs, high volume', () => {
    const p = buildHairProfile({ lengthTerm: 'long', typeMapping: 'curly', frizzMapping: 10 })
    expect(p.lengthScore).toBe(3)
    expect(p.texture).toBe('curly')
    expect(p.volumePotential).toBeGreaterThan(70)
    expect(p.recommended).toContain('hair-style')
  })
  it('short + straight + high frizz → volume/extensions', () => {
    const p = buildHairProfile({ lengthTerm: 'above the ears', typeMapping: 'straight', frizzMapping: 90 })
    expect(p.recommended).toContain('hair-vol')
    expect(p.frizz).toBe('high')
  })
  it('colorHold drops for curly texture', () => {
    const straight = buildHairProfile({ typeMapping: 'straight' })
    const curly = buildHairProfile({ typeMapping: 'curly' })
    expect(curly.colorHold).toBeLessThan(straight.colorHold)
  })
})
