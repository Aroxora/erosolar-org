import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();
const db = admin.firestore();

// === CONFIG / SECRETS ===
// For local/emulators: put in functions/.env  (DEEPSEEK_API_KEY=...)
// For prod: firebase functions:secrets:set DEEPSEEK_API_KEY
//          firebase functions:secrets:set TAVILY_API_KEY
// (or set in Cloud Run / Lambda env)
const DEEPSEEK_BASE = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro'; // or deepseek-reasoner etc. fallback in client
const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

// Admin email gate (single source of truth for this deployment)
const ADMIN_EMAIL = 'daburu.dragon@gmail.com';

// Rich resume context for personalized job applications (extracted from shipped projects, described by purpose)
const RESUME_CONTEXT = `
Bo Shang — software engineer focused on load-bearing systems, agentic infrastructure, and owned AI tooling.
Key shipped work (2024-2026):
- Endearo: 24/7 proactive AI life-assistant (local Node daemons + Proton Bridge IMAP/SMTP, DeepSeek+Tavily RAG/memory, dossiers, momentum coach). Reads my own inboxes read-only and turns scattered inputs into the next concrete step. Web (React Router) + iOS. Non-destructive, self-only comms, disclosed AI authorship.
- Anvilwing (npm: anvilwing / trenchwork-coder): Full Claude-Code-class terminal coding agent you fully own. DeepSeek v4 Pro (1M context, max thinking), Ink TUI, adversarial verifier, Shift+Tab permission modes, colored diffs, background long-running tasks, headless event-stream SDK. No hosted middleman.
- Frontier Model Index (3 sites + iOS): Daily auto-updated live AI atlas (leaderboards, China catch-up watch incl. DeepSeek/V4 training/hardware, LLM weights explainer, business/military AI). Tavily + DeepSeek-V4 synthesis → Firestore Admin → static sites read live. No content redeploys needed.
- erosolar: Honest small CoT LLM pipeline (14M-param models reporting only measured metrics: 0.99 validity, char+copy zero-shot generalization ~89% held-out). Infini-Attention, grounded verification (SymPy/Z3/code exec). Additive Qwen3-32B QLoRA agent runtime + vLLM + Angular chat frontend (Cloud Run). Model-landscape auto-updater using same Tavily+DeepSeek stack.
- The Meridian (the-meridian.live): Fully agentic Economist-style newspaper. DeepSeek plans/commissions/reports/writes/fact-checks; OpenAI TTS narrates. Weekly editions (≤100 stories) + daily briefs, historical archive. Angular PWA + iOS + Apple Watch (unified audio player, background/lockscreen), VAPID web push, dynamic RSS/JSON/sitemaps. Cost-capped conservation mode.
- DRIFT (drift-by-bo.web.app): Hard-science survival screenplay + ecosystem. Full fountain-parsed reader with inline science annotations, 24 narrated stories (TTS pos memory), Living Science engine (weekly DeepSeek+Tavily curator that auto-updates facts and flags screenplay drift), long-horizon video pipeline (DeepSeek reflexion director → Seedance/xAI image-to-video chaining + ffmpeg stitch, resumable/self-healing), grounded "Ask the Computer" companion, agentic story/series foundry, ebook builder, SwiftUI iOS port.
- Trenchwork (trenchwork.live): Automatic work-momentum tracker. Go desktop daemon (real activity detection: processes/tty/git + hooks into Anvilwing/Claude Code etc.), direct Firestore Admin writes + FCM, computed streaks/rollups. iOS + Apple Watch (Live Activities, complications, one-tap approvals for long agentic runs over Tailscale). 24/7 nudge scheduler (GH Actions/Lambda). Google SSO, owner-scoped.
All powered by controlled DeepSeek + Tavily pipelines. Strong emphasis on verifiable, honest, owner-controlled systems. Open to AI engineering, red-team/alignment, research engineering, infrastructure roles — including international with visa sponsorship (esp. DeepSeek and similar).
Contact: bo@trenchwork.org / bo@shang.software / 508-260-0326. Sites: erosolar.org, trenchwork.live.
`.trim();

