// ---------------------------------------------------------------------------
// CHROMA live probe — verifies hair APIs against the real YouCam API.
// Measures actual unit consumption (credit before/after).
// Usage: node scripts/probe.mjs <feature> [facePath]
//   features: hair-color | skin-tone | hair-length | hair-type | hair-style
// ---------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(ROOT, '.env'), 'utf-8');
const KEY = (env.match(/YOUCAM_API_KEY=(.*)/)?.[1] ?? '').trim();
const BASE = 'https://yce-api-01.makeupar.com';
const AUTH = { Authorization: `Bearer ${KEY}` };

const feature = process.argv[2] ?? 'hair-color';
const facePath = process.argv[3] ?? join(ROOT, 'scripts/samples/face-1.jpg');
const step = (s) => console.log(`\n=== ${s} ===`);

async function jfetch(url, init = {}) {
  const r = await fetch(url, init);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text.slice(0, 500) }; }
  return { status: r.status, ok: r.ok, data };
}

async function credit() {
  const { data } = await jfetch(`${BASE}/s2s/v1.0/client/credit`, { headers: AUTH });
  const totals = (data?.results ?? []).reduce((a, c) => a + (c.amount_dec ?? 0), 0);
  return totals;
}

async function upload(filePath, slug) {
  step(`Upload → /file/${slug}`);
  const buf = readFileSync(filePath);
  const contentType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const fileName = filePath.split('/').pop();
  const { status, ok, data } = await jfetch(`${BASE}/s2s/v2.0/file/${slug}`, {
    method: 'POST',
    headers: { ...AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [{ content_type: contentType, file_name: fileName, file_size: buf.length }] }),
  });
  console.log(`POST → HTTP ${status}`);
  if (!ok) throw new Error('upload failed: ' + JSON.stringify(data).slice(0, 300));
  const file = data.data.files[0];
  const up = file.requests[0];
  console.log(`file_id: ${file.file_id.slice(0, 24)}…`);
  const put = await fetch(up.url, { method: up.method || 'PUT', headers: up.headers, body: buf });
  console.log(`PUT bytes → HTTP ${put.status}`);
  if (!put.ok) throw new Error('S3 upload failed');
  return file.file_id;
}

async function runTask(slug, body, timeoutMs = 180000) {
  step(`Task POST /task/${slug}`);
  const { status, ok, data } = await jfetch(`${BASE}/s2s/v2.0/task/${slug}`, {
    method: 'POST',
    headers: { ...AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log(`POST → HTTP ${status}`);
  if (!ok) { console.log('BODY:', JSON.stringify(data, null, 2).slice(0, 800)); throw new Error('task create failed'); }
  const taskId = data.data?.task_id ?? data.result?.task_id ?? data.task_id;
  console.log(`task_id: ${taskId.slice(0, 24)}…`);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await jfetch(`${BASE}/s2s/v2.0/task/${slug}/${taskId}`, { headers: AUTH });
    const d = r.data?.data ?? r.data ?? r.data;
    const st = d?.task_status ?? d?.status;
    if (st === 'success') {
      console.log(`poll → SUCCESS (${Math.round((Date.now() - start) / 1000)}s)`);
      return r.data;
    }
    if (st === 'error' || st === 'failed') {
      console.log('poll → ERROR');
      return r.data;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('poll timeout');
}

// ---- main ----
const before = await credit();
console.log(`\nUnits BEFORE: ${before}`);

let res;
switch (feature) {
  case 'hair-color': {
    const fid = await upload(facePath, 'hair-color');
    res = await runTask('hair-color', { src_file_id: fid, preset: 'Rose Gold' });
    break;
  }
  case 'skin-tone': {
    const fid = await upload(facePath, 'skin-tone-analysis');
    res = await runTask('skin-tone-analysis', { src_file_id: fid, face_angle_strictness_level: 'flexible' });
    break;
  }
  case 'hair-length': {
    const fid = await upload(facePath, 'hair-length-detection');
    res = await runTask('hair-length-detection', { src_file_id: fid });
    break;
  }
  case 'hair-type': {
    const f1 = await upload(facePath, 'hair-type-detection');
    const f2 = await upload(facePath, 'hair-type-detection');
    const f3 = await upload(facePath, 'hair-type-detection');
    res = await runTask('hair-type-detection', { src_file_ids: [f1, f2, f3] });
    break;
  }
  default:
    console.error('unknown feature: ' + feature);
    process.exit(1);
}

const after = await credit();
console.log(`\nUnits AFTER: ${after}`);
console.log(`\n--- CONSUMED: ${(before - after).toFixed(2)} units ---`);
console.log('\n--- FULL RESPONSE ---');
console.log(JSON.stringify(res, null, 2).slice(0, 6000));
