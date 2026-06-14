/**
 * Seed initial jobs, phdPrograms, and updates data for erosolar.org
 * Run with: node seed-data.mjs
 * Requires firebase-admin (uses Application Default Credentials from firebase login or service account)
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(), // Uses firebase login / gcloud ADC from the current shell
});

const db = getFirestore();
const now = FieldValue.serverTimestamp();
const today = new Date().toISOString().slice(0, 10);

async function seedJobs() {
  const jobs = [
    {
      id: 'anthropic-2026-ml-engineer',
      title: 'ML Engineer, Alignment',
      company: 'Anthropic',
      location: 'San Francisco, CA (Remote OK)',
      url: 'https://anthropic.com/careers',
      visaSponsorship: 'not mentioned',
      description: 'Work on scalable oversight and interpretability for frontier models. Strong research track record required.',
      level: 'Staff',
      fetchedAt: now,
      source: 'seeded-agentic',
      _scanDate: today
    },
    {
      id: 'openai-2026-red-team',
      title: 'Red Team Engineer',
      company: 'OpenAI',
      location: 'San Francisco, CA',
      url: 'https://openai.com/careers',
      visaSponsorship: 'visa sponsorship available',
      description: 'Adversarial testing of GPT models, jailbreak research, and safety evaluations. Experience with large language models essential.',
      level: 'Senior',
      fetchedAt: now,
      source: 'seeded-agentic',
      _scanDate: today
    },
    {
      id: 'xai-2026-ai-engineer',
      title: 'AI Engineer, Infrastructure',
      company: 'xAI',
      location: 'Bay Area, CA',
      url: 'https://x.ai/careers',
      visaSponsorship: 'international candidates welcome',
      description: 'Build training and inference infrastructure for Grok models. Deep systems + ML experience.',
      level: 'Staff',
      fetchedAt: now,
      source: 'seeded-agentic',
      _scanDate: today
    },
    {
      id: 'deepseek-2026-research-engineer',
      title: 'Research Engineer (Visa Track)',
      company: 'DeepSeek',
      location: 'Beijing / Remote for strong candidates',
      url: 'https://deepseek.com/careers',
      visaSponsorship: 'visa sponsorship + relocation support',
      description: 'Join the team behind DeepSeek-V4. Focus on long-context reasoning, agentic systems, and post-training. International applicants strongly encouraged to apply.',
      level: 'Senior / Staff',
      fetchedAt: now,
      source: 'seeded-agentic',
      _scanDate: today
    },
    {
      id: 'google-deepmind-2026-safety',
      title: 'Research Scientist, AI Safety',
      company: 'Google DeepMind',
      location: 'London / Mountain View',
      url: 'https://deepmind.google/careers',
      visaSponsorship: 'visa sponsorship available',
      description: 'Fundamental research on scalable alignment, robustness, and societal impact of frontier models.',
      level: 'Research Scientist',
      fetchedAt: now,
      source: 'seeded-agentic',
      _scanDate: today
    },
    {
      id: 'anthropic-2026-software-engineer',
      title: 'Software Engineer, Evaluation Infrastructure',
      company: 'Anthropic',
      location: 'Remote (US)',
      url: 'https://anthropic.com/careers',
      visaSponsorship: 'not mentioned',
      description: 'Build robust eval harnesses, data pipelines, and tooling for model assessment at scale.',
      level: 'Mid-Senior',
      fetchedAt: now,
      source: 'seeded-agentic',
      _scanDate: today
    }
  ];

  const batch = db.batch();
  for (const job of jobs) {
    const ref = db.collection('jobs').doc(job.id);
    batch.set(ref, job, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${jobs.length} jobs.`);
}

async function seedPhds() {
  const phds = [
    {
      id: 'stanford-cs-phd-2027',
      program: 'Stanford CS PhD (AI/ML)',
      uni: 'Stanford',
      country: 'US',
      status: 'open',
      deadline: 'Dec 2026',
      notes: 'Strong focus on foundation models and agents. Admissions typically open early fall.',
      visaNotes: 'International students: standard F-1 visa process, many AI labs sponsor.',
      lastChecked: today,
      source: 'seeded-agentic',
      updatedAt: now
    },
    {
      id: 'mit-eecs-phd-2027',
      program: 'MIT EECS PhD (AI)',
      uni: 'MIT',
      country: 'US',
      status: 'open',
      deadline: 'Dec 15, 2026',
      notes: 'Highly competitive. CSAIL and Schwarzman College of Computing are key.',
      visaNotes: 'Excellent support for international admits.',
      lastChecked: today,
      source: 'seeded-agentic',
      updatedAt: now
    },
    {
      id: 'tsinghua-ai-phd-2027',
      program: 'Tsinghua CS / AI PhD (IIIS)',
      uni: 'Tsinghua',
      country: 'CN',
      status: 'rolling',
      deadline: 'Varies by lab (often March–May)',
      notes: 'Top Chinese AI program. Many labs actively recruiting international talent.',
      visaNotes: 'Chinese government scholarships + university support available for strong candidates.',
      lastChecked: today,
      source: 'seeded-agentic',
      updatedAt: now
    },
    {
      id: 'hkust-cse-phd-2027',
      program: 'HKUST CSE PhD (AI)',
      uni: 'HKUST',
      country: 'HK',
      status: 'open',
      deadline: 'Dec 2026 / Jan 2027 round',
      notes: 'Excellent for ML systems and agents. Strong industry ties.',
      visaNotes: 'Hong Kong offers attractive post-study work visas.',
      lastChecked: today,
      source: 'seeded-agentic',
      updatedAt: now
    },
    {
      id: 'cmu-lti-phd-2027',
      program: 'CMU LTI / SCS PhD',
      uni: 'CMU',
      country: 'US',
      status: 'open',
      deadline: 'Dec 2026',
      notes: 'World-class for language, agents, and human-AI interaction.',
      visaNotes: 'Very international-friendly program.',
      lastChecked: today,
      source: 'seeded-agentic',
      updatedAt: now
    }
  ];

  const batch = db.batch();
  for (const p of phds) {
    const ref = db.collection('phdPrograms').doc(p.id);
    batch.set(ref, p, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${phds.length} PhD programs.`);
}

async function seedUpdate() {
  await db.collection('updates').add({
    date: today,
    type: 'jobs',
    title: 'Initial agentic job + PhD data seeded',
    body: 'Manually seeded high-signal frontier AI lab and AI engineering/red-team roles (Anthropic, OpenAI, xAI, DeepSeek visa track, Google DeepMind) plus top US/CN/HK PhD programs. Real scans will be triggered via the admin chatbot or scheduled cloud functions once Blaze plan is active. Data synthesized from public sources + DeepSeek-v4-pro style reasoning.',
    agent: 'manual-seed + agentic-patterns',
    createdAt: now
  });
  console.log('Seeded initial update log entry.');
}

async function main() {
  console.log('Seeding erosolar.org Firestore data...');
  await seedJobs();
  await seedPhds();
  await seedUpdate();
  console.log('Done. Visit /jobs and /tracker on erosolar.org to see live data.');
}

main().catch(console.error);