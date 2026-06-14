import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, ADMIN_EMAIL } from '../services/auth.service';

interface ResumeItem {
  period: string;
  role: string;
  org: string;
  impact: string;
  tech: string[];
}

interface MentalNote {
  title: string;
  body: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private auth = inject(AuthService);

  readonly year = new Date().getFullYear();
  readonly isAdmin = this.auth.isAdmin;

  // Extracted + highlighted from deep recon of the real repos (described by purpose)
  readonly resume: ResumeItem[] = [
    {
      period: '2024–2026',
      role: 'Principal builder + agentic learner',
      org: 'Trenchwork + multiple agentic systems',
      impact: 'Shipped production-grade owned AI tooling and platforms used daily for research, writing, coding, and personal momentum — while using the same DeepSeek-v4-pro + Tavily agent loops to rapidly acquire and operationalize new domains. Demonstrated cross-project learning velocity with full provenance.',
      tech: ['DeepSeek', 'Tavily', 'Node/TS', 'Go', 'Firebase', 'Angular'],
    },
    {
      period: '2026',
      role: 'AI cost engineering / LLMOps',
      org: 'Erosolar — tiered model routing',
      impact: 'Costed and architected the entire stack around the dev-seat-vs-runtime distinction: a $200 Claude Max subscription is ~$3,850/mo of Opus value for *building*, but product runtime must be metered API. Built tiered routing — DeepSeek-v4-pro + Tavily as the default runtime (~22× cheaper than Opus; ~$297/mo vs ~$3,970/mo with search attached), selective escalation to Opus/Fable for the hardest long-horizon tasks, token caps, and aggressive caching — plus search-layer optimization once cheap tokens make search ~40% of the bill. Full write-up on the AI Costs page.',
      tech: ['LLMOps', 'DeepSeek', 'Opus 4.8', 'Tavily', 'tiered routing', 'cost modeling'],
    },
    {
      period: '2025–2026',
      role: 'Creator & operator',
      org: 'Endearo (personal AI life-assistant)',
      impact: 'Built a 24/7 proactive assistant that reads my own inboxes read-only via local daemons + a mail bridge, maintains vector memory, dossiers, and todos, and runs warm momentum coaching — turning scattered inputs into the next concrete step. Designed for focus and follow-through (built in part to work with my own ADHD): non-destructive, self-only communication, with fully disclosed AI authorship. Web (Vite/React) + iOS.',
      tech: ['Node ESM', 'IMAP/SMTP (Proton Bridge)', 'DeepSeek + Tavily', 'Firestore', 'launchd', 'React Router'],
    },
    {
      period: '2025–2026',
      role: 'Author & systems designer',
      org: 'Anvilwing (terminal coding agent)',
      impact: 'Shipped a full Claude-Code-class agent TUI (Ink) that you fully own: DeepSeek v4 Pro 1M context + max thinking, adversarial verifier, permission modes (Shift+Tab), colored diffs, background long tasks, headless event stream SDK. Published on npm (anvilwing, trenchwork-coder aliases). Real engineering discipline, no hosted nag layer.',
      tech: ['TypeScript', 'Ink + React', 'DeepSeek OpenAI compat', 'node-pty', 'keychain secrets'],
    },
    {
      period: '2025–2026',
      role: 'Agentic pipeline engineer',
      org: 'Frontier Model Index (3 live sites) + erosolar-llm model-landscape',
      impact: 'Daily auto-updated atlas of the AI frontier (leaderboards, China catch-up, LLM internals, hardware, military AI, business). Tavily search + DeepSeek-V4.1-pro synthesis writes directly to Firestore via Admin SDK; static sites + iOS read live. No redeploy for content. Also built the honest small CoT LLM training pipeline (14M-param measured-only models, char+copy generalization to ~89% held-out, Infini-Attention, grounded verification with SymPy/Z3, Qwen agent stack + Angular chat on Cloud Run).',
      tech: ['Firebase (Hosting+Firestore+Admin)', 'DeepSeek dual-format', 'Tavily', 'SwiftUI iOS', 'Angular', 'Python/PyTorch'],
    },
    {
      period: '2025–2026',
      role: 'Editor-in-chief (agentic)',
      org: 'The Meridian — agentic Economist-style newspaper',
      impact: 'Fully autonomous weekly edition (up to 100 stories) + daily World in Brief. DeepSeek plans, commissions, reports (Tavily), writes, fact-checks, revises; OpenAI TTS narrates. Multi-platform delivery: Angular PWA, iOS, Apple Watch (shared audio player with background/lockscreen controls), web-push (VAPID), dynamic RSS/JSON/sitemaps. Conservation mode keeps costs low (<$5 DeepSeek + Tavily budget). Historical archive preserved.',
      tech: ['Firebase Cloud Functions v2 (TS)', 'DeepSeek + Tavily + OpenAI TTS', 'Angular (zoneless)', 'SwiftUI + WatchKit', 'Storage', 'VAPID push'],
    },
    {
      period: '2025–2026',
      role: 'Story + science systems',
      org: 'DRIFT (hard-science survival screenplay + living ecosystem)',
      impact: 'Cinematic Angular site + iOS for the screenplay (fountain parser, science annotation chips), 24 narrated short stories + explainers (TTS with position memory), fully agentic "Living Science" engine (weekly DeepSeek+Tavily curator that keeps facts current and flags screenplay drift), long-horizon video pipeline (DeepSeek director → Seedance/xAI image-to-video → ffmpeg stitch, resumable), "Ask the Computer" grounded companion chatbot, agentic story foundry, ebook generator.',
      tech: ['Angular 21 (signals)', 'DeepSeek + Tavily + Seedance', 'Firebase (Functions/Storage/Hosting)', 'OpenAI TTS', 'ffmpeg', 'SwiftUI iOS'],
    },
    {
      period: '2025–2026',
      role: 'Momentum systems',
      org: 'Trenchwork (auto work tracker)',
      impact: 'Desktop Go daemon (real activity detection via process/tty/git + hooks into Anvilwing/Claude Code), direct Firestore writes (Admin), streak/rollup computation, iOS + Apple Watch companion with Live Activities, complications, one-tap approvals for long agentic runs over Tailscale. 24/7 nudge scheduler (GH Actions or Lambda) with smart timing. Google SSO. All owner-scoped.',
      tech: ['Go', 'Firebase (Spark safe, direct Admin writes + FCM)', 'SwiftUI + WidgetKit + ActivityKit', 'Tailscale', 'GitHub Actions / Lambda'],
    },
  ];

