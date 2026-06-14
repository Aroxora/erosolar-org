#!/usr/bin/env node
/**
 * Local Proton outreach + auto job application worker for erosolar-org.
 * - Connects to local Proton Bridge (IMAP/SMTP) using provided details (erolunar@pm.me).
 * - Polls Firestore for:
 *     settings/outreach { autoEnabled }
 *     settings/autoApply { enabled }
 *     outreachQueue + applicationQueue
 * - General outreach: drafts (DeepSeek) + sends + FULL history to outreachHistory.
 * - Job applications (the new auto capability): when autoApply ON, can auto-select high-fit unfilled roles
 *   (prioritizes DeepSeek + other labs mentioning visa/sponsorship/international, AI eng/red-team titles),
 *   drafts personalized using rich shipped-project resume context (Anvilwing, Meridian, DRIFT, Frontier Index,
 *   Trenchwork, Endearo, erosolar), sends, logs COMPLETE body + job ref + status to jobApplications (and mirrors
 *   to outreachHistory for unified view).
 * - Admin controls everything from the site (topbar toggles, /jobs "Queue app", /applications page, chatbot "toggle autoApply on", "draft app for...", "queue application...").
 *
 * IMAP/SMTP (from user):
 *   IMAP: 127.0.0.1:1143 user=erolunar@pm.me pass=... STARTTLS
 *   SMTP: 127.0.0.1:1025 user=... pass=... SSL
 *
 * Run:
 *   cd outreach && npm i
 *   cp .env.example .env   # fill keys + bridge pass + path to service-account.json or use ADC
 *   npm start   (or with DRY_RUN=true)
 *
 * For 24/7: use launchd (see install.sh) or a process manager. The worker is the trusted executor for all sends.
 */

import 'dotenv/config';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import admin from 'firebase-admin';

const DRY = process.env.DRY_RUN === 'true';
const ADMIN_EMAIL = 'daburu.dragon@gmail.com';

// Secrets come ONLY from the environment (outreach/.env, gitignored). Never hardcode
// credentials in source — see outreach/.env.example for the variables to set.
const IMAP_HOST = process.env.IMAP_HOST || '127.0.0.1';
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '1143', 10);
const IMAP_USER = process.env.IMAP_USER || 'erolunar@pm.me';
const IMAP_PASS = process.env.IMAP_PASS || '';
const IMAP_TLS = (process.env.IMAP_TLS || 'STARTTLS').toUpperCase(); // STARTTLS or SSL

const SMTP_HOST = process.env.SMTP_HOST || '127.0.0.1';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '1025', 10);
const SMTP_USER = process.env.SMTP_USER || IMAP_USER;
const SMTP_PASS = process.env.SMTP_PASS || IMAP_PASS;
const SMTP_SECURE = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'; // true for implicit SSL

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';

if (!DEEPSEEK_API_KEY) console.warn('[worker] DEEPSEEK_API_KEY not set — drafting will fail until you fill outreach/.env');
if (!IMAP_PASS && !DRY) console.warn('[worker] IMAP_PASS/SMTP_PASS not set — sending will fail until you fill outreach/.env (or run DRY_RUN=true)');

// Firebase Admin (service account recommended for local worker; falls back to ADC)
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp();
} else {
  // For pure local testing without full ADC, you can point at a downloaded serviceAccount.json
  const saPath = process.env.SERVICE_ACCOUNT || './service-account.json';
  try {
    admin.initializeApp({ credential: admin.credential.cert(saPath) });
  } catch {
    admin.initializeApp(); // hope for default creds
  }
}
const db = admin.firestore();

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

async function deepseekDraft(prompt) {
  const r = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: 'You are a concise, professional, warm outreach writer for Bo Shang. Draft short, specific, high-signal emails to AI labs / professors / teams. Always include a clear ask and a one-line bio + link to erosolar.org or trenchwork.live. Sign as Bo Shang. Never fabricate credentials.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    }),
  });
  if (!r.ok) throw new Error('DeepSeek draft fail: ' + await r.text());
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}

