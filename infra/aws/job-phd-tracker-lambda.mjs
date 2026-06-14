/**
 * AWS Lambda (Node 22) — job + PhD tracker.
 * Runs the same agentic Tavily + DeepSeek scans as the Cloud Functions,
 * then writes directly to Firestore using firebase-admin (service account).
 *
 * Deploy: zip this + node_modules (or use container), set env vars:
 *   DEEPSEEK_API_KEY, TAVILY_API_KEY, GOOGLE_APPLICATION_CREDENTIALS (or embed sa as secret)
 * Schedule via EventBridge rule (daily or every 6h).
 *
 * For simplicity this file is self-contained (copy the scan fns or require shared).
 */

import admin from 'firebase-admin';
import OpenAI from 'openai';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

async function tavilySearch(query, max = 10) {
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: TAVILY_API_KEY, query, max_results: max, search_depth: 'advanced', include_answer: true }),
  });
  return r.json();
}

async function deepseekChat(userContent) {
  const client = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' });
  const res = await client.chat.completions.create({
    model: 'deepseek-v4-pro',
    messages: [{ role: 'user', content: userContent }],
    temperature: 0.15,
    max_tokens: 9000,
  });
  return res.choices[0]?.message?.content || '';
}

export async function runJobsScan() {
  // (abbreviated copy of functions version for Lambda independence)
  const qs = ['Anthropic AI jobs visa', 'OpenAI red team OR engineer hiring', 'xAI careers', 'DeepSeek AI jobs visa sponsorship', 'Google DeepMind research scientist jobs', 'AI engineering red team jobs "visa" 2026'];
  const raw = [];
  for (const q of qs) {
    try { raw.push(...(await tavilySearch(q, 6)).results || []); } catch {}
  }
  const synth = await deepseekChat(`Normalize to JSON array of jobs: title,company,location,url,visaSponsorship,description. RAW: ${JSON.stringify(raw).slice(0,120000)}`);
  let jobs = [];
  try { jobs = JSON.parse(synth.replace(/```/g,'').trim()); } catch { jobs = raw.slice(0,12).map(r => ({ title: r.title, company: r.source, url: r.url, visaSponsorship: 'check posting' })); }
  const batch = db.batch();
  jobs.slice(0, 30).forEach((j, i) => {
    const ref = db.collection('jobs').doc('lambda-' + (j.url || i).toString().slice(-24).replace(/[^a-z0-9]/gi,''));
    batch.set(ref, { ...j, fetchedAt: admin.firestore.FieldValue.serverTimestamp(), source: 'aws-lambda-agentic' }, { merge: true });
  });
  await batch.commit();
  await db.collection('updates').add({ date: new Date().toISOString().slice(0,10), type: 'jobs', title: 'Lambda job scan', body: 'AWS Lambda daily sweep of AI lab + AI-dev roles.', agent: 'lambda+deepseek+tavily', createdAt: admin.firestore.FieldValue.serverTimestamp() });
  return { ok: true, count: jobs.length };
}

export async function runPhdTracker() {
  const targets = ['Tsinghua AI PhD', 'HKUST CSE PhD', 'Stanford CS PhD AI', 'MIT EECS AI', 'DeepSeek research positions'];
  const out = [];
  for (const t of targets) {
    try {
      const r = await tavilySearch(t + ' admissions OR deadline OR "applications open" 2026 OR 2027', 4);
      out.push({ program: t, status: 'see sources', notes: (r.answer || '').slice(0,280), lastChecked: new Date().toISOString().slice(0,10), source: 'lambda' });
    } catch {}
  }
  const batch = db.batch();
  out.forEach(p => batch.set(db.collection('phdPrograms').doc(p.program.toLowerCase().replace(/\s/g,'-')), p, { merge: true }));
  await batch.commit();
  return { ok: true };
}

export const handler = async (event) => {
  console.log('Lambda tracker invoked', event);
  const results = {};
  try { results.jobs = await runJobsScan(); } catch (e) { results.jobsErr = String(e); }
  try { results.phd = await runPhdTracker(); } catch (e) { results.phdErr = String(e); }
  return { statusCode: 200, body: JSON.stringify(results) };
};
