#!/usr/bin/env node
/**
 * ErosolarAI Video Studio — long-form video generation by stitching descriptive
 * AI images (NOT direct text-to-video, which is unreliable/expensive at length).
 *
 * Pipeline (all local, on your Mac):
 *   1. DeepSeek-v4-pro writes a structured script: title, description, and N
 *      segments, each with narration + a vivid image prompt.
 *   2. xAI Grok image model generates one descriptive image per segment.
 *   3. macOS `say` narrates each segment -> AIFF -> mp3 (free, offline; override
 *      with a cloud TTS by setting TTS_CMD). Duration is measured with ffprobe.
 *   4. ffmpeg builds a Ken-Burns clip per (image + audio) and concatenates them
 *      into one mp4, plus a .txt transcript and .srt captions for YouTube.
 *   5. Uploads the mp4 + thumbnail to Firebase Storage and writes a Firestore
 *      `videos/{id}` doc so the public /studio gallery shows it.
 *
 * Usage:
 *   cd studio && npm install
 *   GOOGLE_APPLICATION_CREDENTIALS=../outreach/service-account.json \
 *     node generate.mjs "How DeepSeek trains frontier models on a budget"
 *   # no topic -> auto-picks from the most recent erosolar.org blog update.
 *
 * Requires: node>=20, ffmpeg + ffprobe on PATH (brew install ffmpeg), macOS `say`
 * (or set TTS_CMD), and env: DEEPSEEK_API_KEY, XAI_API_KEY, FIREBASE creds.
 */
import 'dotenv/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';

const run = promisify(execFile);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, 'out');

const DEEPSEEK = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';
const XAI = 'https://api.x.ai/v1/images/generations';
const XAI_IMAGE_MODEL = process.env.XAI_IMAGE_MODEL || 'grok-imagine-image';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'twitch-womens-history';
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || `${PROJECT_ID}.firebasestorage.app`;
const W = 1920, H = 1080, FPS = 30;

function db() {
  if (!admin.apps.length) {
    const sa = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    admin.initializeApp(sa && existsSync(sa)
      ? { credential: admin.credential.cert(JSON.parse(readFileSync(sa, 'utf8'))), projectId: PROJECT_ID, storageBucket: BUCKET }
      : { credential: admin.credential.applicationDefault(), projectId: PROJECT_ID, storageBucket: BUCKET });
  }
  return admin.firestore();
}

