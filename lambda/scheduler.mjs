// OPTIONAL scheduled scanner — runs daily on EventBridge with no browser in the
// loop, so it DOES write Firestore itself and therefore needs a service-account
// key (FIREBASE_SERVICE_ACCOUNT = raw JSON or base64) for project
// twitch-womens-history. The interactive admin path (api.mjs) needs no key.
//
// Without the key this handler is a no-op; the on-demand "Force scan" button and
// the chatbot still populate data via the admin browser.
import admin from 'firebase-admin';
import { runJobsScan, runPhdTracker } from './core.mjs';

function initFirestore() {
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || !raw.trim()) return null;
  const json = raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  admin.initializeApp({ credential: admin.credential.cert(json), projectId: json.project_id || 'twitch-womens-history' });
  return admin.firestore();
}

export const handler = async () => {
  const db = initFirestore();
  if (!db) { console.log('FIREBASE_SERVICE_ACCOUNT not set — scheduled scan is a no-op (use the on-demand admin path).'); return { statusCode: 200, body: 'no-op' }; }
  const FV = admin.firestore.FieldValue;
  const today = new Date().toISOString().slice(0, 10);
  const out = {};
  try {
    const jobs = await runJobsScan();
    const b = db.batch();
    jobs.forEach((j) => b.set(db.collection('jobs').doc(j.id), { ...j, fetchedAt: FV.serverTimestamp() }, { merge: true }));
    await b.commit();
    await db.collection('updates').add({ date: today, type: 'jobs', title: 'Daily AI-jobs scan (Lambda)', body: `Agentic sweep of AI labs + AI-eng/red-team/dev roles. ${jobs.length} normalized openings; visa/sponsorship flagged. DeepSeek-v4-pro + Tavily.`, agent: 'lambda+deepseek+tavily', createdAt: FV.serverTimestamp() });
    out.jobs = jobs.length;
  } catch (e) { out.jobsErr = String(e).slice(0, 200); }
  try {
    const phds = await runPhdTracker();
    const b = db.batch();
    phds.forEach((p) => b.set(db.collection('phdPrograms').doc(p.id), { ...p, updatedAt: FV.serverTimestamp() }, { merge: true }));
    await b.commit();
    await db.collection('updates').add({ date: today, type: 'phd', title: 'PhD & AI-lab status sweep (Lambda)', body: `Live status across top US/CN/HK/Europe/Canada AI PhD programs. ${phds.length} records. DeepSeek-v4-pro + Tavily.`, agent: 'lambda+deepseek+tavily', createdAt: FV.serverTimestamp() });
    out.phd = phds.length;
  } catch (e) { out.phdErr = String(e).slice(0, 200); }
  console.log('scheduled scan done', out);
  return { statusCode: 200, body: JSON.stringify(out) };
};