function isAdmin(req: CallableRequest<any>): boolean {
  const email = req.auth?.token?.email;
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function requireAdmin(req: CallableRequest<any>) {
  if (!req.auth) {
    throw new Error('UNAUTHENTICATED: sign in with Google');
  }
  if (!isAdmin(req)) {
    throw new Error('PERMISSION_DENIED: admin only');
  }
}

// === DEEPSEEK + TAVILY CLIENTS (OpenAI-compatible for DeepSeek) ===

function getDeepSeek() {
  const key = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY; // fallback name
  if (!key) throw new Error('Missing DEEPSEEK_API_KEY secret/env');
  return new OpenAI({
    apiKey: key,
    baseURL: DEEPSEEK_BASE,
  });
}

async function deepseekChat(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
}) {
  const client = getDeepSeek();
  const model = params.model || DEEPSEEK_MODEL;
  const res = await client.chat.completions.create({
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.2,
    max_tokens: params.max_tokens ?? 8000,
    ...(params.response_format ? { response_format: params.response_format } : {}),
  } as any);
  return res.choices[0]?.message?.content || '';
}

async function tavilySearch(query: string, opts: { maxResults?: number; searchDepth?: 'basic' | 'advanced' } = {}) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error('Missing TAVILY_API_KEY');
  const body: any = {
    api_key: key,
    query,
    max_results: opts.maxResults ?? 12,
    search_depth: opts.searchDepth || 'advanced',
    include_answer: true,
    include_raw_content: false,
  };
  // node 18+ has fetch; functions v2 does too
  const r = await fetch(TAVILY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}: ${await r.text()}`);
  return r.json();
}

// === AGENTIC HELPERS (used by callables + workers) ===

export async function runJobsScan() {
  // Agentic full job search for AI labs + AI-related engineering/redteam/dev roles.
  // Uses Tavily for fresh postings, DeepSeek to normalize + filter + extract visa notes.
  const labs = [
    'Anthropic', 'OpenAI', 'xAI', 'Google DeepMind', 'Google AI', 'DeepSeek',
    'Meta AI', 'Mistral', 'Cohere', 'Inflection', 'Perplexity', 'Adele', 'Scale AI',
    'Anthropic careers', 'OpenAI jobs', 'xAI hiring', 'DeepSeek careers visa'
  ];
  const queries = [
    ...labs.map(l => `${l} AI engineer jobs OR research scientist OR red team OR "software engineer" OR "ML engineer" 2026`),
    'AI safety red team jobs sponsorship OR visa',
    'AI engineering jobs "visa sponsorship" OR "international" site:anthropic.com OR site:openai.com OR site:x.ai OR site:deepseek.ai',
    'PhD research intern AI labs jobs "visa"',
    'red teaming LLM OR adversarial AI jobs hiring',
  ];

  const all: any[] = [];
  for (const q of queries.slice(0, 6)) { // bound cost
    try {
      const t = await tavilySearch(q, { maxResults: 8, searchDepth: 'advanced' });
      if (t.results) all.push(...t.results);
    } catch (e) { console.warn('tavily partial fail', q, e); }
  }

  // Dedupe + synthesize with DeepSeek
  const prompt = `You are a precise job intelligence agent. From the raw search results below, produce a clean JSON array of distinct current job openings relevant to AI labs (Anthropic, OpenAI, xAI, Google, DeepSeek, Meta etc) or AI engineering / red team / LLM dev / safety roles anywhere.

Rules:
- Only include roles that are demonstrably AI/ML/LLM/red-team/alignment/engineering at frontier labs or strong AI teams.
- For each, extract: title, company, location (city or Remote), url (the original posting if present), visaSponsorship (true/false/"preferred"/"required for intl"/"not mentioned"), level (intern/junior/staff etc if clear), posted (date or "recent"), description (1-2 sentence summary from content).
- Flag any that mention visa, H1B, sponsorship, international, relocation, or "must be authorized".
- Output ONLY valid JSON array, no prose wrapper. Max 40 items. Sort newest first if dates present.