// ── Tavily research on a target (grounds the draft) ──────────────────────────
async function tavilyResearch(query) {
  if (!TAVILY_API_KEY || !query.trim()) return '';
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query, max_results: 4, search_depth: 'advanced', include_answer: true }),
    });
    if (!r.ok) return '';
    const d = await r.json();
    const lines = [d.answer ? `Summary: ${d.answer}` : ''];
    (d.results || []).slice(0, 4).forEach((x) => lines.push(`- ${x.title}: ${(x.content || '').replace(/\s+/g, ' ').slice(0, 200)}`));
    return lines.filter(Boolean).join('\n');
  } catch { return ''; }
}

// ── RAG embeddings: local hashing vector by default; OpenAI if a key is set ──
function hashEmbed(text, dim = 256) {
  const v = new Array(dim).fill(0);
  for (const t of (text || '').toLowerCase().match(/[a-z0-9]{2,}/g) || []) {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
    v[(h >>> 0) % dim] += 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}
function cosine(a, b) { let s = 0; for (let i = 0; i < Math.min(a.length, b.length); i++) s += a[i] * b[i]; return s; }
async function embed(text) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: (text || '').slice(0, 8000) }),
      });
      if (r.ok) { const j = await r.json(); return { vec: j.data[0].embedding, model: 'openai-text-embedding-3-small' }; }
    } catch { /* fall back */ }
  }
  return { vec: hashEmbed(text), model: 'hash-256' };
}
// Retrieve the most relevant prior outreach for grounding/consistency.
async function ragContext(queryVec, limit = 3) {
  try {
    const snap = await db.collection('outreachHistory').orderBy('sentAt', 'desc').limit(80).get();
    const scored = [];
    snap.forEach((doc) => { const x = doc.data(); if (Array.isArray(x.vec) && x.vec.length === queryVec.length) scored.push({ score: cosine(queryVec, x.vec), x }); });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit).filter((s) => s.score > 0.15);
    if (!top.length) return '';
    return 'RELEVANT PAST OUTREACH (keep consistent; do not repeat verbatim):\n' +
      top.map((s) => `- to ${s.x.to} re "${s.x.subject}": ${(s.x.bodySent || '').slice(0, 160)}`).join('\n');
  } catch { return ''; }
}

function makeTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true = port 465 implicit TLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: SMTP_SECURE ? undefined : { rejectUnauthorized: false }, // for STARTTLS local bridge
  });
}

async function sendMail({ to, subject, text, html }) {
  if (DRY) {
    console.log('[DRY] Would send to', to, 'subj:', subject);
    console.log(text?.slice(0, 400));
    return { messageId: 'dry-' + Date.now() };
  }
  const tx = makeTransporter();
  const info = await tx.sendMail({
    from: `Bo Shang via agent <${SMTP_USER}>`,
    to,
    subject,
    text,
    html: html || text,
    headers: { 'X-Agent': 'erosolar-org-outreach-worker' },
  });
  return info;
}

async function getAutoEnabled() {
  const s = await db.collection('settings').doc('outreach').get();
  return !!(s.data()?.autoEnabled);
}

async function getAutoApplyEnabled() {
  const s = await db.collection('settings').doc('autoApply').get();
  return !!(s.data()?.enabled);
}

// Compact resume context for job application drafting (same spirit as CF version)
const APP_RESUME = `Bo Shang builds owned, verifiable agentic systems and load-bearing infra. Shipped: Anvilwing (DeepSeek v4 Pro 1M-context terminal coding agent, npm-published, adversarial verifier, permission modes, headless SDK); The Meridian (fully autonomous Economist-style newspaper: DeepSeek plans/reports/writes + TTS, multi-platform Angular/iOS/Watch + VAPID); DRIFT (hard-science screenplay site with living weekly DeepSeek+Tavily science curator, long-horizon video pipeline using Seedance chaining + ffmpeg, grounded companion); Frontier Model Index (3 live auto-updated AI atlas sites + iOS, daily Tavily+DeepSeek synthesis to Firestore); erosolar (honest small CoT LLM pipeline with measured metrics only + Qwen agent stack + Angular chat); Endearo (24/7 life-assistant with Proton Bridge + local daemons, memory/todos, momentum coaching); Trenchwork (Go desktop activity tracker + iOS/Watch Live Activities + Tailscale approvals for agent runs). All owner-controlled, DeepSeek+Tavily heavy, no vendor lock-in. Open to international roles and willing to handle any required visa/sponsorship/relocation process. Links: erosolar.org, trenchwork.live.`.trim();

