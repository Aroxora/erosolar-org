// Compute core for the erosolar.org agentic backend, running on AWS Lambda
// (the Firebase project stays on the Spark plan, so no Cloud Functions).
//
// This module is Firestore-FREE: it only calls DeepSeek + Tavily and returns
// JSON. The authenticated admin's browser writes the results to Firestore
// directly (allowed by the security rules for daburu.dragon@gmail.com). That
// keeps the interactive path free of any server-side service-account key.
//
// Secrets come from Lambda env vars: DEEPSEEK_API_KEY, TAVILY_API_KEY.

const DEEPSEEK_BASE = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';
const TAVILY_ENDPOINT = 'https://api.tavily.com/search';
const XAI_BASE = 'https://api.x.ai/v1';
const XAI_MODEL = process.env.XAI_MODEL || 'grok-4.3';

export const ADMIN_EMAIL = 'daburu.dragon@gmail.com';

// Résumé context for drafting applications/outreach. Described by purpose; no
// legal/medical/personal specifics (those stay private, per the site guardrails).
export const RESUME_CONTEXT = `
Bo Shang — AI / software engineer who builds owned, verifiable agentic systems and load-bearing infrastructure.
Shipped work (2024–2026), described by purpose:
- Anvilwing: npm-published, Claude-Code-class terminal coding agent running DeepSeek v4 Pro at 1M-token context with an adversarial verifier, permission modes, colored diffs, background tasks, and a headless event-stream SDK. Your keys, no hosted middleman.
- Frontier Model Index: three live auto-updated AI-atlas sites + iOS, refreshed daily by a Tavily + DeepSeek-V4 pipeline that writes Firestore via the Admin SDK; static sites read live with a seed fallback. No content redeploys.
- erosolar: honest small chain-of-thought LLM pipeline reporting only measured metrics (0.99 validity; ~89% held-out via char+copy generalization), Infini-Attention, grounded verification (SymPy/Z3/code-exec), plus a Qwen agent stack + Angular chat on Cloud Run.
- The Meridian: fully agentic Economist-style newspaper — DeepSeek plans/reports/writes/fact-checks, OpenAI TTS narrates; Angular PWA + iOS + Apple Watch, VAPID push, dynamic feeds; cost-capped.
- DRIFT: hard-science screenplay site with a weekly DeepSeek+Tavily "living science" curator, a long-horizon video pipeline (director → image-to-video chaining → ffmpeg stitch, resumable/self-healing), a grounded companion, and an agentic story foundry.
- Trenchwork: Go desktop activity-tracking daemon + iOS/Watch Live Activities + Tailscale approvals for long agent runs; 24/7 nudge scheduler.
- Endearo: 24/7 proactive AI life-assistant (local daemons + Proton Bridge, memory/todos), reads my own inboxes read-only and surfaces the next concrete step.
All owner-controlled, DeepSeek + Tavily heavy, no vendor lock-in. Open to AI engineering, research engineering, red-team / AI safety, and infrastructure roles — including international, and willing to handle any required visa / sponsorship / relocation process.
Contact: bo@trenchwork.org / bo@shang.software / 508-260-0326. Sites: erosolar.org, trenchwork.live.
`.trim();

