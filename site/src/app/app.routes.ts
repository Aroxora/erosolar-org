import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { Work } from './pages/work';
import { Blog } from './pages/blog';
import { Tracker } from './pages/tracker';
import { Jobs } from './pages/jobs';
import { Applications } from './pages/applications';
import { PhdLabs } from './pages/phd-labs';
import { Commits } from './pages/commits';
import { Apply } from './pages/apply';
import { Studio } from './pages/studio';
import { StudioHow } from './pages/studio-how';
import { AiCosts } from './pages/ai-costs';

export const routes: Routes = [
  {
    path: '', component: Home, title: 'Bo Shang — AI engineer & agentic builder | erosolar.org',
    data: { seo: {
      path: '/',
      title: 'Bo Shang — AI engineer & agentic builder | erosolar.org',
      description: 'Bo Shang is an AI / software engineer who ships owned agentic systems with DeepSeek + Tavily. Résumé, an honest ADHD & resilience statement, and a body of production work — plus a live AI-jobs board and a global AI PhD & labs directory.',
      keywords: 'Bo Shang, AI engineer, agentic systems, DeepSeek, Tavily, LLM engineer, machine learning engineer, AI safety, red team, software engineer portfolio',
    } },
  },
  {
    path: 'work', component: Work, title: 'Work — shipped AI & agentic systems | Bo Shang',
    data: { seo: {
      path: 'work',
      title: 'Work — shipped AI & agentic systems | Bo Shang',
      description: 'Production agentic systems by Bo Shang: Anvilwing (DeepSeek terminal coding agent), Frontier Model Index, The Meridian (autonomous newspaper), DRIFT, erosolar (honest small-LLM pipeline), Trenchwork, and Endearo.',
      keywords: 'Anvilwing, Frontier Model Index, The Meridian, DRIFT, erosolar, Trenchwork, Endearo, DeepSeek agent, AI projects, agentic AI portfolio',
    } },
  },
  {
    path: 'phd-labs', component: PhdLabs, title: 'AI PhD Programs & Labs Directory (every region) | Bo Shang',
    data: { seo: {
      path: 'phd-labs',
      title: 'AI PhD Programs & Labs Directory — every region, sortable | Bo Shang',
      description: 'A comprehensive, expandable directory of the top AI/ML PhD programs and research labs worldwide — MIT, Stanford, Harvard, CMU, Berkeley, Tsinghua, HKUST, Oxford, ETH and ~70 more across the US, China, Hong Kong, Canada, Europe, Israel, Asia and Australia — sortable by location, with live application status.',
      keywords: 'AI PhD programs, machine learning PhD, MIT CSAIL, Stanford SAIL, Harvard, CMU, UC Berkeley BAIR, Tsinghua, HKUST, Oxford, ETH Zurich, AI research labs, PhD admissions, AI labs directory',
    } },
  },
  {
    path: 'jobs', component: Jobs, title: 'AI Jobs — labs, AI engineering, red team | Bo Shang',
    data: { seo: {
      path: 'jobs',
      title: 'AI Jobs Board — AI labs, AI engineering & red team | Bo Shang',
      description: 'A daily-updated board of AI-lab and AI-engineering / red-team / AI-development openings — Anthropic, OpenAI, xAI, Google DeepMind, DeepSeek, Meta and more — with visa / sponsorship flags for international applicants.',
      keywords: 'AI jobs, AI engineer jobs, red team jobs, LLM jobs, Anthropic careers, OpenAI jobs, xAI, DeepSeek careers, Google DeepMind, AI safety jobs, visa sponsorship AI',
    } },
  },
  {
    path: 'tracker', component: Tracker, title: 'Live Trackers — AI jobs + PhD status | Bo Shang',
    data: { seo: {
      path: 'tracker',
      title: 'Live Trackers — AI-lab jobs + PhD application status | Bo Shang',
      description: 'Agentically refreshed live trackers (DeepSeek-v4-pro + Tavily) for AI-lab jobs and top PhD / lab application status across the US, China, Hong Kong, Europe and Canada.',
      keywords: 'AI jobs tracker, PhD application status, AI labs status, DeepSeek, Tavily, live AI tracker',
    } },
  },
  {
    path: 'blog', component: Blog, title: 'Log — dated agentic updates | Bo Shang',
    data: { seo: {
      path: 'blog',
      title: 'Log — dated agentic updates | Bo Shang',
      description: 'Dated, blog-style updates auto-written by DeepSeek-v4-pro + Tavily (and the admin): launches, daily scans, PhD sweeps, and site changes — a transparent agentic build log.',
      keywords: 'Bo Shang blog, agentic build log, DeepSeek updates, AI engineering log',
    } },
  },
  {
    path: 'commits', component: Commits, title: 'GitHub commit tracker | Bo Shang',
    data: { seo: {
      path: 'commits',
      title: 'GitHub commit tracker — build momentum | Bo Shang',
      description: "A live feed of Bo Shang's recent GitHub commits with build-momentum stats; a local agent emails a deepseek-v4-flash nudge whenever the commit pace drops below the recent average.",
      keywords: 'Bo Shang GitHub, commit tracker, build momentum, coding activity, agentic productivity',
    } },
  },
  {
    path: 'ai-costs', component: AiCosts, title: 'AI cost optimization — dev seat vs runtime | Bo Shang',
    data: { seo: {
      path: 'ai-costs',
      title: 'AI Cost Optimization — subscriptions vs API runtime, tiered routing | Bo Shang',
      description: 'A detailed June-2026 breakdown: Claude Max / ChatGPT Pro / Gemini Ultra / Grok Heavy dev-seat subscriptions vs metered API (Opus 4.8, Fable 5, DeepSeek V4-Pro) + Tavily search — and why tiered routing wins. LLMOps cost analysis by Bo Shang.',
      keywords: 'AI cost optimization, LLMOps, DeepSeek pricing, Claude Max, Opus 4.8, Fable 5, Tavily, tiered routing, AI engineering cost, token economics',
    } },
  },
  {
    path: 'studio', component: Studio, title: 'AI Video Studio | Bo Shang',
    data: { seo: {
      path: 'studio',
      title: 'AI Video Studio — long-form video from stitched AI images | Bo Shang',
      description: 'Long-form AI videos generated by stitching descriptive AI images over AI narration: DeepSeek script + xAI Grok scenes + TTS + ffmpeg, with transcript and captions. By Bo Shang.',
      keywords: 'AI video generation, faceless YouTube, DeepSeek, xAI Grok image, ffmpeg, text to video alternative, AI narration',
    } },
  },
  {
    path: 'studio-how', component: StudioHow, title: 'How the AI Video Studio works | Bo Shang',
    data: { seo: {
      path: 'studio-how',
      title: 'How the AI Video Studio works | Bo Shang',
      description: 'A transparent walk-through: why long-form AI video is built by stitching descriptive AI images (DeepSeek + xAI Grok + TTS + ffmpeg) rather than direct text-to-video.',
      keywords: 'AI video pipeline, how it works, stitched images video, DeepSeek, xAI Grok, ffmpeg Ken Burns',
    } },
  },
  {
    path: 'apply', component: Apply, title: 'Applications agent & tracker | Bo Shang',
    data: { seo: { path: 'apply', title: 'Applications agent & tracker | Bo Shang', description: 'Admin: high-confidence agentic application assistant for CN/US/HK PhD programs and jobs, visa-aware, with a full tracker.', noindex: true } },
  },
  {
    path: 'applications', component: Applications, title: 'Applications — agentic outreach | Bo Shang',
    data: { seo: {
      path: 'applications',
      title: 'Applications — agentic outreach history | Bo Shang',
      description: 'Admin-only console for auto + manual job applications and the full agentic outreach history.',
      noindex: true,
    } },
  },
  { path: '**', redirectTo: '' },
];
