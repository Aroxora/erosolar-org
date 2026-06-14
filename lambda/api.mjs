// AWS Lambda HTTP API (Lambda Function URL) — the admin compute backend for
// erosolar.org on the Firebase Spark plan (no Cloud Functions).
//
// Auth: every call must carry `Authorization: Bearer <Firebase ID token>`.
// We verify the token with firebase-admin (needs ONLY the project id — no
// service-account key) and require the email to be the single admin.
//
// Routes (POST, JSON):
//   /chat        { message, history?, context? }   -> { reply }
//   /scan-jobs   {}                                  -> { jobs: [...] }
//   /scan-phd    {}                                  -> { programs: [...] }
//   /draft       { job, notes? }                     -> { draft }
//
// The browser (authenticated admin) persists results to Firestore directly,
// under the security rules that allow daburu.dragon@gmail.com to write.
import admin from 'firebase-admin';
import { ADMIN_EMAIL, runJobsScan, runPhdTracker, draftJobApplication, chatReply, translateTexts, fetchPublicCommits, findApplications } from './core.mjs';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'twitch-womens-history';
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });

const CORS = {
  'Access-Control-Allow-Origin': process.env.ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '3600',
};

function reply(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', ...CORS }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  const method = event?.requestContext?.http?.method || event?.httpMethod || 'POST';
  const path = (event?.rawPath || event?.requestContext?.http?.path || event?.path || '/').replace(/\/+$/, '') || '/';

  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (method !== 'POST') return reply(405, { error: 'method not allowed' });

  const path0 = (event?.rawPath || event?.requestContext?.http?.path || event?.path || '/');
  let body0 = {};
  try { body0 = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '{}')); } catch {}

  // ── PUBLIC route: /translate (visitors translate the UI; no admin token) ──
  if (path0.replace(/\/+$/, '').endsWith('/translate')) {
    try { return reply(200, { map: await translateTexts(body0.texts, body0.target || 'zh') }); }
    catch (e) { return reply(500, { error: String(e?.message || e).slice(0, 200) }); }
  }

  // ── PUBLIC route: /commits (authenticated GitHub feed; PUBLIC repos only) ──
  if (path0.replace(/\/+$/, '').endsWith('/commits')) {
    try { return reply(200, { commits: await fetchPublicCommits() }); }
    catch (e) { return reply(500, { error: String(e?.message || e).slice(0, 200) }); }
  }

  // ── verify Firebase ID token + admin email (everything below is admin-only) ──
  const headers = event.headers || {};
  const authz = headers.authorization || headers.Authorization || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (!token) return reply(401, { error: 'missing bearer token' });
  let decoded;
  try { decoded = await admin.auth().verifyIdToken(token); }
  catch (e) { return reply(401, { error: 'invalid token: ' + String(e?.message || e).slice(0, 120) }); }
  if ((decoded.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return reply(403, { error: 'admin only' });

  let data = {};
  try { data = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '{}')); }
  catch { return reply(400, { error: 'bad json body' }); }

  try {
    const route = path.replace(/^.*\/(?=[a-z-]+$)/, '/').replace(/^([^/])/, '/$1'); // tolerate stage prefixes
    const r = route.endsWith('/chat') ? { reply: await chatReply(data.message, data.history, data.context) }
      : route.endsWith('/scan-jobs') ? { jobs: await runJobsScan() }
      : route.endsWith('/scan-phd') ? { programs: await runPhdTracker() }
      : route.endsWith('/draft') ? { draft: await draftJobApplication(data.job || {}, data.notes || '') }
      : route.endsWith('/find-applications') ? { applications: await findApplications(data || {}) }
      : null;
    if (!r) return reply(404, { error: 'unknown route ' + path });
    return reply(200, r);
  } catch (e) {
    console.error('handler error', e);
    return reply(500, { error: String(e?.message || e).slice(0, 300) });
  }
};
