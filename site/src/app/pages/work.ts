import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ selected work</p>
        <h2 class="title">Projects described by what they are</h2>
      </div>

      <div class="work-grid">
        <div class="card">
          <h3>Endearo — personal proactive AI life-assistant</h3>
          <p>24/7 local+cloud agent that reads my own inboxes read-only (Proton Bridge + Gmail), keeps memory/dossiers/todos, and runs warm momentum coaching that turns scattered inputs into the next concrete step. Built as a live demonstration of agentic systems for personal operating and follow-through (and to work with my own ADHD). Web portal + iOS. Everything disclosed and self-only — the agent only ever emails me.</p>
          <div class="meta">Node • IMAP/SMTP • DeepSeek+Tavily • Firestore • React + SwiftUI • launchd</div>
          <a href="https://boshangadhd.com" target="_blank">boshangadhd.com →</a>
        </div>
        <div class="card">
          <h3>Anvilwing — owned terminal coding agent (Claude Code class)</h3>
          <p>DeepSeek v4 Pro 1M context, full reasoning, adversarial verifier, permission modes, colored diffs, background tasks, headless SDK. Built explicitly as a vehicle for rapid agentic learning and daily production code shipping. Your keys, no login, published on npm. Multiple aliases (anvilwing, trenchwork-coder…).</p>
          <div class="meta">TypeScript • Ink • DeepSeek • node-pty • keychain</div>
          <a href="https://www.npmjs.com/package/anvilwing" target="_blank">npm install -g anvilwing →</a>
        </div>
        <div class="card">
          <h3>Frontier Model Index — three live auto-updated AI atlas sites + iOS</h3>
          <p>Leaderboards, China catch-up watch, LLM weights explainer. Daily Tavily+DeepSeek-V4 pipeline writes Firestore (Admin); static sites read live with seed fallback. No content redeploys. Includes hardware, business, military AI, op-eds.</p>
          <div class="meta">Firebase • DeepSeek dual-format • Tavily • SwiftUI</div>
          <a href="https://bo-sam-matter.web.app" target="_blank">bo-sam-matter.web.app →</a>
        </div>
        <div class="card">
          <h3>erosolar — honest small CoT LLM pipeline + agent stack + model-landscape updater</h3>
          <p>14M-param measured-only appreciation generator (0.99 validity), char+copy zero-shot generalization experiments, Infini-Attention, grounded verification. Built while using the same agentic Tavily+DeepSeek loop for the model-landscape updater. Additive Qwen agent runtime + vLLM. Auto-updating frontier model deep-dives demonstrating continuous cross-domain learning.</p>
          <div class="meta">PyTorch • SymPy/Z3 • QLoRA • vLLM • Angular chat • Tavily+DeepSeek</div>
          <a href="https://erosolar-llm.web.app" target="_blank">erosolar-llm.web.app →</a>
        </div>
        <div class="card">
          <h3>The Meridian — fully agentic Economist-style newspaper</h3>
          <p>Weekly editions + daily briefs, zero human in the editorial loop. DeepSeek plans/reports/writes/fact-checks; TTS narrates; multi-platform (Angular PWA, iOS, Watch) with unified audio + VAPID push + dynamic feeds. Cost-capped.</p>
          <div class="meta">Cloud Functions • DeepSeek+Tavily+OpenAI TTS • Angular • SwiftUI/Watch • VAPID</div>
          <a href="https://the-meridian.live" target="_blank">the-meridian.live →</a>
        </div>
        <div class="card">
          <h3>DRIFT — hard-science survival screenplay + living ecosystem</h3>
          <p>Full screenplay reader, 24 narrated stories, interactive auto-curated Living Science (weekly agent), long-horizon video director+renderer+stitch pipeline, grounded “Ask the Computer” companion, agentic story foundry, iOS port, ebook builder.</p>
          <div class="meta">Angular 21 • DeepSeek+Tavily+Seedance • Firebase • ffmpeg • OpenAI TTS • SwiftUI</div>
          <a href="https://drift-by-bo.web.app" target="_blank">drift-by-bo.web.app →</a>
        </div>
        <div class="card">
          <h3>Trenchwork — automatic work-momentum tracker for builders</h3>
          <p>Go desktop daemon (real activity + tool hooks), Firestore streaks, iOS + Watch Live Activities + one-tap approvals for long agent runs (Tailscale). 24/7 nudge scheduler. Google SSO. Owner-scoped everywhere.</p>
          <div class="meta">Go • Firebase (Spark-safe) • SwiftUI + ActivityKit • Tailscale • Lambda / GH Actions</div>
          <a href="https://trenchwork.live" target="_blank">trenchwork.live →</a>
        </div>
      </div>

      <p class="note">All of the above are real, shipped, and running (or published) as of {{ year }}. Many are kept fresh by the exact same agentic Tavily + DeepSeek-v4-pro patterns used for the live job and PhD trackers on this site. The projects themselves are primary evidence of Bo’s ability to enter new technical domains and reach production quality rapidly through deliberate agentic learning loops.</p>
      <p class="profiles" style="margin-top:1rem; font-size:.8rem; color:var(--muted);">
        Profiles: <a href="https://github.com/aroxora" target="_blank">GitHub</a> · 
        <a href="https://www.linkedin.com/in/bo-shang-04923b3a6" target="_blank">LinkedIn</a> 
        (best handle to claim: <a href="https://www.linkedin.com/in/boshang/" target="_blank">linkedin.com/in/boshang/</a>)
      </p>
    </div>
  `,
  styles: [`
    .work-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1rem; }
    .card { border:1px solid var(--line-soft); border-radius:var(--radius); padding:1.2rem 1.3rem; background:linear-gradient(180deg,var(--surface),var(--surface-2)); }
    .card h3 { font-family:var(--display); margin:0 0 .4rem; font-size:1.15rem; }
    .card p { color:var(--ink-2); font-size:.95rem; line-height:1.5; }
    .card .meta { font-family:var(--mono); font-size:.68rem; color:var(--solar); margin:.6rem 0; }
    .note { margin-top:1.6rem; color:var(--muted); font-size:.9rem; max-width:80ch; }
  `]
})
export class Work { year = new Date().getFullYear(); }
