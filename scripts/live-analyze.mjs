import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const BASE = 'https://yce-api-01.makeupar.com'
const env = readFileSync('.env', 'utf-8')
const KEY = env.match(/YOUCAM_API_KEY=(.*)/)?.[1]?.trim()
const AUTH = { Authorization: `Bearer ${KEY}` }
async function jf(url, init = {}) { const r = await fetch(url, init); const t = await r.text(); let d; try { d = JSON.parse(t) } catch { d = { raw: t.slice(0, 300) } }; return { ok: r.ok, d } }
const buf = readFileSync('scripts/samples/face-1.jpg')
const { d: up } = await jf(`${BASE}/s2s/v2.0/file/skin-tone-analysis`, { method: 'POST', headers: { ...AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ files: [{ content_type: 'image/jpeg', file_name: 'face.jpg', file_size: buf.length }] }) })
const f = up.data.files[0]; const req = f.requests[0]
await fetch(req.url, { method: 'PUT', headers: req.headers, body: buf })
const { d: task } = await jf(`${BASE}/s2s/v2.0/task/skin-tone-analysis`, { method: 'POST', headers: { ...AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ src_file_id: f.file_id, face_angle_strictness_level: 'flexible' }) })
console.log('task:', JSON.stringify(task).slice(0, 200))
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 2500))
  const { d } = await jf(`${BASE}/s2s/v2.0/task/skin-tone-analysis/${task.data.task_id}`, { headers: AUTH })
  if (d.data?.task_status === 'success') { console.log('RESULT:', JSON.stringify(d.data.results).slice(0, 400)); process.exit(0) }
  if (d.data?.task_status === 'error') { console.log('ERR:', JSON.stringify(d.data)); process.exit(1) }
}
