import { Injectable } from '@angular/core';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '../firebase.config';
import { getFunctions, httpsCallable } from 'firebase/functions';

const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp, 'us-central1');

export interface Job {
  id?: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  visaSponsorship?: string;
  description?: string;
  level?: string;
  fetchedAt?: any;
  source?: string;
}

export interface PhdProgram {
  id?: string;
  program: string;
  uni: string;
  country: string;
  status: string;
  deadline?: string | null;
  notes?: string;
  visaNotes?: string;
  lastChecked?: string;
}

export interface Update {
  id?: string;
  date: string;
  type: 'jobs' | 'phd' | 'outreach' | 'site' | 'resume' | string;
  title: string;
  body: string;
  agent?: string;
  createdAt?: any;
}

export interface JobApplication {
  id?: string;
  jobId?: string;
  title: string;
  company: string;
  to: string;
  subject: string;
  bodySent: string;
  visaContext?: string;
  sentAt?: any;
  status?: 'sent' | 'replied' | 'declined' | 'pending';
  via?: string;
  notes?: string;
  _scanDate?: string;
}

export interface ApplicationQueueItem {
  id?: string;
  jobId: string;
  title: string;
  company: string;
  to?: string;
  subject?: string;
  body?: string;
  notes?: string;
  status: string;
  requestedBy?: string;
  requestedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  // Live listeners (simple; components subscribe)
  listenJobs(cb: (jobs: Job[]) => void) {
    const q = query(collection(db, 'jobs'), orderBy('fetchedAt', 'desc'), limit(40));
    return onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Job[];
      cb(arr);
    });
  }

  listenPhds(cb: (list: PhdProgram[]) => void) {
    const q = query(collection(db, 'phdPrograms'), orderBy('lastChecked', 'desc'), limit(20));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as PhdProgram[]));
  }

  listenUpdates(cb: (ups: Update[]) => void) {
    const q = query(collection(db, 'updates'), orderBy('date', 'desc'), limit(30));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Update[]));
  }

  async getOutreachAuto(): Promise<boolean> {
    const s = await getDoc(doc(db, 'settings/outreach'));
    const d: any = s.data() || {};
    return !!d['autoEnabled'];
  }

  // Callables (only succeed for the exact admin email after Google sign-in)
  async callChat(message: string, history: any[] = []) {
    const fn = httpsCallable(functions, 'chatWithAdmin');
    const res: any = await fn({ message, history });
    return res.data;
  }

  async triggerJobsScan() {
    const fn = httpsCallable(functions, 'triggerJobsScan');
    return (await fn({})).data;
  }

  async triggerPhdScan() {
    const fn = httpsCallable(functions, 'triggerPhdScan');
    return (await fn({})).data;
  }

  async setOutreachAuto(enabled: boolean) {
    const fn = httpsCallable(functions, 'setOutreachAuto');
    return (await fn({ enabled })).data;
  }

  async writeManualUpdate(date: string, title: string, body: string, type = 'site') {
    const fn = httpsCallable(functions, 'writeManualUpdate');
    return (await fn({ date, title, body, type })).data;
  }

  async queueOutreach(to: string, subject: string, body?: string, notes?: string) {
    const fn = httpsCallable(functions, 'queueOutreachDraft');
    return (await fn({ to, subject, body, notes })).data;
  }

  // === NEW: Auto job applications + outreach ===
  listenApplications(cb: (apps: JobApplication[]) => void) {
    const q = query(collection(db, 'jobApplications'), orderBy('sentAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as JobApplication[]);
    });
  }

  async getAutoApply(): Promise<boolean> {
    const s = await getDoc(doc(db, 'settings/autoApply'));
    const d: any = s.data() || {};
    return !!d['enabled'];
  }

  async setAutoApply(enabled: boolean) {
    const fn = httpsCallable(functions, 'setAutoApply');
    return (await fn({ enabled })).data;
  }

  async draftJobApplication(jobId: string, notes?: string) {
    // Backend exports this callable as `draftJobApplicationCF` (the bare name is a
    // server-side helper). Keep the client method name ergonomic.
    const fn = httpsCallable(functions, 'draftJobApplicationCF');
    return (await fn({ jobId, notes })).data;
  }

  async queueJobApplication(jobId: string, to?: string, notes?: string) {
    const fn = httpsCallable(functions, 'queueJobApplication');
    return (await fn({ jobId, to, notes })).data;
  }

  // Listen to pending application queue for admin UI
  listenAppQueue(cb: (items: ApplicationQueueItem[]) => void) {
    const q = query(collection(db, 'applicationQueue'), orderBy('requestedAt', 'desc'), limit(20));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ApplicationQueueItem[]));
  }
}
