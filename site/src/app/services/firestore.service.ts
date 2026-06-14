import { Injectable } from '@angular/core';
import {
  getFirestore, collection, query, orderBy, limit, onSnapshot,
  doc, getDoc, getDocs, setDoc, addDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebase.config';
import { LAMBDA_API_BASE } from '../api.config';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export interface Job {
  id?: string; title: string; company: string; location?: string; url?: string;
  visaSponsorship?: string; description?: string; level?: string; fetchedAt?: any; source?: string;
}
export interface PhdProgram {
  id?: string; program: string; uni: string; country: string; status: string;
  deadline?: string | null; notes?: string; visaNotes?: string; lastChecked?: string;
}
export interface Update {
  id?: string; date: string; type: 'jobs' | 'phd' | 'outreach' | 'site' | 'resume' | string;
  title: string; body: string; agent?: string; createdAt?: any;
}
export interface JobApplication {
  id?: string; jobId?: string; title: string; company: string; to: string; subject: string;
  bodySent: string; visaContext?: string; sentAt?: any; status?: 'sent' | 'replied' | 'declined' | 'pending'; via?: string; notes?: string; _scanDate?: string;
}
export interface ApplicationQueueItem {
  id?: string; jobId: string; title: string; company: string; to?: string; subject?: string;
  body?: string; notes?: string; status: string; requestedBy?: string; requestedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  // ── live read listeners (public; no auth required) ─────────────────────────
  listenJobs(cb: (jobs: Job[]) => void) {
    return onSnapshot(query(collection(db, 'jobs'), orderBy('fetchedAt', 'desc'), limit(50)),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Job[]),
      () => cb([]));
  }
  listenPhds(cb: (list: PhdProgram[]) => void) {
    return onSnapshot(query(collection(db, 'phdPrograms'), orderBy('lastChecked', 'desc'), limit(60)),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PhdProgram[]),
      () => cb([]));
  }
  listenUpdates(cb: (ups: Update[]) => void) {
    return onSnapshot(query(collection(db, 'updates'), orderBy('date', 'desc'), limit(40)),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Update[]),
      () => cb([]));
  }
  listenApplications(cb: (apps: JobApplication[]) => void) {
    return onSnapshot(query(collection(db, 'jobApplications'), orderBy('sentAt', 'desc'), limit(50)),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as JobApplication[]),
      () => cb([]));
  }
  listenAppQueue(cb: (items: ApplicationQueueItem[]) => void) {
    return onSnapshot(query(collection(db, 'applicationQueue'), orderBy('requestedAt', 'desc'), limit(20)),
      (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ApplicationQueueItem[]),
      () => cb([]));
  }

  // ── settings reads ─────────────────────────────────────────────────────────
  async getOutreachAuto(): Promise<boolean> { return !!(await getDoc(doc(db, 'settings/outreach'))).data()?.['autoEnabled']; }
  async getAutoApply(): Promise<boolean> { return !!(await getDoc(doc(db, 'settings/autoApply'))).data()?.['enabled']; }

  // ── Lambda compute API (admin-only; verified by Firebase ID token) ─────────
  private adminEmail(): string { return (auth.currentUser?.email || '').toLowerCase(); }
  private async idToken(): Promise<string> {
    const u = auth.currentUser;
    if (!u) throw new Error('Sign in with Google (admin) first.');
    return u.getIdToken();
  }
  private async callLambda(path: string, body: any): Promise<any> {
    if (!LAMBDA_API_BASE) throw new Error('Agentic backend not configured yet — deploy the Lambda (lambda/deploy.sh), which sets LAMBDA_API_BASE.');
    const token = await this.idToken();
    const r = await fetch(LAMBDA_API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body || {}),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({ error: r.statusText }));
      throw new Error(e.error || ('HTTP ' + r.status));
    }
    return r.json();
  }

  // Admin chatbot — gathers light context, calls Lambda, logs the exchange.
  async callChat(message: string, history: any[] = []) {
    const context: any = {};
    try {
      const [js, ps, us] = await Promise.all([
        getDocs(query(collection(db, 'jobs'), orderBy('fetchedAt', 'desc'), limit(8))),
        getDocs(query(collection(db, 'phdPrograms'), orderBy('lastChecked', 'desc'), limit(6))),
        getDocs(query(collection(db, 'updates'), orderBy('date', 'desc'), limit(5))),
      ]);
      context.jobs = js.docs.map((d) => d.data());
      context.phds = ps.docs.map((d) => d.data());
      context.updates = us.docs.map((d) => d.data());
    } catch { /* context is best-effort */ }
    const { reply } = await this.callLambda('/chat', { message, history, context });
    try { await addDoc(collection(db, 'chatLogs'), { userEmail: this.adminEmail(), prompt: message, reply, createdAt: serverTimestamp() }); } catch {}
    return { reply, timestamp: new Date().toISOString() };
  }

  private today() { return new Date().toISOString().slice(0, 10); }

  // Force scans: Lambda computes, the admin browser persists results to Firestore.
  async triggerJobsScan() {
    const { jobs = [] } = await this.callLambda('/scan-jobs', {});
    const batch = writeBatch(db);
    for (const j of jobs) batch.set(doc(db, 'jobs', j.id), { ...j, fetchedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
    await addDoc(collection(db, 'updates'), { date: this.today(), type: 'jobs', title: 'Agentic AI-jobs scan', body: `Scanned AI labs + AI-engineering / red-team / dev roles. ${jobs.length} normalized openings written (visa/sponsorship flagged). DeepSeek-v4-pro + Tavily.`, agent: 'deepseek-v4-pro + tavily', createdAt: serverTimestamp() });
    return { written: jobs.length };
  }
  async triggerPhdScan() {
    const { programs = [] } = await this.callLambda('/scan-phd', {});
    const batch = writeBatch(db);
    for (const p of programs) batch.set(doc(db, 'phdPrograms', p.id), { ...p, updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
    await addDoc(collection(db, 'updates'), { date: this.today(), type: 'phd', title: 'PhD & AI-lab status sweep', body: `Live status across top US/CN/HK/Europe/Canada AI PhD programs + labs. ${programs.length} records. DeepSeek-v4-pro + Tavily.`, agent: 'deepseek-v4-pro + tavily', createdAt: serverTimestamp() });
    return { written: programs.length };
  }
  async draftJobApplication(jobId: string, notes?: string) {
    const snap = await getDoc(doc(db, 'jobs', jobId));
    const job: any = snap.exists() ? { id: snap.id, ...snap.data() } : { id: jobId };
    const { draft } = await this.callLambda('/draft', { job, notes: notes || '' });
    return { draft, job: { title: job.title, company: job.company } };
  }

  // ── direct admin Firestore writes (gated by security rules to the admin) ───
  async setOutreachAuto(enabled: boolean) {
    await setDoc(doc(db, 'settings', 'outreach'), { autoEnabled: enabled, toggledBy: this.adminEmail(), toggledAt: serverTimestamp() }, { merge: true });
    await addDoc(collection(db, 'updates'), { date: this.today(), type: 'outreach', title: `Agentic outreach auto mode ${enabled ? 'ENABLED' : 'DISABLED'}`, body: `Admin toggled automatic Proton/local outreach to ${enabled}. When ON, the local Proton-Bridge worker drafts + sends queued outreach and logs full history.`, agent: 'admin', createdAt: serverTimestamp() });
    return { ok: true, autoEnabled: enabled };
  }
  async setAutoApply(enabled: boolean) {
    await setDoc(doc(db, 'settings', 'autoApply'), { enabled, toggledBy: this.adminEmail(), toggledAt: serverTimestamp() }, { merge: true });
    await addDoc(collection(db, 'updates'), { date: this.today(), type: 'outreach', title: `Auto job-application mode ${enabled ? 'ENABLED' : 'DISABLED'}`, body: `Admin toggled automatic job applications to ${enabled}. When ON, the local worker selects high-fit roles (DeepSeek visa-track, AI eng/red-team), drafts from the shipped-project résumé, sends, and logs the complete text.`, agent: 'admin', createdAt: serverTimestamp() });
    return { ok: true, autoApplyEnabled: enabled };
  }
  async writeManualUpdate(date: string, title: string, body: string, type = 'site') {
    await addDoc(collection(db, 'updates'), { date: date || this.today(), type, title, body, agent: 'admin-chatbot', createdAt: serverTimestamp() });
    return { ok: true };
  }
  async queueOutreach(to: string, subject: string, body?: string, notes?: string) {
    const ref = await addDoc(collection(db, 'outreachQueue'), { to, subject, body: body || '', notes: notes || '', status: 'queued', requestedBy: this.adminEmail(), requestedAt: serverTimestamp() });
    return { id: ref.id };
  }
  async queueJobApplication(jobId: string, to?: string, notes?: string) {
    const snap = await getDoc(doc(db, 'jobs', jobId));
    const job: any = snap.exists() ? { id: snap.id, ...snap.data() } : { id: jobId };
    const ref = await addDoc(collection(db, 'applicationQueue'), { jobId, title: job.title || '', company: job.company || '', to: to || '', notes: notes || (job.visaSponsorship ? 'visa / international track emphasized' : ''), status: 'queued', requestedBy: this.adminEmail(), requestedAt: serverTimestamp() });
    return { id: ref.id, job: { title: job.title, company: job.company } };
  }
}