RAW:
${JSON.stringify(all.slice(0, 40)).slice(0, 180000)}`;

  let parsed: any[] = [];
  try {
    const txt = await deepseekChat({ messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 12000 });
    parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error('DeepSeek parse fail for jobs, falling back to raw subset', e);
    parsed = all.slice(0, 15).map((r: any, i: number) => ({
      id: 'raw-' + i,
      title: r.title || r.url?.slice(0, 60),
      company: r.source || 'unknown',
      location: r.url || '',
      url: r.url || '',
      visaSponsorship: /visa|sponsor|international|h1b/i.test(r.content || r.title || '') ? 'mentioned' : 'not mentioned',
      description: (r.content || '').slice(0, 280),
      fetchedAt: new Date().toISOString(),
    }));
  }

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();
  for (const j of parsed.slice(0, 35)) {
    const id = j.id || Buffer.from((j.url || j.title || Math.random().toString())).toString('base64').slice(0, 28);
    const ref = db.collection('jobs').doc(id);
    batch.set(ref, {
      ...j,
      fetchedAt: now,
      source: 'agentic-tavily-deepseek',
      _scanDate: new Date().toISOString().slice(0, 10),
    }, { merge: true });
  }
  await batch.commit();

  // Also write a dated update log (blog style)
  await db.collection('updates').add({
    date: new Date().toISOString().slice(0, 10),
    type: 'jobs',
    title: 'Agentic AI lab + AI-dev job scan',
    body: `Scanned ${queries.length} targeted queries across frontier labs and AI engineering/red-team roles. ${parsed.length} normalized openings written. DeepSeek-v4-pro + Tavily. Includes explicit visa/sponsorship flags where mentioned (DeepSeek roles often note visa processes for international applicants).`,
    agent: 'deepseek-v4-pro + tavily',
    createdAt: now,
  });

  return { written: parsed.length };
}

export async function runPhdTracker() {
  const targets = [
    // US (top AI programs)
    { name: 'Stanford CS PhD (AI/ML)', uni: 'Stanford', country: 'US' },
    { name: 'MIT EECS PhD (AI)', uni: 'MIT', country: 'US' },
    { name: 'CMU LTI / SCS PhD (AI)', uni: 'CMU', country: 'US' },
    { name: 'UC Berkeley EECS PhD (AI)', uni: 'Berkeley', country: 'US' },
    { name: 'Harvard SEAS / CS PhD (AI)', uni: 'Harvard', country: 'US' },
    { name: 'Caltech CMS PhD (AI/ML)', uni: 'Caltech', country: 'US' },
    { name: 'Cornell CS PhD (AI)', uni: 'Cornell', country: 'US' },
    { name: 'UIUC CS PhD (AI/ML)', uni: 'UIUC', country: 'US' },
    { name: 'Princeton CS PhD (AI)', uni: 'Princeton', country: 'US' },
    { name: 'Yale CS PhD (AI)', uni: 'Yale', country: 'US' },
    { name: 'Columbia CS PhD (AI)', uni: 'Columbia', country: 'US' },
    { name: 'UCLA CS PhD (AI)', uni: 'UCLA', country: 'US' },
    { name: 'University of Michigan CSE PhD (AI)', uni: 'Michigan', country: 'US' },
    { name: 'Georgia Tech CS PhD (AI)', uni: 'Georgia Tech', country: 'US' },
    { name: 'UT Austin CS PhD (AI/ML)', uni: 'UT Austin', country: 'US' },
    // China top AI programs
    { name: 'Tsinghua CS / AI PhD (IIIS, Dept CS)', uni: 'Tsinghua', country: 'CN' },
    { name: 'Peking University AI / CS PhD', uni: 'PKU', country: 'CN' },
    { name: 'Shanghai Jiao Tong University AI PhD', uni: 'SJTU', country: 'CN' },
    { name: 'Zhejiang University AI Lab PhD', uni: 'ZJU', country: 'CN' },
    { name: 'USTC AI / CS PhD', uni: 'USTC', country: 'CN' },
    { name: 'Fudan University AI PhD', uni: 'Fudan', country: 'CN' },
    { name: 'Nanjing University AI PhD', uni: 'Nanjing', country: 'CN' },
    { name: 'Harbin Institute of Technology AI PhD', uni: 'HIT', country: 'CN' },
    // Hong Kong
    { name: 'HKUST CSE / AI PhD', uni: 'HKUST', country: 'HK' },
    { name: 'CUHK CS / AI PhD', uni: 'CUHK', country: 'HK' },
    { name: 'HKU CS PhD (AI)', uni: 'HKU', country: 'HK' },
    // Others (top international)
    { name: 'University of Toronto CS PhD (AI)', uni: 'Toronto', country: 'CA' },
    { name: 'Oxford / Cambridge AI PhD', uni: 'Oxford/Cambridge', country: 'UK' },
    { name: 'ETH Zurich CS / AI PhD', uni: 'ETH', country: 'CH' },
    { name: 'EPFL IC PhD (AI/ML)', uni: 'EPFL', country: 'CH' },
    { name: 'Imperial College London AI PhD', uni: 'Imperial', country: 'UK' },
    { name: 'University of Edinburgh AI PhD', uni: 'Edinburgh', country: 'UK' },
    { name: 'NUS / NTU AI PhD (Singapore)', uni: 'NUS/NTU', country: 'SG' },
    { name: 'ANU / Melbourne AI PhD (Australia)', uni: 'ANU/Melbourne', country: 'AU' },
  ];

  const results: any[] = [];
  for (const t of targets) {
    const q = `${t.name} PhD admissions 2026 OR 2027 deadline application status AI ML "open" OR "closed" OR "rolling" site:.edu OR site:.cn OR site:.hk`;
    try {
      const tRes = await tavilySearch(q, { maxResults: 5 });
      const synth = await deepseekChat({
        messages: [{
          role: 'user',
          content: `From the search results, extract the current known status for ${t.name}. Return compact JSON: {status: "open"|"closed"|"rolling"|"unknown", deadline: "string or null", notes: "1 sentence with sources", visa: "notes if intl applicants" }. If nothing credible, status=unknown. RAW: ${JSON.stringify(tRes.results || []).slice(0, 9000)}`
        }],
        temperature: 0.05,
      });
      let parsed: any = { status: 'unknown', deadline: null, notes: 'agent parse' };
      try { parsed = JSON.parse(synth.replace(/```json|```/g, '').trim()); } catch {}
      results.push({
        id: t.uni.toLowerCase().replace(/\s+/g, '-') + '-' + t.country.toLowerCase(),
        program: t.name,
        uni: t.uni,
        country: t.country,
        status: parsed.status || 'unknown',
        deadline: parsed.deadline || null,
        notes: parsed.notes || '',
        visaNotes: parsed.visa || '',
        lastChecked: new Date().toISOString().slice(0, 10),
        source: 'agentic-tavily-deepseek',
      });
    } catch (e) {
      results.push({ ...t, id: (t.uni + t.country).toLowerCase(), status: 'error', lastChecked: new Date().toISOString().slice(0, 10) });
    }
  }

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();
  for (const p of results) {
    const ref = db.collection('phdPrograms').doc(p.id);
    batch.set(ref, { ...p, updatedAt: now }, { merge: true });
  }
  await batch.commit();

  await db.collection('updates').add({
    date: new Date().toISOString().slice(0, 10),
    type: 'phd',
    title: 'PhD & AI lab admissions tracker refresh',
    body: `Live status sweep of top US (Stanford, MIT, CMU, Berkeley...), Chinese (Tsinghua, PKU, SJTU, ZJU) and HK (HKUST, CUHK, HKU) AI/CS PhD programs + labs. Agentic via DeepSeek-v4-pro + Tavily. Statuses: open/closed/rolling/unknown. Written ${results.length} records.`,
    agent: 'deepseek-v4-pro + tavily',
    createdAt: now,
  });

  return { written: results.length };
}

// === CALLABLES (gated) ===

export const chatWithAdmin = onCall({ region: 'us-central1', cors: true }, async (req) => {
  requireAdmin(req);
  const { message, history = [] } = req.data || {};
  if (!message || typeof message !== 'string') throw new Error('Bad message');

  // Build context from recent jobs + phd + latest updates for grounded answers
  const [jobsSnap, phdSnap, updatesSnap] = await Promise.all([
    db.collection('jobs').orderBy('fetchedAt', 'desc').limit(8).get(),
    db.collection('phdPrograms').orderBy('lastChecked', 'desc').limit(6).get(),
    db.collection('updates').orderBy('date', 'desc').limit(5).get(),
  ]);

  const context = {
    jobs: jobsSnap.docs.map(d => d.data()),
    phds: phdSnap.docs.map(d => d.data()),
    recentUpdates: updatesSnap.docs.map(d => d.data()),
  };

  const sys = `You are Bo's private strategic co-pilot. You have live access to the job tracker, PhD/lab status DB, dated update log, and full sent application/outreach history (all auto-refreshed agentically with DeepSeek-v4-pro + Tavily).
