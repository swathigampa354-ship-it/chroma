// ---------------------------------------------------------------------------
// CHROMA YouCam API proxy — Vercel serverless.
// Verifies v2 contracts (src_file_id/preset top-level, NOT payload/actions).
//
// Endpoints:
//   POST /api/youcam
//     { action: 'analyze', image: <base64 dataURL> }          -> skin-tone + hair-length + hair-type(optional)
//     { action: 'tryon', image, feature: 'hair-color', ... }  -> before/after result URL
//   GET  /api/youcam?action=templates&feature=hair-bang       -> template list
//
// Environment:
//   YOUCAM_API_KEY  (single)  or YOUCAM_API_KEYS (comma-separated, round-robin)
//   DEMO_MODE=1 forces the deterministic fallback (no API calls)
// ---------------------------------------------------------------------------
import { createHash } from 'node:crypto';

const BASE = 'https://yce-api-01.makeupar.com';
const DEMO = process.env.DEMO_MODE === '1' || !(process.env.YOUCAM_API_KEY || process.env.YOUCAM_API_KEYS);

export const config = { runtime: 'nodejs22' };

// ---- CORS ----
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const ok = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HEADERS });
const err = (message, status = 500, extra = {}) =>
  new Response(JSON.stringify({ ok: false, error: message, ...extra }), { status, headers: HEADERS });

// ---- key rotation ----
let cursor = 0;
function keyFor() {
  const keys = (process.env.YOUCAM_API_KEYS || process.env.YOUCAM_API_KEY || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (keys.length === 0) return '';
  const k = keys[cursor % keys.length];
  cursor += 1;
  return k;
}

async function jfetch(url, init = {}) {
  const r = await fetch(url, init);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text.slice(0, 500) }; }
  return { status: r.status, ok: r.ok, data };
}

