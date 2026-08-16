import { readFileSync } from 'node:fs'
const BASE = 'https://yce-api-01.makeupar.com'
const env = readFileSync('.env', 'utf-8')
const KEY = env.match(/YOUCAM_API_KEY=(.*)/)?.[1]?.trim()
const AUTH = { Authorization: `Bearer ${KEY}` }
async function jf(url, init = {}) { const r = await fetch(url, init); const t = await r.text(); let d; try { d = JSON.parse(t) } catch { d = { raw: t.slice(0, 300) } }; return { ok: r.ok, d } }
const buf = readFileSync('scripts/samples/face-1.jpg')
const { d: up } = await jf(`${BASE}/s2s/v2.0/file/hair-bang`, { method: 'POST', headers: { ...AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify({ files: [{ content_type: 'image/jpeg', file_name: 'face.jpg', file_size: buf.length }] }) })
const f = up.data.files[0]; await fetch(f.requests[0].url, { method: 'PUT', headers: f.requests[0].headers, body: buf })
const body = { src_file_id: f.file_id, template_id: 'female_wispy_bangs' }
const { d: task } = await jf(`${BASE}/s2s/v2.0/task/hair-bang`, { method: 'POST', headers: { ...AUTH, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
console.log('task:', JSON.stringify(task).slice(0, 150))
if (!task?.data?.task_id) { console.log('BODY:', JSON.stringify(task)); process.exit(1) }
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 2500))
  const { d } = await jf(`${BASE}/s2s/v2.0/task/hair-bang/${task.data.task_id}`, { headers: AUTH })
  if (d.data?.task_status === 'success') { console.log('RESULT URL:', (d.data.results?.url ?? '').slice(0, 60)); process.exit(0) }
  if (d.data?.task_status === 'error') { console.log('ERR:', JSON.stringify(d.data)); process.exit(1) }
}