// ── LLM + search primitives (raw fetch; Node 20+ global fetch) ───────────────
export async function deepseekChat(messages, { temperature = 0.2, max_tokens = 8000, json = false } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('Missing DEEPSEEK_API_KEY');
  const r = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL, messages, temperature, max_tokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!r.ok) throw new Error(`DeepSeek ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content || '';
}

export async function tavilySearch(query, { maxResults = 8, searchDepth = 'advanced' } = {}) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error('Missing TAVILY_API_KEY');
  const r = await fetch(TAVILY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, query, max_results: maxResults, search_depth: searchDepth, include_answer: true }),
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

function stripJson(s) { return String(s || '').replace(/```json|```/g, '').trim(); }
const today = () => new Date().toISOString().slice(0, 10);

// ── Agentic jobs scan → normalized array (no Firestore) ──────────────────────
export async function runJobsScan() {
  const queries = [
    'Anthropic OR OpenAI OR xAI OR "Google DeepMind" OR DeepSeek AI engineer OR research scientist OR "ML engineer" jobs 2026',
    'AI safety red team OR adversarial LLM jobs hiring "visa sponsorship" OR international',
    'AI engineering OR research engineer jobs site:anthropic.com OR site:openai.com OR site:x.ai OR site:deepseek.com',
    'DeepSeek careers research engineer visa sponsorship international applicants',
    'red teaming LLM OR AI security OR alignment engineer jobs hiring 2026',
    'Meta FAIR OR Mistral OR Microsoft Research OR Allen Institute AI engineer research jobs',
  ];
  const all = [];
  for (const q of queries) {
    try { const t = await tavilySearch(q, { maxResults: 8 }); if (t.results) all.push(...t.results); }
    catch (e) { console.warn('tavily fail', q, String(e).slice(0, 80)); }
  }
  const prompt = `You are a precise job-intelligence agent. From the raw search results, produce a clean JSON array of distinct current openings relevant to AI labs (Anthropic, OpenAI, xAI, Google DeepMind, DeepSeek, Meta, etc.) or AI engineering / red-team / LLM-dev / AI-safety roles anywhere.
For each: { id, title, company, location, url, visaSponsorship, level, posted, description }. visaSponsorship is one of: "available"/"required for intl"/"preferred"/"not mentioned"/the source phrasing. Output ONLY a JSON array, max 40 items, newest first. RAW: ${JSON.stringify(all.slice(0, 40)).slice(0, 160000)}`;
  let parsed = [];
  try { parsed = JSON.parse(stripJson(await deepseekChat([{ role: 'user', content: prompt }], { temperature: 0.1, max_tokens: 12000, json: true }))); }
  catch (e) {
    parsed = all.slice(0, 15).map((r, i) => ({ id: 'raw-' + i, title: r.title, company: r.source || 'see posting', url: r.url, visaSponsorship: /visa|sponsor|international|h1b/i.test((r.content || '') + (r.title || '')) ? 'mentioned' : 'not mentioned', description: (r.content || '').slice(0, 260) }));
  }
  if (!Array.isArray(parsed)) parsed = parsed.jobs || parsed.results || [];
  return parsed.slice(0, 40).map((j, i) => ({
    id: j.id || 'job-' + Buffer.from(String(j.url || j.title || i)).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 24),
    title: j.title || '', company: j.company || 'unknown', location: j.location || '', url: j.url || '',
    visaSponsorship: j.visaSponsorship || 'not mentioned', level: j.level || '', posted: j.posted || 'recent',
    description: (j.description || '').slice(0, 320), source: 'lambda-deepseek-tavily', _scanDate: today(),
  }));
}

// ── Agentic PhD/lab status sweep → normalized array (no Firestore) ───────────
export async function runPhdTracker() {
  const targets = [
    { uni: 'Stanford', country: 'US', name: 'Stanford CS PhD (AI/ML)' }, { uni: 'MIT', country: 'US', name: 'MIT EECS PhD (AI) — CSAIL' },
    { uni: 'CMU', country: 'US', name: 'CMU SCS PhD (LTI/MLD/RI)' }, { uni: 'Berkeley', country: 'US', name: 'UC Berkeley EECS PhD (BAIR)' },
    { uni: 'Harvard', country: 'US', name: 'Harvard SEAS PhD (AI)' }, { uni: 'Princeton', country: 'US', name: 'Princeton CS PhD (AI/PLI)' },
    { uni: 'UW', country: 'US', name: 'University of Washington Allen School PhD' },
    { uni: 'Tsinghua', country: 'CN', name: 'Tsinghua CS/AI PhD (IIIS)' }, { uni: 'PKU', country: 'CN', name: 'Peking University AI PhD' },
    { uni: 'SJTU', country: 'CN', name: 'Shanghai Jiao Tong AI PhD' }, { uni: 'Fudan', country: 'CN', name: 'Fudan University AI PhD' },
    { uni: 'HKUST', country: 'HK', name: 'HKUST CSE PhD (AI)' }, { uni: 'CUHK', country: 'HK', name: 'CUHK CSE PhD (AI/MMLab)' }, { uni: 'HKU', country: 'HK', name: 'HKU CS PhD (AI)' },
    { uni: 'Toronto', country: 'CA', name: 'University of Toronto / Vector PhD' }, { uni: 'Mila', country: 'CA', name: 'Mila (UdeM/McGill) PhD' },
    { uni: 'Oxford', country: 'UK', name: 'Oxford CS DPhil (AI)' }, { uni: 'Cambridge', country: 'UK', name: 'Cambridge CST PhD (ML)' },
    { uni: 'ETH', country: 'CH', name: 'ETH Zurich CS PhD (AI)' }, { uni: 'EPFL', country: 'CH', name: 'EPFL IC PhD (EDIC)' },
    { uni: 'MBZUAI', country: 'AE', name: 'MBZUAI MSc/PhD (AI)' }, { uni: 'NUS', country: 'SG', name: 'NUS CS PhD (AI)' }, { uni: 'KAIST', country: 'KR', name: 'KAIST AI graduate school' },
  ];
  const out = [];
  for (const t of targets) {
    try {
      const r = await tavilySearch(`${t.name} PhD admissions 2026 2027 application deadline open closed rolling`, { maxResults: 5 });
      let p = { status: 'unknown', deadline: null, notes: '', visa: '' };
      try { p = JSON.parse(stripJson(await deepseekChat([{ role: 'user', content: `From the search results, extract current status for ${t.name}. Return JSON only: {"status":"open"|"closed"|"rolling"|"unknown","deadline":"string or null","notes":"1 sentence","visa":"intl/visa note or empty"}. RAW: ${JSON.stringify(r.results || []).slice(0, 9000)}` }], { temperature: 0.05, json: true }))); } catch {}
      out.push({ id: (t.uni + '-' + t.country).toLowerCase().replace(/\s+/g, '-'), program: t.name, uni: t.uni, country: t.country, status: p.status || 'unknown', deadline: p.deadline || null, notes: p.notes || '', visaNotes: p.visa || '', lastChecked: today(), source: 'lambda-deepseek-tavily' });
    } catch (e) {
      out.push({ id: (t.uni + '-' + t.country).toLowerCase(), program: t.name, uni: t.uni, country: t.country, status: 'unknown', lastChecked: today(), source: 'lambda' });
    }
  }
  return out;
}

// ── Draft a tailored job application / outreach email (returns text) ──────────
export async function draftJobApplication(job = {}, extraNotes = '') {
  const sys = `You are a precise, professional, warm application writer for Bo Shang. Use ONLY the résumé context. Write one short, high-signal email (180–280 words) tailored to the role.
- Highlight the most relevant shipped systems (Anvilwing for agent tooling; The Meridian for autonomous research+writing; DRIFT for long-horizon grounded pipelines; Frontier Model Index for daily agentic data platforms; erosolar for honest LLM work; Trenchwork for reliable infra).
- Reference verifiable tech (DeepSeek v4 Pro at 1M context, Tavily grounding, Firebase/Firestore, Go/SwiftUI/Angular, owned keys / no vendor lock-in).
- For roles noting visa/international (e.g. DeepSeek): note willingness to handle any visa/sponsorship/relocation process.
- One clear ask; 1–2 live links (erosolar.org / trenchwork.live). Never fabricate titles or metrics. Sign "— Bo Shang".
RÉSUMÉ:
${RESUME_CONTEXT}
JOB: ${JSON.stringify({ title: job.title, company: job.company, location: job.location, visa: job.visaSponsorship, desc: (job.description || '').slice(0, 600) })}
EXTRA NOTES: ${extraNotes}`;
  return (await deepseekChat([{ role: 'user', content: sys }], { temperature: 0.35, max_tokens: 1500 })).trim();
}

// ── Multilingual: translate UI/content strings via xAI Grok (public route) ───
export async function translateTexts(texts, target = 'zh') {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error('Missing XAI_API_KEY');
  const list = (Array.isArray(texts) ? texts : []).filter((t) => typeof t === 'string' && t.trim()).slice(0, 80);
  if (!list.length) return {};
  const langName = target === 'zh' ? 'Simplified Chinese' : target;
  const prompt = `You localize a software engineer's portfolio UI. Translate EACH input string to ${langName}. Return ONLY a JSON object mapping each EXACT input string to {"zh":"<translation>","py":"<Hanyu Pinyin with tone marks>"}. Natural, concise, UI-appropriate; keep proper names sensible (résumé->简历). Inputs: ${JSON.stringify(list)}`;
  const r = await fetch(`${XAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: XAI_MODEL, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`xAI ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const j = await r.json();
  return JSON.parse(j.choices?.[0]?.message?.content || '{}');
}

// ── GitHub commit feed (authenticated; PUBLIC repos only, safe for the page) ──
const GITHUB_API = 'https://api.github.com';
async function gh(path, token) {
  const r = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'erosolar-commit-tracker',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status} ${path}`);
  return r.json();
}
export async function fetchPublicCommits({ user, token, maxRepos = 8, perRepo = 8 } = {}) {
  user = user || process.env.GITHUB_USER || 'Aroxora';
  token = token || process.env.GITHUB_TOKEN || '';
  // Most-recently-pushed repos owned by the user; keep only PUBLIC non-forks.
  const repos = (await gh(`/users/${user}/repos?sort=pushed&direction=desc&per_page=30&type=owner`, token))
    .filter((r) => !r.private && !r.fork)
    .slice(0, maxRepos);
  const out = [];
  await Promise.all(repos.map(async (repo) => {
    try {
      const commits = await gh(`/repos/${repo.full_name}/commits?per_page=${perRepo}`, token);
      for (const c of commits) {
        out.push({
          repo: repo.full_name,
          message: (c.commit?.message || '').split('\n')[0].slice(0, 140),
          sha: (c.sha || '').slice(0, 7),
          url: c.html_url,
          date: new Date(c.commit?.author?.date || c.commit?.committer?.date || 0).getTime(),
        });
      }
    } catch { /* skip a repo that errors */ }
  }));
  out.sort((a, b) => b.date - a.date);
  return out.slice(0, 80);
}

// ── Admin chatbot reply (context passed in from the client) ──────────────────
export async function chatReply(message, history = [], context = {}) {
  const sys = `You are Bo's private strategic co-pilot on erosolar.org, with live context (jobs, PhD/lab status, the dated update log) passed in from the client. Current date: ${today()}.
You can help draft job applications and outreach, choose targets (esp. visa-track roles like DeepSeek, plus Anthropic/OpenAI/xAI/Google AI and red-team/AI-safety/eng), review pending applications, toggle autoApply / agentic outreach, surface live PhD status, and suggest site updates.
Be concise; cite sources/dates when relevant. For an action the UI can take, end with one line "ACTION: ..." (e.g. "ACTION: scan jobs now", "ACTION: toggle autoApply on", "ACTION: log update: <text>").
CONTEXT: ${JSON.stringify(context).slice(0, 14000)}`;
  const msgs = [{ role: 'system', content: sys }, ...(history || []).slice(-8), { role: 'user', content: message }];
  return (await deepseekChat(msgs, { temperature: 0.35, max_tokens: 6000 })).trim();
}