// ════════════════════════════════════════════════════════════════════════════
//  INBOUND MAIL: read (non-destructive), fix bounces, triage replies via DeepSeek
// ════════════════════════════════════════════════════════════════════════════
const HUMAN_EMAIL = process.env.HUMAN_EMAIL || 'bo@shang.software';

async function deepseekRaw(messages, model = 'deepseek-v4-pro', json = false, max_tokens = 1600) {
  const r = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens, ...(json ? { response_format: { type: 'json_object' } } : {}) }),
  });
  if (!r.ok) throw new Error('DeepSeek ' + r.status + ': ' + (await r.text()).slice(0, 160));
  return (await r.json()).choices?.[0]?.message?.content?.trim() || '';
}

async function getMailCursor() { try { return (await db.collection('settings').doc('mailCursor').get()).data()?.inboxUid || 0; } catch { return 0; } }
async function setMailCursor(uid) { try { await db.collection('settings').doc('mailCursor').set({ inboxUid: uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }); } catch {} }

function looksLikeBounce(p) {
  const from = (p.from?.text || '').toLowerCase();
  const subj = (p.subject || '').toLowerCase();
  return /mailer-daemon|postmaster|mail delivery (system|subsystem)/.test(from)
    || /undeliver|delivery status notification|delivery (failure|incomplete)|returned mail|failure notice|address not found/.test(subj);
}
function extractFailedAddr(p) {
  const body = `${p.text || ''} ${p.html || ''}`;
  const m = body.match(/final-recipient:\s*rfc822;\s*<?([^\s<>]+@[^\s<>]+)/i)
    || body.match(/<([^\s<>]+@[^\s<>]+)>[^@]{0,40}?[45]\d\d/)
    || body.match(/([^\s<>]+@[^\s<>]+)[^@]{0,40}?(?:not found|does not exist|unknown|no such user|undeliverable)/i);
  return m ? m[1].toLowerCase() : '';
}
async function recentOutreachTo(addr) {
  try {
    const snap = await db.collection('outreachHistory').where('to', '==', addr).limit(10).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }));
    docs.sort((a, b) => (b.sentAt?.toMillis?.() || 0) - (a.sentAt?.toMillis?.() || 0));
    return docs[0] || null;
  } catch { return null; }
}
async function emailHuman(subject, body) {
  try { await sendMail({ to: HUMAN_EMAIL, subject: `[outreach] ${subject}`, text: body }); console.log('[mail] notified human:', subject); }
  catch (e) { console.warn('[mail] human notify failed:', e.message); }
}
async function logTriage(rec) {
  try {
    const emb = await embed(`${rec.subject || ''} ${rec.summary || rec.reason || ''}`);
    await db.collection('mailTriage').add({ ...rec, vec: emb.vec, embModel: emb.model, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  } catch (e) { console.warn('[mail] triage log failed:', e.message); }
}

async function handleBounce(p, outreachOn) {
  const bad = extractFailedAddr(p);
  let fix = { fixable: false };
  if (bad) {
    try { fix = JSON.parse(await deepseekRaw([{ role: 'user', content: `An outreach email to "${bad}" bounced. If this address has an OBVIOUS typo (gmial->gmail, missing/wrong TLD, etc.), return JSON {"fixable":true,"corrected":"<addr>","confidence":0-1}; otherwise {"fixable":false}. JSON only.` }], 'deepseek-v4-pro', true)); } catch {}
  }
  const orig = bad ? await recentOutreachTo(bad) : null;
  if (orig) { try { await orig.ref.update({ status: 'bounced', bounceAt: admin.firestore.FieldValue.serverTimestamp() }); } catch {} }

  if (fix.fixable && fix.corrected && fix.confidence >= 0.8 && bad !== fix.corrected && outreachOn) {
    await db.collection('outreachQueue').add({ to: fix.corrected, subject: (orig?.subject || p.subject || 'Following up').replace(/^(re|fwd):\s*/i, ''), notes: `auto-corrected from bounced ${bad}`, status: 'queued', requestedBy: 'mail-triage', requestedAt: admin.firestore.FieldValue.serverTimestamp() });
    await logTriage({ kind: 'bounce-fixed', badAddress: bad, corrected: fix.corrected, subject: p.subject || '' });
    console.log('[mail] auto-corrected bounced address', bad, '->', fix.corrected);
  } else {
    await emailHuman(`Broken address needs you: ${bad || 'unknown'}`, `An outreach email bounced and DeepSeek found no confident automatic fix.\n\nFailed address: ${bad || '(could not extract)'}\nBounce subject: ${p.subject || ''}\n\nRequired human action: verify / correct the recipient address, or remove this contact.\n\n— agentic outreach worker`);
    await logTriage({ kind: 'bounce-human', badAddress: bad, subject: p.subject || '' });
  }
}

async function handleReply(p, outreach, outreachOn) {
  const replyText = (p.text || '').slice(0, 4000);
  let j = { action: 'human', reason: 'could not judge', followupDraft: '', humanActions: 'Review the reply.', summary: '' };
  try {
    j = JSON.parse(await deepseekRaw([{ role: 'user', content:
`You triage replies to Bo Shang's outreach. Original outreach to ${outreach.to}, subject "${outreach.subject}". Their reply:
"""${replyText}"""
Return JSON ONLY:
{"action":"followup"|"human"|"deadend","reason":"<1 sentence>","followupDraft":"<if followup: a short warm specific reply from Bo Shang, 100-180 words, end '— Bo Shang'; else empty>","humanActions":"<if human: concrete actions Bo must take; else empty>","summary":"<if deadend: 1-2 sentence reason; else empty>"}
Rules: "followup" ONLY if a follow-up is absolutely sensible and likely productive (genuine interest / a question / a next step). "human" if it needs Bo's judgment, a decision, credentials, or a meeting. "deadend" if it's a clear no / unsubscribe / irrelevant / no-reply auto-response.` }], 'deepseek-v4-pro', true));
  } catch (e) { console.warn('[mail] reply judge failed:', e.message); }

  if (j.action === 'followup' && j.followupDraft && outreachOn) {
    await db.collection('outreachQueue').add({ to: outreach.to, subject: 'Re: ' + (outreach.subject || ''), body: j.followupDraft, notes: 'auto follow-up (DeepSeek judged sensible)', status: 'queued', requestedBy: 'mail-triage', requestedAt: admin.firestore.FieldValue.serverTimestamp() });
    await logTriage({ kind: 'reply-followup', to: outreach.to, subject: outreach.subject || '', reason: j.reason });
    console.log('[mail] queued sensible follow-up to', outreach.to);
  } else if (j.action === 'human' || (j.action === 'followup' && !outreachOn)) {
    await emailHuman(`Reply needs you: ${outreach.to}`, `${outreach.to} replied to "${outreach.subject}".\n\nDeepSeek-v4-pro: ${j.reason}\n\nRequired human action(s):\n${j.humanActions || j.followupDraft || 'Review and respond.'}\n\n— Their reply —\n${replyText.slice(0, 1500)}`);
    await logTriage({ kind: 'reply-human', to: outreach.to, subject: outreach.subject || '', reason: j.reason });
  } else {
    let summary = j.summary || '';
    try { if (!summary) summary = await deepseekRaw([{ role: 'user', content: `In 1-2 sentences, why is this reply a dead end (no follow-up warranted)? ${replyText.slice(0, 1500)}` }], 'deepseek-v4-flash', false, 200); } catch {}
    await emailHuman(`Dead end (FYI, no action): ${outreach.to}`, `Marking outreach to ${outreach.to} ("${outreach.subject}") a dead end — no sensible follow-up.\n\nSummary (deepseek-v4-flash): ${summary}\n\n— agentic outreach worker`);
    await logTriage({ kind: 'reply-deadend', to: outreach.to, subject: outreach.subject || '', summary });
  }
}

async function triageMessage(p, outreachOn) {
  if (looksLikeBounce(p)) return handleBounce(p, outreachOn);
  const fromAddr = (p.from?.value?.[0]?.address || '').toLowerCase();
  if (!fromAddr) return;
  const outreach = await recentOutreachTo(fromAddr);
  if (outreach) return handleReply(p, outreach, outreachOn);
  // not a bounce or a known reply → leave it (read-only; nothing to do)
}

// Read INBOX non-destructively (never marks mail seen), triage anything new.
async function readAndTriageInbox(outreachOn) {
  let client;
  try {
    client = new ImapFlow({ host: IMAP_HOST, port: IMAP_PORT, secure: IMAP_TLS === 'SSL', auth: { user: IMAP_USER, pass: IMAP_PASS }, logger: false, tls: { rejectUnauthorized: false } });
    await client.connect();
  } catch (e) { console.warn('[mail] IMAP connect failed:', e.message); return 0; }
  let processed = 0;
  const lock = await client.getMailboxLock('INBOX');
  try {
    const cursor = await getMailCursor();
    if (cursor === 0) {
      const next = client.mailbox?.uidNext || 1;
      await setMailCursor(Math.max(0, next - 1));
      console.log('[mail] bootstrapped cursor at uid', next - 1, '— future mail will be triaged');
      return 0;
    }
    let maxUid = cursor;
    for await (const m of client.fetch({ uid: `${cursor + 1}:*` }, { uid: true, source: true })) {
      if (m.uid <= cursor) continue;
      maxUid = Math.max(maxUid, m.uid);
      try { await triageMessage(await simpleParser(m.source), outreachOn); processed++; }
      catch (e) { console.warn('[mail] triage fail uid', m.uid, e.message); }
    }
    if (maxUid > cursor) await setMailCursor(maxUid);
  } finally { lock.release(); await client.logout().catch(() => {}); }
  return processed;
}

// ════════════════════════════════════════════════════════════════════════════
//  GITHUB COMMIT MOMENTUM: alert bo@shang.software when pace drops below average
//  (deepseek-v4-flash draft; at most one email / 12h to respect sleep)
// ════════════════════════════════════════════════════════════════════════════
const GITHUB_USER = process.env.GITHUB_USER || 'Aroxora';

async function fetchCommitTimes() {
  const token = process.env.GITHUB_TOKEN || '';
  const headers = { 'User-Agent': 'erosolar-momentum-worker', Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  // With a token: comprehensive momentum across ALL your repos (public + private).
  if (token) {
    try {
      const reposRes = await fetch('https://api.github.com/user/repos?sort=pushed&direction=desc&per_page=15&affiliation=owner', { headers });
      if (reposRes.ok) {
        const repos = await reposRes.json();
        const times = [];
        await Promise.all((repos || []).slice(0, 12).map(async (repo) => {
          try {
            const cRes = await fetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=8`, { headers });
            if (!cRes.ok) return;
            for (const c of await cRes.json()) times.push(new Date(c.commit?.author?.date || c.commit?.committer?.date || 0).getTime());
          } catch { /* skip a repo */ }
        }));
        if (times.length) return times.sort((a, b) => b - a);
      }
    } catch { /* fall through to public events */ }
  }

  // Fallback (no token / error): public push events only.
  try {
    const r = await fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`, { headers });
    if (!r.ok) return [];
    const events = await r.json();
    const times = [];
    for (const e of events) if (e.type === 'PushEvent' && e.payload?.commits?.length) for (const _ of e.payload.commits) times.push(new Date(e.created_at).getTime());
    return times.sort((a, b) => b - a);
  } catch { return []; }
}

async function checkGithubMomentum() {
  const times = await fetchCommitTimes();
  if (times.length < 4) return;
  const gaps = [];
  for (let i = 0; i < times.length - 1; i++) gaps.push(times[i] - times[i + 1]);
  const avg = gaps.reduce((s, x) => s + x, 0) / gaps.length;
  const sinceLast = Date.now() - times[0];
  if (sinceLast <= avg) return; // on pace or ahead

  const s = await db.collection('settings').doc('commitAlert').get();
  const lastSent = s.data()?.lastSentAt?.toMillis?.() || 0;
  if (Date.now() - lastSent < 12 * 3600 * 1000) return; // max one email / 12h

  const hrs = (sinceLast / 3600000).toFixed(1);
  const avgHrs = (avg / 3600000).toFixed(1);
  let body = `You've gone ${hrs}h since your last GitHub commit; your recent average between commits is ${avgHrs}h. You're below your usual pace — a small commit would get the streak moving. — your momentum agent`;
  try {
    body = await deepseekRaw([{ role: 'user', content: `Write a short (<90 words), warm, motivating nudge to Bo Shang. It's been ${hrs} hours since his last GitHub commit; his recent average between commits is ${avgHrs} hours, so he's below pace. Encourage one small concrete commit. Sign "— your momentum agent".` }], 'deepseek-v4-flash', false, 220);
  } catch {}
  if (!DRY) await sendMail({ to: HUMAN_EMAIL, subject: `[momentum] ${hrs}h since last commit (avg ${avgHrs}h)`, text: body });
  else console.log('[github][DRY] would alert:', hrs, 'h vs avg', avgHrs);
  await db.collection('settings').doc('commitAlert').set({ lastSentAt: admin.firestore.FieldValue.serverTimestamp(), sinceLastHrs: Number(hrs), avgHrs: Number(avgHrs), commitsAnalyzed: times.length }, { merge: true });
  console.log('[github] momentum alert:', hrs, 'h vs avg', avgHrs);
}

async function drainQueue() {
  const snap = await db.collection('outreachQueue').where('status', '==', 'queued').limit(5).get();
  if (snap.empty) return 0;

  let sent = 0;
  for (const d of snap.docs) {
    const q = { id: d.id, ...d.data() };
    try {
      // Agentic grounding: Tavily research on the target + RAG over past outreach.
      const research = await tavilyResearch(`${q.to} ${q.subject} ${q.notes || ''}`.trim());
      const queryEmb = await embed(`${q.subject} ${q.notes || ''}`);
      const rag = await ragContext(queryEmb.vec);

      let body = q.body || '';
      if (!body || body.length < 40) {
        const prompt = `Target: ${q.to}
Subject hint: ${q.subject}
Notes/context: ${q.notes || 'General AI lab or research outreach for collaboration / opportunities / PhD pipeline / jobs discussion.'}
Current date: ${new Date().toISOString().slice(0, 10)}.
${research ? `\nLIVE RESEARCH ON THE TARGET (Tavily — use only what's relevant, never fabricate):\n${research}\n` : ''}${rag ? `\n${rag}\n` : ''}
Write a short professional email (120-220 words) from Bo Shang. Reference specific recent work (owned DeepSeek-powered agents Anvilwing/Endearo, agentic newsroom The Meridian, honest LLM pipeline erosolar, DRIFT hard-science site, Frontier Model Index, Trenchwork) only if relevant. Personalize using the research. Include one clear next step or question. Link to https://erosolar.org or https://trenchwork.live. End with "— Bo Shang".`;
        body = await deepseekDraft(prompt);
      }

      const info = await sendMail({
        to: q.to,
        subject: q.subject,
        text: body + `\n\n—\nSent by agentic outreach worker (controlled by Bo). Full history at admin portal. erosolar.org`,
      });

      // Write FULL history + RAG embedding (Firestore = history; vec = retrieval).
      const sentEmb = await embed(`${q.subject}\n${body}`);
      await db.collection('outreachHistory').add({
        to: q.to,
        subject: q.subject,
        bodySent: body,
        research: research || '',
        vec: sentEmb.vec,
        embModel: sentEmb.model,
        agent: 'deepseek-v4-pro + tavily',
        messageId: info.messageId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        via: `proton-bridge-local-${SMTP_HOST}:${SMTP_PORT}`,
        requestedBy: q.requestedBy || ADMIN_EMAIL,
        queueId: q.id,
        notes: q.notes || '',
        _scanDate: new Date().toISOString().slice(0, 10),
      });

      // Mark or delete queue item
      await d.ref.delete();
      sent++;
      console.log('Sent + logged:', q.subject, '->', q.to);
    } catch (e) {
      console.error('Failed item', q.id, e);
      await d.ref.update({ status: 'error', error: String(e), errorAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }
  return sent;
}

async function drainApplications() {
  const snap = await db.collection('applicationQueue').where('status', '==', 'queued').limit(4).get();
  if (snap.empty) return 0;

  let sent = 0;
  for (const d of snap.docs) {
    const q = { id: d.id, ...d.data() };
    try {
      let body = q.body || '';
      let subject = q.subject || `Application for ${q.title} at ${q.company}`;

      if (!body || body.length < 50) {
        // Job-specific personalized draft (uses full context + visa emphasis)
        const visaNote = (q.notes || '').toLowerCase().includes('visa') || /deepseek|china|hong kong|hk/i.test(q.company + ' ' + (q.notes||'')) ? 'Emphasize willingness to pursue any required visa / sponsorship / international relocation process.' : '';
        const prompt = `Target company/role: ${q.company} — ${q.title}
Contact / to: ${q.to || 'hiring / recruiting / research team (use a plausible address if none provided, or leave as "to the team")'}
Context: ${q.notes || 'AI engineering, research engineering, red team / safety, or infrastructure role. Prioritize frontier labs and AI-dev work.'}
${visaNote}
Current date: ${new Date().toISOString().slice(0,10)}.
Write a concise, professional, high-signal application email (160-260 words) from Bo Shang.
Use the resume context below. Tailor to the role — highlight the closest shipped projects (e.g. Anvilwing for agent tooling, Meridian for autonomous research+writing pipelines, DRIFT for long-horizon grounded systems, Frontier Model Index for daily agentic data platforms, Trenchwork for reliable momentum infra).
Include one clear next step (conversation, interview, technical discussion). Link https://erosolar.org and/or https://trenchwork.live.
Never invent credentials. End with "— Bo Shang".
RESUME: ${APP_RESUME}
`;
        body = await deepseekDraft(prompt);
      }

      const toAddr = q.to || `${q.company.toLowerCase().replace(/[^a-z0-9]/g,'')}@example-careers.com`; // placeholder; admin should provide real to when queuing
      const info = await sendMail({
        to: toAddr,
        subject,
        text: body + `\n\n—\nSent by Bo's agentic application worker. Full history + context in admin portal (erosolar.org).`,
      });

      // Log FULL application (unified history)
      await db.collection('jobApplications').add({
        jobId: q.jobId || null,
        title: q.title,
        company: q.company,
        to: toAddr,
        subject,
        bodySent: body,
        visaContext: q.notes || '',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent',
        via: `proton-bridge-local-${SMTP_HOST}:${SMTP_PORT}`,
        requestedBy: q.requestedBy || ADMIN_EMAIL,
        queueId: q.id,
        notes: q.notes || '',
        _scanDate: new Date().toISOString().slice(0, 10),
      });

      // Also mirror a lightweight record to outreachHistory for unified view
      await db.collection('outreachHistory').add({
        to: toAddr,
        subject,
        bodySent: body,
        messageId: info.messageId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        via: `job-application-proton-${SMTP_HOST}:${SMTP_PORT}`,
        requestedBy: q.requestedBy || ADMIN_EMAIL,
        queueId: q.id,
        notes: `JOB APP: ${q.title} @ ${q.company}`,
        _scanDate: new Date().toISOString().slice(0, 10),
      });

      await d.ref.delete();
      sent++;
      console.log('Application sent + FULL history logged:', subject, '->', toAddr);
    } catch (e) {
      console.error('Failed application', q.id, e);
      await d.ref.update({ status: 'error', error: String(e), errorAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }
  return sent;
}

// Optional auto-select when autoApply is on and queue is empty: pick 1-2 strong unfilled fits
async function autoSelectAndQueueIfNeeded() {
  const autoApply = await getAutoApplyEnabled();
  if (!autoApply) return 0;

  const queueCount = (await db.collection('applicationQueue').where('status', '==', 'queued').get()).size;
  if (queueCount > 0) return 0; // respect explicit queues

  // Find recent jobs without a recent jobApplication
  const jobsSnap = await db.collection('jobs').orderBy('fetchedAt', 'desc').limit(25).get();
  const recentApps = await db.collection('jobApplications').orderBy('sentAt', 'desc').limit(30).get();
  const appliedKeys = new Set(recentApps.docs.map(d => {
    const data = d.data();
    return (data.company || '').toLowerCase() + '|' + (data.title || '').toLowerCase().slice(0,30);
  }));

  const candidates = [];
  for (const jd of jobsSnap.docs) {
    const j = { id: jd.id, ...jd.data() };
    const key = (j.company || '').toLowerCase() + '|' + (j.title || '').toLowerCase().slice(0,30);
    if (appliedKeys.has(key)) continue;

    const isStrong = /engineer|research|scientist|red.?team|safety|ml|llm|ai|deepseek|anthropic|openai|x.ai|google/i.test((j.title || '') + ' ' + (j.company || ''));
    const visaFriendly = /visa|sponsor|international|relocation|h1b|deepseek/i.test((j.visaSponsorship || '') + ' ' + (j.description || '') + ' ' + (j.company || ''));
    if (isStrong || visaFriendly) {
      candidates.push(j);
    }
  }

  let queued = 0;
  for (const j of candidates.slice(0, 2)) { // at most 2 per cycle to stay conservative + rate-limited
    await db.collection('applicationQueue').add({
      jobId: j.id,
      title: j.title,
      company: j.company,
      notes: (j.visaSponsorship ? 'visa/sponsorship track — emphasize relocation & accountability strengths' : 'high-fit AI eng / infra role'),
      status: 'queued',
      requestedBy: 'auto-apply-worker',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    queued++;
    console.log('Auto-queued for application:', j.title, '@', j.company);
  }
  return queued;
}

async function maybeLogHeartbeat() {
  const enabled = await getAutoEnabled();
  if (enabled) {
    console.log('[heartbeat] outreach auto ENABLED — will drain queue on tick');
  }
  // Could also write a settings/heartbeat doc here
}

async function mainLoop() {
  console.log('=== erosolar Proton outreach worker starting ===');
  console.log('IMAP', IMAP_HOST, IMAP_PORT, 'SMTP', SMTP_HOST, SMTP_PORT, 'DRY=', DRY);

  // Optional: quick IMAP connect test (non-destructive)
  try {
    const client = new ImapFlow({
      host: IMAP_HOST,
      port: IMAP_PORT,
      secure: IMAP_TLS === 'SSL',
      auth: { user: IMAP_USER, pass: IMAP_PASS },
      logger: false,
    });
    await client.connect();
    await client.logout();
    console.log('IMAP bridge reachable (read-only test ok)');
  } catch (e) {
    console.warn('IMAP test failed (worker can still send via SMTP):', e.message);
  }

  // Main loop
  while (true) {
    try {
      await maybeLogHeartbeat();
      const outreachOn = await getAutoEnabled();
      const applyOn = await getAutoApplyEnabled();

      // Outreach (general + provider)
      if (outreachOn) {
        const n = await drainQueue();
        if (n > 0) console.log('Drained', n, 'queued outreach items');
      } else {
        const n = await drainQueue();
        if (n > 0) console.log('Manual outreach drain (auto off):', n);
      }

      // Job applications (auto + explicit)
      if (applyOn) {
        const autoQ = await autoSelectAndQueueIfNeeded();
        if (autoQ > 0) console.log('Auto-selected + queued', autoQ, 'high-fit job applications (DeepSeek/visa priority etc.)');
        const n = await drainApplications();
        if (n > 0) console.log('Drained + sent', n, 'job applications with full logged text');
      } else {
        const n = await drainApplications();
        if (n > 0) console.log('Manual application drain (autoApply off):', n);
      }

      // Inbound mail: read + triage (bounces + replies). Always reads (non-destructive);
      // third-party follow-ups are only sent when outreach is ON.
      try { const n = await readAndTriageInbox(outreachOn); if (n) console.log('[mail] triaged', n, 'new message(s)'); }
      catch (e) { console.error('[mail] inbox tick error', e.message); }

      // GitHub commit-momentum nudge (deepseek-v4-flash, max 1 email / 12h).
      try { await checkGithubMomentum(); } catch (e) { console.error('[github] tick error', e.message); }
    } catch (e) {
      console.error('Loop tick error', e);
    }
    const intervalMs = parseInt(process.env.POLL_MS || '180000', 10); // 3 min default
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mainLoop().catch(console.error);
}
