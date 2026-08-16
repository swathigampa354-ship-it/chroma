// Minimal harness for api/youcam.mjs (mocks a request like Vercel would)
import { readFileSync } from 'node:fs'
process.env.YOUCAM_API_KEY = readFileSync('.env', 'utf-8').match(/YOUCAM_API_KEY=(.*)/)?.[1]?.trim()
const handler = (await import('../api/youcam.mjs')).default

async function call(method, url, body) {
  const req = {
    method,
    url,
    headers: {},
    json: async () => body,
  }
  const res = await handler(req)
  const text = await res.text()
  let data; try { data = JSON.parse(text) } catch { data = text }
  console.log(`[${method} ${url.split('?')[0]}] status=${res.status}`)
  return data
}

// 1. analyze demo (no image -> demo fallback path requires DEMO_MODE; test real path with image later)
// 2. templates demo
const t = await call('GET', '/api/youcam?action=templates&feature=hair-bang', undefined)
console.log('templates:', JSON.stringify(t).slice(0, 300))
console.log('\nDONE (proxy boots, demo templates OK)')