async function deepseekJSON(prompt) {
  const r = await fetch(DEEPSEEK, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, temperature: 0.6, max_tokens: 8000, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`DeepSeek ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return JSON.parse((await r.json()).choices?.[0]?.message?.content || '{}');
}

async function genImage(prompt, file) {
  try {
    const r = await fetch(XAI, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      body: JSON.stringify({ model: XAI_IMAGE_MODEL, prompt: `Cinematic, high-detail, 16:9, no text: ${prompt}`, n: 1 }),
    });
    if (r.ok) {
      const d = await r.json();
      const item = d.data?.[0];
      if (item?.b64_json) { await writeFile(file, Buffer.from(item.b64_json, 'base64')); return true; }
      if (item?.url) { const img = await fetch(item.url); await writeFile(file, Buffer.from(await img.arrayBuffer())); return true; }
    } else { console.warn('  xAI image failed:', r.status, (await r.text()).slice(0, 120)); }
  } catch (e) { console.warn('  xAI image error:', e.message); }
  // Fallback: a branded gradient card so the pipeline still produces a video.
  await run('ffmpeg', ['-y', '-f', 'lavfi', '-i', `color=c=0x0c0d0f:s=${W}x${H}`, '-frames:v', '1', file]);
  return false;
}

async function tts(text, mp3) {
  const aiff = mp3.replace(/\.mp3$/, '.aiff');
  if (process.env.TTS_CMD) {
    await run('bash', ['-lc', `${process.env.TTS_CMD} ${JSON.stringify(text)} > ${JSON.stringify(mp3)}`]);
  } else {
    await run('say', ['-o', aiff, text]);                 // macOS built-in TTS
    await run('ffmpeg', ['-y', '-i', aiff, mp3]);
    await rm(aiff, { force: true });
  }
}

async function durationSec(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  return Math.max(2, Math.ceil(parseFloat(stdout.trim()) || 4));
}

function srtTime(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`; }

async function main() {
  const topic = process.argv.slice(2).join(' ').trim();
  const fs0 = db();
  let theme = topic;
  if (!theme) {
    try { const u = await fs0.collection('updates').orderBy('date', 'desc').limit(1).get(); theme = u.docs[0]?.data()?.title || 'The state of frontier AI'; }
    catch { theme = 'The state of frontier AI'; }
  }
  console.log('Topic:', theme);

  const script = await deepseekJSON(`Write a tight, engaging ~3-minute explainer video script about "${theme}" for a technical-but-broad YouTube audience, narrated by Bo Shang. Return JSON: {"title":"...","description":"2-3 sentence YouTube description","segments":[{"narration":"40-70 words, spoken","imagePrompt":"a vivid, concrete, cinematic visual that illustrates this narration (no text in image)"}]}. 6-9 segments. Accurate, no hype, no invented numbers.`);
  const segs = (script.segments || []).slice(0, 9);
  if (!segs.length) throw new Error('No segments produced.');
  console.log(`Script: "${script.title}" — ${segs.length} segments`);

  const slug = (script.title || theme).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  const work = path.join(OUT, slug);
  await mkdir(work, { recursive: true });

  const clips = [], transcriptLines = [], srt = [];
  let t = 0;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    console.log(`Segment ${i + 1}/${segs.length}…`);
    const img = path.join(work, `s${i}.png`), mp3 = path.join(work, `s${i}.mp3`), clip = path.join(work, `s${i}.mp4`);
    await genImage(s.imagePrompt || theme, img);
    await tts(s.narration || '', mp3);
    const dur = await durationSec(mp3);
    const frames = dur * FPS;
    // Ken-Burns slow zoom on the still image, sized to 1080p, with the narration.
    await run('ffmpeg', ['-y', '-loop', '1', '-i', img, '-i', mp3, '-c:v', 'libx264', '-t', String(dur), '-r', String(FPS),
      '-vf', `scale=${W * 1.3}:-1,zoompan=z='min(zoom+0.0006,1.18)':d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p`,
      '-c:a', 'aac', '-b:a', '160k', '-shortest', clip]);
    clips.push(clip);
    transcriptLines.push(s.narration || '');
    srt.push(`${i + 1}\n${srtTime(t)} --> ${srtTime(t + dur)}\n${s.narration || ''}\n`);
    t += dur;
  }

  // Concatenate clips.
  const listFile = path.join(work, 'list.txt');
  await writeFile(listFile, clips.map((c) => `file '${c}'`).join('\n'));
  const finalMp4 = path.join(work, `${slug}.mp4`);
  await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', finalMp4]);
  const thumb = path.join(work, 'thumb.jpg');
  await run('ffmpeg', ['-y', '-i', clips[0], '-frames:v', '1', '-q:v', '3', thumb]);
  await writeFile(path.join(work, 'transcript.txt'), transcriptLines.join('\n\n'));
  await writeFile(path.join(work, 'captions.srt'), srt.join('\n'));
  console.log('Built', finalMp4, `(${Math.round(t)}s)`);

  // Upload + record so the gallery shows it.
  let videoUrl = '', thumbUrl = '';
  try {
    const bucket = admin.storage().bucket();
    const up = async (local, dest, type) => { await bucket.upload(local, { destination: dest, metadata: { contentType: type } }); const f = bucket.file(dest); await f.makePublic(); return `https://storage.googleapis.com/${bucket.name}/${dest}`; };
    videoUrl = await up(finalMp4, `studio/${slug}.mp4`, 'video/mp4');
    thumbUrl = await up(thumb, `studio/${slug}.jpg`, 'image/jpeg');
    console.log('Uploaded:', videoUrl);
  } catch (e) { console.warn('Storage upload skipped:', e.message); }

  await fs0.collection('videos').doc(slug).set({
    title: script.title || theme, description: script.description || '', topic: theme,
    transcript: transcriptLines.join('\n\n'), videoUrl, thumbUrl,
    durationSec: Math.round(t), segments: segs.length,
    status: videoUrl ? 'published' : 'local-only',
    model: `${DEEPSEEK_MODEL} + ${XAI_IMAGE_MODEL} + say + ffmpeg`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('Recorded videos/' + slug + '. Done.');
}

main().catch((e) => { console.error('Studio failed:', e); process.exit(1); });
