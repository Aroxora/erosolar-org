#!/usr/bin/env node
/**
 * Build a short "summary video" by stitching descriptive xAI images (Ken-Burns)
 * under an EXISTING TTS mp3, synced to its length. Reuses a shared image set so
 * the EN + 中文 summaries stay visually consistent.
 *
 * Usage: node summary-video.mjs <audio.mp3> <slug> <out.mp4>
 * Env (from studio/.env): XAI_API_KEY (+ optional XAI_IMAGE_MODEL).
 */
import 'dotenv/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const run = promisify(execFile);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const SHARED = path.join(HERE, 'out', '_shared');
const XAI = 'https://api.x.ai/v1/images/generations';
const XAI_IMAGE_MODEL = process.env.XAI_IMAGE_MODEL || 'grok-imagine-image';
const W = 1920, H = 1080, FPS = 30;

// On-theme, no-text image prompts for the AI-economics summary.
const PROMPTS = [
  'a glowing downward-sloping cost curve made of light, AI tokens dissolving into cheap sparks, dark background, amber and steel palette, data-visualization aesthetic',
  'a vast wall of inexpensive server racks glowing red and gold, an East-Asian megascale data hall, contrasted with one ornate expensive vault, cinematic wide shot',
  'four identical premium subscription cards floating like luxury goods, versus a swarm of tiny cheap glowing chips, conceptual, amber and steel, dark studio',
  'an enormous futuristic data center under construction at night, cranes and power lines, capital pouring in as streams of golden light, cinematic',
  'a fragile glass skyscraper shaped like an IPO bell at an all-time high, vertigo perspective, dramatic rim lighting, sense of precarious height',
  'a lone engineer-architect at a glowing control terminal routing flows of light between a small cheap model and a towering premium frontier model, amber and steel',
];

async function genImage(prompt, file) {
  if (existsSync(file)) return 'cached';
  try {
    const r = await fetch(XAI, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      body: JSON.stringify({ model: XAI_IMAGE_MODEL, prompt: `Cinematic, high-detail, 16:9, no text, no words: ${prompt}`, n: 1 }),
    });
    if (r.ok) {
      const item = (await r.json()).data?.[0];
      if (item?.b64_json) { await writeFile(file, Buffer.from(item.b64_json, 'base64')); return 'xai'; }
      if (item?.url) { const img = await fetch(item.url); await writeFile(file, Buffer.from(await img.arrayBuffer())); return 'xai'; }
    } else { console.warn('  xAI image failed:', r.status, (await r.text()).slice(0, 120)); }
  } catch (e) { console.warn('  xAI image error:', e.message); }
  await run('ffmpeg', ['-y', '-f', 'lavfi', '-i', `color=c=0x0c0d0f:s=${W}x${H}`, '-frames:v', '1', file]); // branded fallback
  return 'fallback';
}

async function durationSec(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  return parseFloat(stdout.trim()) || 60;
}

async function main() {
  const [mp3, slug, outMp4] = process.argv.slice(2);
  if (!mp3 || !slug || !outMp4) throw new Error('Usage: summary-video.mjs <audio.mp3> <slug> <out.mp4>');
  await mkdir(SHARED, { recursive: true });
  const work = path.join(HERE, 'out', slug);
  await mkdir(work, { recursive: true });

  // 1) ensure the shared image set exists
  const imgs = [];
  for (let i = 0; i < PROMPTS.length; i++) {
    const f = path.join(SHARED, `img${i}.png`);
    const how = await genImage(PROMPTS[i], f);
    console.log(`  image ${i}: ${how}`);
    imgs.push(f);
  }

  // 2) per-image silent Ken-Burns clips, evenly covering the audio length
  const alen = await durationSec(mp3);
  const D = Math.ceil(alen / imgs.length) + 1; // slight overrun; -shortest trims to audio
  const frames = D * FPS;
  const clips = [];
  for (let i = 0; i < imgs.length; i++) {
    const clip = path.join(work, `c${i}.mp4`);
    const dir = i % 2 ? `min(zoom+0.0006,1.16)` : `if(lte(zoom,1.0),1.16,max(1.001,zoom-0.0006))`; // alternate in/out zoom
    await run('ffmpeg', ['-y', '-loop', '1', '-i', imgs[i], '-t', String(D), '-r', String(FPS),
      '-vf', `scale=${Math.round(W * 1.35)}:-1,zoompan=z='${dir}':d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p`,
      '-an', clip]);
    clips.push(clip);
  }

  // 3) concat silent clips, then mux the existing narration (trim to audio)
  const list = path.join(work, 'list.txt');
  await writeFile(list, clips.map((c) => `file '${c}'`).join('\n'));
  const silent = path.join(work, 'silent.mp4');
  await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
  await run('ffmpeg', ['-y', '-i', silent, '-i', mp3, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', outMp4]);
  const poster = outMp4.replace(/\.mp4$/, '.jpg');
  await run('ffmpeg', ['-y', '-i', outMp4, '-frames:v', '1', '-q:v', '3', poster]);
  await rm(work, { recursive: true, force: true });
  console.log(`✅ ${outMp4} (${Math.round(alen)}s) + poster ${path.basename(poster)}`);
}
main().catch((e) => { console.error('summary-video failed:', e); process.exit(1); });