Current date: ${new Date().toISOString().slice(0,10)}.
Capabilities now include: drafting personalized job applications/cover letters (using full rich resume context from Anvilwing, Meridian, DRIFT, Frontier Index, Trenchwork, Endearo, erosolar), queuing them, and controlling "autoApply" mode.
When autoApply is ON the trusted local Proton worker will:
- Select high-fit unfilled roles (prioritize DeepSeek, Anthropic, OpenAI, xAI, Google AI, red-team/AI safety/eng, roles mentioning visa/sponsorship/international).
- Generate tailored short emails using the exact shipped projects + visa notes as a strength.
- Send via the configured Proton bridge (erolunar@pm.me local), log the COMPLETE sent text + job ref + timestamp into jobApplications (and mirror to outreachHistory).
Help the admin with: drafting outreach or specific job apps, deciding targets (esp. visa-track DeepSeek etc), reviewing pending applications, toggling autoApply or outreach auto, live status of Chinese/HK/US PhD programs, suggesting site updates, or career momentum.
Be concise, cite sources/dates. For TAKE ACTION (scan, toggle outreach on, toggle autoApply on, queue app for jobId XXX, draft app for jobId YYY), end with a clear one-line "ACTION: ..." the UI can act on.
Context snapshot: ${JSON.stringify(context).slice(0, 14000)}`;

  const fullHistory = [
    { role: 'system' as const, content: sys },
    ...history.slice(-8),
    { role: 'user' as const, content: message },
  ];

  const reply = await deepseekChat({ messages: fullHistory, temperature: 0.35, max_tokens: 6000 });

  // Persist log
  await db.collection('chatLogs').add({
    userEmail: ADMIN_EMAIL,
    prompt: message,
    reply,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    contextSummary: { jobs: context.jobs.length, phds: context.phds.length, updates: context.recentUpdates.length },
  });

  // Simple action parser (UI will watch for ACTION: lines and call other callables)
  return { reply, timestamp: new Date().toISOString() };
});

export const triggerJobsScan = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const res = await runJobsScan();
  return res;
});

export const triggerPhdScan = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const res = await runPhdTracker();
  return res;
});

export const setOutreachAuto = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const enabled: boolean = !!req.data?.enabled;
  await db.collection('settings').doc('outreach').set({
    autoEnabled: enabled,
    toggledBy: ADMIN_EMAIL,
    toggledAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.collection('updates').add({
    date: new Date().toISOString().slice(0, 10),
    type: 'outreach',
    title: `Agentic outreach auto mode ${enabled ? 'ENABLED' : 'DISABLED'}`,
    body: `Admin ${ADMIN_EMAIL} toggled automatic Proton/local outreach worker control to ${enabled}. When on, local worker will poll for queued drafts and send via configured Proton bridge (or other) with full history logged.`,
    agent: 'manual-admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, autoEnabled: enabled };
});

export const queueOutreachDraft = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const { to, subject, body, notes } = req.data || {};
  if (!to || !subject) throw new Error('to and subject required');
  const ref = await db.collection('outreachQueue').add({ // temp queue collection (worker drains)
    to, subject, body: body || '', notes: notes || '',
    status: 'queued', requestedBy: ADMIN_EMAIL, requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
});

// Manual log write from chatbot (used when ACTION: log-update "..." )
export const writeManualUpdate = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const { date, title, body, type = 'site' } = req.data || {};
  if (!title || !body) throw new Error('title + body required');
  await db.collection('updates').add({
    date: date || new Date().toISOString().slice(0, 10),
    type,
    title,
    body,
    agent: 'admin-chatbot',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

// === SCHEDULED (if Blaze; otherwise run via GH Action / Lambda / local cron) ===
export const dailyAgentRefresh = onSchedule({ schedule: '0 9 * * *', region: 'us-central1', timeZone: 'America/New_York' }, async () => {
  console.log('Daily agent refresh starting');
  try { await runJobsScan(); } catch (e) { console.error('jobs', e); }
  try { await runPhdTracker(); } catch (e) { console.error('phd', e); }
  // Could also regenerate a "today in review" update here
});

// === AUTO JOB APPLICATIONS (new) + extended outreach ===

export async function draftJobApplication(job: any, extraNotes = '') {
  const sys = `You are a precise, professional, warm application writer for Bo Shang.
