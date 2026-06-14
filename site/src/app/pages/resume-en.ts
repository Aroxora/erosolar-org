import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Proj { org: string; role: string; period: string; impact: string; tech: string[]; }

@Component({
  selector: 'app-resume-en',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ résumé · English</p>
        <h2 class="title">Bo Shang — AI engineer / founder</h2>
        <p class="sub">Builds owned, verifiable, long-horizon agentic AI systems and load-bearing infrastructure, end to end. <a routerLink="/resume-zh">中文简历 →</a></p>
      </div>

      <h3>Profile</h3>
      <p class="prose">I'm an AI engineer and founder (Trenchwork) who builds agentic systems end to end — and ships most of it solo. My edge is depth across the whole AI stack: agent architecture and tool-use, multi-model orchestration, prompt caching and context engineering, retrieval and search pipelines (managed and self-hosted), and the cost economics most teams get wrong. I route across Claude, GPT, Grok, and the Chinese frontier (DeepSeek, Qwen, Kimi, GLM) by capability and price, and I write publicly about where AI cost, value, and competition are heading. I come from security engineering (Tufts), with deep fluency in applied AI, cybersecurity, and Chinese technology — a first-principles thinker who learns fastest by building the hard thing.</p>

      <h3>Core competencies</h3>
      <ul class="skills">
        <li><strong>Agentic engineering:</strong> agent architecture, tool-use, adversarial verifiers, permission modes, long-horizon background tasks, headless event-stream SDKs.</li>
        <li><strong>Multi-model orchestration:</strong> tiered routing by capability + price (DeepSeek-v4-pro + Tavily as default runtime, ~22× cheaper than Opus 4.8), selective escalation to frontier models, token caps + aggressive caching.</li>
        <li><strong>LLMOps / AI cost optimization:</strong> the dev-seat-vs-runtime distinction; search-layer optimization (search becomes ~40% of the bill once tokens are cheap); the Tavily-vs-self-hosted-SearXNG build-vs-buy call.</li>
        <li><strong>Retrieval &amp; context:</strong> RAG embeddings, prompt caching, context engineering, live web-search pipelines.</li>
        <li><strong>Full-stack &amp; infrastructure:</strong> Angular, Node/TypeScript, Go, Firebase (Hosting/Firestore/Admin), AWS Lambda + API Gateway, SwiftUI (iOS/Watch), ffmpeg.</li>
        <li><strong>Security engineering:</strong> defensive cyber, red-team mindset, auditable least-privilege system design.</li>
      </ul>

      <h3>Selected projects (described by purpose)</h3>
      <div class="proj-grid">
        @for (p of projects; track p.org) {
          <div class="proj">
            <div class="proj__meta"><span class="proj__period">{{ p.period }}</span><span class="proj__org">{{ p.org }}</span></div>
            <h4 class="proj__role">{{ p.role }}</h4>
            <p class="proj__impact">{{ p.impact }}</p>
            <div class="proj__tech">@for (t of p.tech; track t) { <span class="tag">{{ t }}</span> }</div>
          </div>
        }
      </div>

      <h3>Writing</h3>
      <p class="prose">Sourced AI-economics &amp; infrastructure analysis in the <a routerLink="/notes">Field notes</a> on erosolar.org: managed-vs-self-hosted search, the $200-subscription-vs-China pricing gap, the 2026 compute-and-capital story (circular hyperscaler financing, the Apple–Google Siri deal, SpaceX/xAI's ~$1.25T merger + orbital data centers), and a leader-by-leader "AI Power Rankings." Every piece marks verified figures vs estimates.</p>

      <h3>Education</h3>
      <p class="prose">Tufts University — security-engineering background.</p>

      <h3>Open to</h3>
      <p class="prose">AI engineering, LLMOps, research engineering, red-team / AI safety, and infrastructure roles — <strong>including international, and willing to handle any required visa, sponsorship, or relocation process.</strong></p>

      <h3>Contact</h3>
      <p class="prose">
        <a href="mailto:bo&#64;shang.software">bo&#64;shang.software</a> · <a href="mailto:bo&#64;trenchwork.org">bo&#64;trenchwork.org</a> ·
        <a href="tel:+15082600326">508-260-0326</a> ·
        <a routerLink="/">erosolar.org</a> ·
        <a href="https://www.linkedin.com/in/bo-shang-04923b3a6" target="_blank" rel="noopener">LinkedIn</a> ·
        <a href="https://github.com/aroxora" target="_blank" rel="noopener">GitHub</a>
      </p>
    </div>
  `,
  styles: [`
    h3 { font-family:var(--display); margin:1.8rem 0 .5rem; font-size:1.3rem; }
    .prose { color:var(--ink-2); line-height:1.7; max-width:84ch; }
    .skills { color:var(--ink-2); line-height:1.7; max-width:86ch; padding-left:1.1rem; }
    .skills li { margin:.4rem 0; }
    .proj-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1rem; margin-top:.6rem; }
    .proj { border:1px solid var(--line-soft); border-radius:14px; padding:1.2rem 1.3rem; background:linear-gradient(180deg, var(--surface), var(--surface-2)); }
    .proj__meta { display:flex; gap:.6rem; align-items:baseline; flex-wrap:wrap; font-family:var(--mono); font-size:.72rem; }
    .proj__period { color:var(--solar); } .proj__org { color:var(--muted); }
    .proj__role { font-family:var(--display); margin:.3rem 0 .4rem; font-size:1.12rem; }
    .proj__impact { color:var(--ink-2); line-height:1.6; margin:0 0 .6rem; }
    .proj__tech { display:flex; gap:.35rem; flex-wrap:wrap; }
    .tag { font-family:var(--mono); font-size:.66rem; color:var(--ink-2); border:1px solid var(--line-soft); border-radius:999px; padding:.16rem .5rem; }
    a { color:var(--solar); }
  `],
})
export class ResumeEn {
  readonly projects: Proj[] = [
    { period: '2025–2026', org: 'Trenchwork — Vigil', role: 'AI defensive-cyber agent', impact: 'Built Vigil, an AI-powered defensive-cyber agent, under my company Trenchwork — plus Women Who Defend, a hands-on security-engineering learning platform.', tech: ['AI security', 'red-team', 'Node/TS', 'Firebase'] },
    { period: '2025–2026', org: 'Erosolar Coder / Anvilwing', role: 'Terminal coding agent (author)', impact: 'A Claude-Code-class terminal coding agent published on npm: DeepSeek v4 Pro at 1M context + adversarial verifier, permission modes, colored diffs, background long tasks, headless event-stream SDK. Fully owned, no hosted middleman.', tech: ['TypeScript', 'Ink + React', 'DeepSeek', 'node-pty'] },
    { period: '2024–2026', org: 'Erosolar', role: 'Autonomous AI research assistant', impact: 'A long-horizon autonomous research assistant with its own coding CLI, using DeepSeek-v4-pro + Tavily grounded agent loops to enter new domains and reach production quality fast — with full provenance.', tech: ['DeepSeek', 'Tavily', 'RAG', 'Angular'] },
    { period: '2025–2026', org: 'Frontier Model Index', role: 'Agentic pipeline engineer', impact: 'A daily auto-updated atlas of the AI frontier (three live sites + iOS): Tavily search + DeepSeek-V4 synthesis writes Firestore via the Admin SDK; static sites read live with no content redeploys.', tech: ['Firebase', 'DeepSeek', 'Tavily', 'SwiftUI'] },
    { period: '2025–2026', org: 'The Meridian', role: 'Editor-in-chief (agentic)', impact: 'A fully autonomous Economist-style newspaper: DeepSeek plans/reports/writes/fact-checks, OpenAI TTS narrates; Angular PWA + iOS + Apple Watch, VAPID push, dynamic feeds; cost-capped.', tech: ['Cloud Functions', 'DeepSeek', 'OpenAI TTS', 'Angular'] },
    { period: '2025–2026', org: 'DRIFT', role: 'Story + science systems', impact: 'Hard-science screenplay site with a weekly DeepSeek+Tavily "living science" curator, a long-horizon video pipeline (director → image-to-video chaining → ffmpeg stitch, resumable/self-healing), and a grounded companion.', tech: ['Angular', 'DeepSeek + Tavily', 'ffmpeg', 'SwiftUI'] },
    { period: '2025–2026', org: 'Trenchwork (activity tracker)', role: 'Momentum systems', impact: 'A Go desktop daemon (real activity detection via process/tty/git) + iOS/Apple Watch Live Activities + Tailscale approvals for long agent runs; a 24/7 nudge scheduler. All owner-scoped.', tech: ['Go', 'Firebase', 'WidgetKit/ActivityKit', 'Tailscale'] },
    { period: '2025–2026', org: 'Endearo', role: 'Personal AI life-assistant', impact: 'A 24/7 proactive assistant that reads my own inboxes read-only via local daemons + a mail bridge, maintains vector memory/dossiers/todos, and surfaces the next concrete step — non-destructive, self-only, fully disclosed AI authorship.', tech: ['Node ESM', 'IMAP/SMTP', 'DeepSeek + Tavily', 'Firestore'] },
  ];
}