// ---- upload ----
async function upload(apiKey, slug, buf, contentType, fileName) {
  const { status, ok, data } = await jfetch(`${BASE}/s2s/v2.0/file/${slug}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [{ content_type: contentType, file_name: fileName, file_size: buf.length }] }),
  });
  if (!ok) throw new Error(`upload ${slug} failed: ${JSON.stringify(data).slice(0, 300)}`);
  const file = data.data.files[0];
  const up = file.requests[0];
  const put = await fetch(up.url, { method: up.method || 'PUT', headers: up.headers, body: buf });
  if (!put.ok) throw new Error('presigned PUT failed');
  return file.file_id;
}

// ---- task + poll ----
async function runTask(apiKey, slug, body, timeoutMs = 180000) {
  const { status, ok, data } = await jfetch(`${BASE}/s2s/v2.0/task/${slug}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!ok) throw new Error(`task ${slug}: ${JSON.stringify(data).slice(0, 300)}`);
  const taskId = data.data?.task_id ?? data.result?.task_id ?? data.task_id;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await jfetch(`${BASE}/s2s/v2.0/task/${slug}/${taskId}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const d = r.data?.data ?? r.data;
    const st = d?.task_status ?? d?.status;
    if (st === 'success') return d;
    if (st === 'error' || st === 'failed') throw new Error(`task ${slug} error: ${d?.error || 'unknown'}`);
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error('poll timeout');
}

// ---- image decode ----
function decodeImage(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('image must be a base64 data URL');
  const contentType = m[1];
  const buf = Buffer.from(m[2], 'base64');
  const ext = contentType.split('/')[1] === 'png' ? 'png' : 'jpg';
  return { buf, contentType, ext };
}

// ---- demo fallback (deterministic, no API) ----
function demoSeeds(image) {
  const h = createHash('sha256').update(image || 'x').digest('hex');
  return parseInt(h.slice(0, 8), 16);
}
function demoAnalyze(image) {
  const s = demoSeeds(image);
  const tones = ['#b08d76', '#9a7260', '#8c5a48', '#c9a78e', '#7a5240'];
  const lens = ['short', 'medium', 'long'];
  return {
    demo: true,
    skin_tone: tones[s % tones.length],
    undertone: ['warm', 'cool', 'neutral'][s % 3],
    hair_length: lens[s % 3],
    hair_type: ['straight', 'wavy', 'curly', 'coily'][s % 4],
  };
}
function demoColors() {
  return [
    { name: 'Jet Black', hex: '#1a1714', cost: 8, upkeep: 'every 4-6 weeks', vibrancy: 5 },
    { name: 'Chocolate Brown', hex: '#4a2f22', cost: 12, upkeep: 'every 6-8 weeks', vibrancy: 4 },
    { name: 'Honey Blonde', hex: '#c9a26b', cost: 25, upkeep: 'every 4-5 weeks', vibrancy: 8 },
    { name: 'Rose Gold', hex: '#e0a49c', cost: 30, upkeep: 'every 3-4 weeks', vibrancy: 9 },
  ];
}

// ---------------------------------------------------------------------------
export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });

  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action') || (await req.json().catch(() => ({})))?.action;

  // templates listing
  if (action === 'templates') {
    const feature = url.searchParams.get('feature');
    if (!feature) return err('feature required', 400);
    if (DEMO) return ok({ demo: true, templates: [
      { id: 'demo_1', title: 'Classic Bob', category_name: 'Bob', thumb: null },
      { id: 'demo_2', title: 'Soft Layers', category_name: 'Layers', thumb: null },
    ] });
    const apiKey = keyFor();
    try {
      const { status, ok: tplOk, data } = await jfetch(`${BASE}/s2s/v2.0/task/template/${feature}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!tplOk) throw new Error(`templates ${feature}: HTTP ${status}`);
      return ok({ templates: data.data.templates ?? [], next_token: data.data.next_token ?? null });
    } catch (e) { return err(e.message, 502); }
  }

  // body-based actions
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const image = body.image;

  if (action === 'analyze') {
    if (DEMO) return ok(demoAnalyze(image || ''));
    if (!image) return err('image required', 400);
    const apiKey = keyFor();
    try {
      const { buf, contentType } = decodeImage(image);
      const [toneId, lengthId] = await Promise.all([
        upload(apiKey, 'skin-tone-analysis', buf, contentType, 'tone.jpg'),
        upload(apiKey, 'hair-length-detection', buf, contentType, 'len.jpg'),
      ]);
      const [tone, len] = await Promise.all([
        runTask(apiKey, 'skin-tone-analysis', { src_file_id: toneId, face_angle_strictness_level: 'flexible' }),
        runTask(apiKey, 'hair-length-detection', { src_file_id: lengthId }),
      ]);
      return ok({
        skin_tone: tone.results?.color?.skin_color,
        eye_color: tone.results?.color?.eye_color,
        lip_color: tone.results?.color?.lip_color,
        eyebrow_color: tone.results?.color?.eyebrow_color,
        face_quality: tone.results?.face_quality,
        hair_length: len.results?.hair_length?.term,
        demo: false,
      });
    } catch (e) { return err(e.message, 502); }
  }

  if (action === 'tryon') {
    const feature = body.feature || 'hair-color';
    if (DEMO) return ok({ demo: true, url: null, feature });
    if (!image) return err('image required', 400);
    const apiKey = keyFor();
    try {
      const { buf, contentType } = decodeImage(image);
      const fid = await upload(apiKey, feature, buf, contentType, 'selfie.jpg');
      let taskBody;
      if (feature === 'hair-color') {
        taskBody = body.preset
          ? { src_file_id: fid, preset: body.preset }
          : {
              src_file_id: fid,
              pattern: { name: body.palettes?.length > 1 ? 'ombre' : 'full' },
              palettes: (body.palettes ?? []).map((p) => ({
                color: p.color,
                color_intensity: p.color_intensity ?? 70,
                shine_intensity: p.shine_intensity ?? 40,
              })),
            };
      } else {
        taskBody = { src_file_id: fid, template_id: body.template_id };
      }
      const res = await runTask(apiKey, feature, taskBody);
      return ok({ url: res.results?.url ?? res.results?.[0]?.data?.[0]?.url, feature, demo: false });
    } catch (e) { return err(e.message, 502); }
  }

  if (action === 'colors') {
    return ok({ colors: DEMO ? demoColors() : demoColors() });
  }

  return err(`unknown action: ${action}`, 400);
}