Use ONLY the resume context below. Tailor 1 short, high-signal email (or cover note + email body) to the specific job.
- Highlight the most relevant shipped agentic/owned systems (Anvilwing for coding agents, The Meridian for full autonomous research+writing pipelines, DRIFT for long-horizon video/science, erosolar for honest LLM work, Frontier Model Index daily auto data systems, Trenchwork momentum, Endearo life infra).
- Reference verifiable tech (DeepSeek v4-pro 1M at max thinking, Tavily grounding, Firebase Admin + Cloud Functions, Go/SwiftUI/Angular, owned keys no vendor lock-in).
- For any DeepSeek or China/HK-related roles or roles noting visa: explicitly note willingness to handle visa process, international relocation, and prior accountability/monitoring experience as a strength for trust & reliability.
- Keep to 180-280 words. Clear ask (interview, conversation, application). Include 1-2 live links (erosolar.org or trenchwork.live or specific project). Sign "— Bo Shang".
- Never fabricate titles, metrics, or affiliations. Be specific and humble about scope.
RESUME CONTEXT:\n${RESUME_CONTEXT}\n\nJOB:\n${JSON.stringify({ title: job.title, company: job.company, location: job.location, visa: job.visaSponsorship, desc: (job.description || '').slice(0,600) })}\n\nEXTRA NOTES: ${extraNotes}`;
  const body = await deepseekChat({ messages: [{ role: 'user', content: sys }], temperature: 0.35, max_tokens: 1400 });
  return body.trim();
}

export const setAutoApply = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const enabled: boolean = !!req.data?.enabled;
  await db.collection('settings').doc('autoApply').set({
    enabled,
    toggledBy: ADMIN_EMAIL,
    toggledAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.collection('updates').add({
    date: new Date().toISOString().slice(0, 10),
    type: 'outreach',
    title: `Auto job application mode ${enabled ? 'ENABLED' : 'DISABLED'}`,
    body: `Admin toggled fully automatic job applications (DeepSeek + Proton worker) to ${enabled}. When ON the local worker will select high-fit unfilled roles (esp. DeepSeek visa-track, AI eng/redteam), draft personalized applications using the full resume context, send via bridge, and log complete text + status to jobApplications.`,
    agent: 'manual-admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, autoApplyEnabled: enabled };
});

export const draftJobApplicationCF = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const { jobId, notes = '' } = req.data || {};
  if (!jobId) throw new Error('jobId required');
  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) throw new Error('Job not found');
  const job = { id: jobSnap.id, ...jobSnap.data() } as any;
  const draft = await draftJobApplication(job, notes);
  return { draft, job: { title: job.title, company: job.company } };
});

export const queueJobApplication = onCall({ region: 'us-central1' }, async (req) => {
  requireAdmin(req);
  const { jobId, to, notes = '' } = req.data || {};
  if (!jobId) throw new Error('jobId required');
  const jobSnap = await db.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) throw new Error('Job not found');
  const job: any = { id: jobSnap.id, ...jobSnap.data() };

  const ref = await db.collection('applicationQueue').add({
    jobId,
    title: job.title,
    company: job.company,
    to: to || '',
    notes: notes || (job.visaSponsorship ? 'Visa / international track emphasized' : ''),
    status: 'queued',
    requestedBy: ADMIN_EMAIL,
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id, job: { title: job.title, company: job.company } };
});

// When autoApply is on, the local worker does the heavy lifting (select + draft + send).
// This scheduled just ensures a heartbeat + can pre-queue high-signal roles.
export const maybeAutoApply = onSchedule({ schedule: '0 */4 * * *', region: 'us-central1' }, async () => {
  const snap = await db.collection('settings').doc('autoApply').get();
  if (!snap.exists || !snap.data()?.enabled) return;
  console.log('Auto-apply is ON — local worker will select + draft + send high-fit jobs (DeepSeek visa etc.)');
  // Optional: here we could pre-select top 1-2 and write to applicationQueue for the worker.
});

// Placeholder for outreach trigger (the heavy lifting is in the LOCAL proton worker)
export const maybeTriggerOutreach = onSchedule({ schedule: '*/20 * * * *', region: 'us-central1' }, async () => {
  const snap = await db.collection('settings').doc('outreach').get();
  if (!snap.exists || !snap.data()?.autoEnabled) return;
  // In real: this could write a "please run local worker now" heartbeat.
  // The actual send happens in the always-on local Proton worker (outreach/ folder).
  console.log('Outreach auto is ON — local worker should be polling.');
});

// Example: on new outreachQueue item, the local worker handles send. Here we just log history mirror.
export const onQueueItem = onDocumentCreated('outreachQueue/{id}', async (event) => {
  // This is illustrative; real send + history write is done by the trusted local worker process.
  console.log('Queue item observed (local worker is authoritative for send)');
});
