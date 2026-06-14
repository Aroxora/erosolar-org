# erosolar-org

**Personal professional portfolio + agentic career platform** for Bo Shang.

Live at **[https://erosolar.org](https://erosolar.org)** (fully deployed site + cloud agents)

Built with **Angular 20** (standalone, router, signals-style patterns), **Firebase** (Hosting + Firestore + Auth + Cloud Functions), **DeepSeek-v4-pro + Tavily** for all agentic work, and a trusted **local Proton Bridge worker** for outreach and applications.

Contact: `bo@trenchwork.org` · `bo@shang.software` · 508-260-0326

**Profiles:**
- [LinkedIn](https://www.linkedin.com/in/bo-shang-04923b3a6)
- [GitHub](https://github.com/aroxora)

**Best LinkedIn handle (recommended vanity URL to claim):**  
https://www.linkedin.com/in/boshang/  

This is the cleanest, shortest, most professional option using your name.  
Strong alternatives if taken:  
- /in/bo-shang  
- /in/boshang-trenchwork  
- /in/bo-shang-software  

(How to claim on LinkedIn: Edit profile → Public profile & URL → set to your desired handle.)

## Deployment Status (June 2026)

**Fully deployed:**
- Angular site → Firebase Hosting (serving erosolar.org custom domain).
- Firestore rules + indexes (for jobs, PhD trackers, updates, applications, chat logs, etc.).
- Latest features live: rich résumé + agentic learning section, work showcase, live trackers, jobs with admin draft/queue apps, /applications history, topbar auth + chatbot + toggles for outreach/auto-apply, etc.

**Cloud agents (in Firebase Cloud Functions):**
- Not yet fully active (project is on Spark plan).
- Once upgraded to Blaze, the following run in the cloud:
  - Daily/periodic job scans (AI labs + AI eng/red-team/visa roles).
  - PhD/lab status sweeps (US/CN/HK).
  - Admin chatbot (DeepSeek-v4-pro + live context for drafts, toggles, updates).
  - Auto-apply logic hooks, outreach controls, application/outreach history logging.
  - onSchedule triggers for agents.

**Next steps to complete cloud agents (run these):**

1. Upgrade project to Blaze (pay-as-you-go) – required for Functions + scheduled agents:
   Visit https://console.firebase.google.com/project/twitch-womens-history/usage/details and upgrade (the project that hosts the https://erosolar.org custom domain).

2. Set secrets (use your keys; never commit):
   ```bash
   firebase functions:secrets:set DEEPSEEK_API_KEY
   firebase functions:secrets:set TAVILY_API_KEY
   ```

3. Deploy the agents:
   ```bash
   cd functions && npm install && npm run build
   cd ..
   firebase deploy --only functions
   ```

4. (Optional) Deploy AWS Lambda tracker for redundancy (see infra/aws/deploy-tracker.sh).

5. Local Proton worker (for actual SMTP sends via bridge – keep running on your Mac):
   ```bash
   cd outreach && npm start
   ```

6. Enable admin login (one-time, Firebase Console → Authentication):
   - **Sign-in method → add Google** provider.
   - **Settings → Authorized domains** → ensure `erosolar.org`, `twitch-womens-history.web.app`, and `localhost` are listed.
   - Only `daburu.dragon@gmail.com` gets admin powers (enforced in the callable functions and in the UI gate).

> ⚠️ **Rotate the API keys.** The DeepSeek, Tavily, and Proton Bridge credentials were
> shared in chat during setup. They are stored only in gitignored `.env` files (never
> committed), but treat them as compromised: rotate the DeepSeek + Tavily keys and the
> Proton Bridge password, then update `functions/.env`, `outreach/.env`, and any Cloud
> secrets / Lambda env.

> ℹ️ **Seed fallback.** The site ships a baked-in seed (`site/src/app/seed.data.ts`) so
> Jobs, the Tracker, PhD live-status, and the dated Blog log show real content immediately
> — even before Blaze + the first agent scan. Live Firestore data automatically replaces
> the seed once scans run. The comprehensive PhD & Labs directory (~70 programs/labs across
> every region) is always rendered client-side and needs no backend.

After Blaze + functions deploy, visit erosolar.org (as admin Google user daburu.dragon@gmail.com) and test the chatbot ("scan jobs now", "toggle autoApply on", etc.). Scheduled agents will start running automatically.

Primary URL: https://erosolar.org (hosted on Firebase project twitch-womens-history with custom domain).

See full "Local Development", "Architecture", and "Deployment" sections below for details.

## Post-Deploy Verification (for erosolar.org + cloud agents)

1. Visit https://erosolar.org. You should see the full updated site with résumé + agentic learning section, Work page, live /tracker, /jobs (with admin buttons if signed in), /applications, topbar with Google sign-in (for daburu.dragon@gmail.com), chatbot, toggles, etc.
2. Sign in as admin → open chatbot → try "scan jobs now", "toggle autoApply on", "draft app for [a DeepSeek job]".
3. In Firebase Console (project: twitch-womens-history, which serves https://erosolar.org):
   - Hosting: Confirm latest release and custom domain erosolar.org status.
   - Functions: After Blaze + deploy, check the deployed callables (chatWithAdmin, triggerJobsScan, etc.) and scheduled functions (dailyAgentRefresh, maybeAutoApply, etc.).
   - Firestore: Verify data collections (jobs, phdPrograms, updates, jobApplications) have content from scans.
   - Logs: Check for agent runs.
4. Run the local worker (`cd outreach && npm start`) with Proton Bridge active for real sends when auto modes are on.
5. (Optional) Test AWS Lambda locally or deploy for extra tracker redundancy.

If erosolar.org isn't resolving to the new site yet, add/verify the custom domain in Firebase Console > Hosting > Custom domains (point your DNS as instructed).

**Jobs / Tracker / Blog are populated out of the box** via the baked-in seed fallback, so
they are never empty. To replace the seed with *live* agent-fetched data:
- Complete steps 1-3 above (Blaze + secrets + `firebase deploy --only functions`).
- On the live https://erosolar.org, sign in as admin (topbar Google button).
- Go to /jobs or /tracker and click "Force agent scan (admin)", or open the chatbot and type `scan jobs now` / `scan phd now`.
- The cloud agents fetch fresh data using DeepSeek-v4-pro + Tavily and write it to Firestore; the live data then replaces the seed automatically.
- Future scans happen automatically via the scheduled cloud functions.

The rest of the site (Home + résumé with agentic learning section, Work page describing your repos by purpose, Live trackers button, topbar with GitHub/LinkedIn, footer with local time clock, chatbot for full control of outreach/auto-apply/drafts/updates) is already deployed and should match or exceed the screenshot once the first scan runs.

All previous features (auto job applications, full history, Proton worker integration, etc.) are wired and will work once the cloud agents are live and the local worker is running.

---

## What the site is

A clean, high-signal professional site that does two things at once:

1. **Showcases real work** — rich résumé + mental health/momentum statements on the home, plus detailed project pages describing actual shipped systems (by purpose, not raw repo names).
2. **Runs live agentic career infrastructure** — continuously updated job openings (frontier AI labs + AI engineering / red team / development roles, with explicit visa/sponsorship flags), PhD & top AI lab status tracker (US, China, Hong Kong), dated blog-style update log, and fully controlled auto outreach + auto job applications.

Everything agentic is powered by the same stack Bo uses across his other projects: DeepSeek-v4-pro (max thinking) + Tavily for research/synthesis, with full history, admin-only control, and owner-controlled execution.

### Agentic Learning & Rapid Mastery
Bo treats learning as an engineering discipline. Across his repositories he builds **custom agentic systems** to accelerate acquisition and application of complex domains:
- **Anvilwing** (erosolar-coder): A fully owned DeepSeek-powered terminal coding agent with 1M context, adversarial verification, and headless SDK — used daily to learn and ship production code faster.
- **Endearo** (bo-shang-adhd-website): End-to-end life-assistant that reads inboxes, maintains memory/dossiers, and runs proactive coaching — demonstrating systems-level learning of personal and operational domains.
- **erosolar** (erosolar-llm) + model-landscape updater: Honest small CoT LLM pipeline with grounded verification + agentic frontier model deep-dives using the same Tavily + DeepSeek loop.
- **The Meridian** (bo-economist), **DRIFT** (drift), **Frontier Model Index** (erosolar-live-website), and **Trenchwork**: Each project required rapid mastery of new stacks (full autonomous newsroom, long-horizon video pipelines, SwiftUI + Watch, Go daemons, etc.). Bo uses agentic search + synthesis + verification loops to prototype, fact-check, and iterate at high speed.
This portfolio itself (and the live job/PhD trackers + auto-application system) was built and is maintained using the same agentic patterns. The result is demonstrated, verifiable ability to learn and operationalize frontier technologies quickly and reliably.

---

## Key Features

### Public / Professional Surface
- **Home**: Prominent résumé highlighting concrete accomplishments across multiple agentic platforms + forward-looking mental health / momentum statements (building reliable personal infrastructure, transparent accountability as engineering, same patterns used for public creative work).
- **Work**: Descriptions of major shipped projects:
  - Endearo — personal proactive AI life-assistant (local daemons, Proton Bridge, memory/todos/dossiers, transparent provider outreach)
  - Anvilwing — owned terminal coding agent (DeepSeek v4 Pro 1M context, adversarial verifier, Ink TUI, npm-published)
  - Frontier Model Index (3 sites + iOS) — daily auto-updated AI landscape atlas
  - erosolar — honest small CoT LLM pipeline + agent stack + model-landscape updater
  - The Meridian — fully agentic Economist-style newspaper (DeepSeek + TTS, multi-platform)
  - DRIFT — hard-science screenplay + living science engine + long-horizon video pipeline + companion
  - Trenchwork — automatic work-momentum tracker (Go daemon + iOS/Watch)
- **Log / Blog**: Live dated updates (auto-generated by agents + manual via admin chatbot).
- **Tracker**: Live PhD program & AI lab admissions status (top US, Tsinghua/PKU/SJTU/ZJU, HKUST/CUHK/HKU, others) + recent jobs.
- **Jobs**: Searchable/filterable list of AI lab and AI-related engineering/red-team/development roles with visa notes.
- **Applications** (admin view): Full history of sent job applications with complete logged text.

### Agentic Systems (admin-controlled)
- **Daily auto job scanning** — targets Anthropic, OpenAI, xAI, Google/DeepMind, DeepSeek, Meta AI, Scale, red-team/safety, AI engineering roles + visa sponsorship language. Normalizes + stores with DeepSeek + Tavily.
- **PhD & lab status tracker** — agentic sweeps of top programs/labs in US, China, and Hong Kong.
- **Auto outreach + auto job applications**:
  - Admin can toggle "auto outreach" and **"auto apply"** modes.
  - When auto-apply is on, the local worker selects high-fit unfilled roles (strong bias toward DeepSeek and other labs that note visa processes for international candidates), generates personalized applications using the full rich résumé context, sends via Proton Bridge, and writes the **complete sent text** to Firestore history.
  - Manual draft + queue flow also available from the jobs page and chatbot.
- **Admin chatbot** (topbar popup, DeepSeek-v4-pro + live context):
  - Natural language control: scan jobs, scan PhDs, draft applications, queue applications, toggle auto modes, write site updates, review history.
  - Has access to current jobs, PhD statuses, update log, and previous application/outreach history.
- **Full provenance**: Every agentic action (job scan, PhD update, outreach email, job application) is dated, attributed, and stored with full text in Firestore.

**Admin user**: `daburu.dragon@gmail.com` (Google SSO only). All mutating controls and history views are strictly gated to this account both in the UI and in Cloud Functions / worker rules.

---

## Architecture

```
site/                  Angular 20 SPA (router, live Firestore listeners, Firebase Auth Google)
  ├── topbar (auth status + admin controls + chatbot trigger)
  ├── home (résumé + mental health)
  ├── /work, /blog, /tracker, /jobs, /applications
  └── chatbot drawer (admin only)

functions/             Cloud Functions (Node 22, TS)
  ├── DeepSeek + Tavily clients (OpenAI-compatible)
  ├── Admin-gated callables (chat, scan jobs, scan PhDs, draft/queue apps, toggles)
  └── Scheduled heartbeats (when on Blaze)

outreach/              Local Proton Bridge worker (the trusted sender)
  ├── Drains outreachQueue + applicationQueue
  ├── Auto-selects high-fit jobs when autoApply enabled
  ├── DeepSeek personalization for applications
  └── Writes complete history to jobApplications + outreachHistory

infra/aws/             Lambda tracker (portable alternative for daily scans)

Firebase
  - Hosting (SPA + rewrites)
  - Firestore (public read for jobs/phd/updates; admin-only for histories + queues)
  - Auth (Google, single admin email)
  - Cloud Functions (Blaze for scheduled + callables)
```

The local worker is the only component that holds SMTP credentials and actually sends mail. Cloud Functions and the Angular app never send email directly.

## Repository Layout

- `site/` — Angular 20 frontend (the deployed site)
- `functions/` — Cloud Functions (DeepSeek/Tavily agents + admin callables)
- `outreach/` — Local Proton Bridge worker (auto outreach + auto job applications + history logging)
- `infra/aws/` — Optional AWS Lambda tracker
- Root: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `.firebaserc`

---

## Local Development

```bash
# The Angular site
cd site
npm install
npm start                 # http://localhost:4200

# Cloud Functions (with emulators)
cd ../functions
npm install
npm run build
firebase emulators:start  # (run from repo root for full emulators)

# Local Proton outreach + auto job application worker
cd ../outreach
npm install
cp .env.example .env      # edit with your Proton Bridge details + DeepSeek/Tavily keys
npm start                 # DRY_RUN=true for testing without sending
```

**Requirements for the worker:**
- Proton Bridge running on `127.0.0.1:1143` (IMAP STARTTLS) and `127.0.0.1:1025` (SMTP) for `erolunar@pm.me`
- Valid `DEEPSEEK_API_KEY` and `TAVILY_API_KEY` (the same ones used by the Functions)
- Firebase Admin credentials (service account JSON or Application Default Credentials) so the worker can read `settings/*` and write history collections

The worker is deliberately designed to be the single place that ever touches SMTP.

---

## Deployment

1. Fill real Firebase web config in `site/src/app/firebase.config.ts`.
2. `firebase login` and select (or create) the target project.
3. Enable Google authentication provider in the Firebase console.
4. (Recommended) Upgrade to Blaze plan for Cloud Functions + scheduled functions.
5. Deploy:

```bash
cd site && npm run build
cd ../functions && npm run build
cd ..
firebase deploy
```

6. Set secrets (never commit):

```bash
firebase functions:secrets:set DEEPSEEK_API_KEY
firebase functions:secrets:set TAVILY_API_KEY
```

7. For the local worker on a server / always-on Mac: use launchd (see `outreach/install.sh`) or a process manager. The worker reads the same Firestore `settings/autoApply` and `settings/outreach` documents the site controls.

AWS Lambda tracker (in `infra/aws/`) is an optional portable alternative for the scan side if you prefer not to use Cloud Functions scheduled functions.

---

## Keys & Secrets

The provided keys in the various `.env.example` files are for local reference only.

- **Production**: Use Firebase Secret Manager for Functions and environment variables / secrets for the local worker + any Lambda.
- The Angular client only ever sees the public Firebase web config (standard and safe).

---

## Guardrails (still in effect)

This site is deliberately built as a **Group A professional portfolio + career tool** (see original productive ideas). It stays strictly constructive and forward-looking:

- No references to protected parties, case exhibits, or third-party narratives.
- All mental health / momentum content is self-focused, infrastructure-oriented, and framed as engineering practice (accountability tools, momentum systems, transparent self-management).
- Agentic job applications and outreach are private/admin-controlled; only high-level status and public job data are visible to visitors.
- Any future content touching personal legal matters must still be reviewed by counsel before shipping.

The current implementation was designed to be useful for career momentum while remaining well inside safe boundaries.

---

## Tech & Inspirations

- Same agentic patterns used across Bo's other live systems (The Meridian, DRIFT, Frontier Model Index, Trenchwork, Endearo, Anvilwing, erosolar).
- DeepSeek-v4-pro (via OpenAI-compatible endpoint) for reasoning and generation.
- Tavily for fresh web research.
- Owner-controlled execution (local worker for anything that touches SMTP or long-running selection).

---

Questions or changes? The whole surface (site + agents + worker) is controllable from the admin chatbot and topbar once signed in as `daburu.dragon@gmail.com`.