  readonly mental: MentalNote[] = [
    {
      title: 'Open about ADHD — and building around it',
      body: 'I have ADHD, and I am open about it because it is part of how I work, not a footnote. Rather than fight my own wiring, I build systems that fit it: external memory, automatic capture, one clear next step at a time, and warm nudges that keep momentum without shame. The same agentic patterns I use for code — capture, structure, verify, follow through — are the ones I use to stay on track day to day. That is not a weakness story; it is an operating-system story.',
    },
    {
      title: 'Mental health as craft infrastructure',
      body: 'I treat my own follow-through the way I treat a production service: make the state visible, make the next action obvious, and remove silent failure. Small, durable habits — the two-day rule, one-thing-a-day, movement snacks, honest logging — are first-class features of the tools I build for myself (Endearo, Trenchwork). The goal is sustainable output and honest self-knowledge, not heroics. Tools that surface the next concrete step beat willpower every time.',
    },
    {
      title: 'Adversity as a catalyst, forward-looking only',
      body: 'I came to software later than most and with little prior professional history. I do not dress that up — I reframe it: the gap is exactly why I learned to build instead of wait. Everything here points forward: reliable systems, clear records, and a body of shipped work that is the real argument. I am steady, I verify my own output, and I would rather show you a running system than a list of adjectives.',
    },
  ];

  readonly contact = {
    email: 'bo@trenchwork.org',
    alt: 'bo@shang.software',
    phone: '508-260-0326',
    linkedin: 'https://www.linkedin.com/in/bo-shang-04923b3a6',
    github: 'https://github.com/aroxora',
  };
}
