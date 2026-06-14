import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LAMBDA_API_BASE } from '../api.config';

interface Commit { repo: string; message: string; sha: string; url: string; date: number; }

@Component({
  selector: 'app-commits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ build momentum</p>
        <h2 class="title">GitHub commit tracker</h2>
        <p class="sub">
          Live feed of recent public commits across Bo Shang's GitHub
          (<a [href]="'https://github.com/' + user" target="_blank" rel="noopener" class="go">{{ '@' + user }}</a>).
          A local momentum agent watches the pace and emails <strong>bo&#64;shang.software</strong> (drafted by
          deepseek-v4-flash) whenever the time since the last commit drops below the recent average — at most once
          every 12 hours, to respect sleep.
        </p>
      </div>

      @if (loading()) { <p class="muted">Loading commit activity from GitHub…</p> }
      @if (error()) { <p class="muted">Couldn't load from GitHub: {{ error() }} <button class="btn" (click)="load()">Retry</button></p> }

      @if (stats(); as s) {
        <div class="stats">
          <div class="stat"><span class="n">{{ s.count }}</span><span class="l">recent commits</span></div>
          <div class="stat"><span class="n">{{ s.repos }}</span><span class="l">repos active</span></div>
          <div class="stat"><span class="n">{{ s.avgHrs < 1 ? (s.avgHrs*60 | number:'1.0-0') + 'm' : (s.avgHrs | number:'1.1-1') + 'h' }}</span><span class="l">avg between commits</span></div>
          <div class="stat" [class.good]="s.onPace" [class.bad]="!s.onPace">
            <span class="n">{{ s.sinceHrs < 1 ? (s.sinceHrs*60 | number:'1.0-0') + 'm' : (s.sinceHrs | number:'1.1-1') + 'h' }}</span>
            <span class="l">since last commit · {{ s.onPace ? 'on pace ✓' : 'below pace ✕' }}</span>
          </div>
        </div>
      }

      <div class="feed">
        @for (c of commits(); track c.url) {
          <a class="row" [href]="c.url" target="_blank" rel="noopener">
            <span class="msg">{{ c.message }}</span>
            <span class="meta"><span class="repo">{{ shortRepo(c.repo) }}</span> · <span class="sha">{{ c.sha }}</span> · <span class="when">{{ ago(c.date) }}</span></span>
          </a>
        }
      </div>

      @if (!loading() && commits().length === 0 && !error()) {
        <p class="muted">No recent public push events found (GitHub's activity feed only surfaces recent public commits).</p>
      }
    </div>
  `,
  styles: [`
    .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.7rem; margin:1rem 0 1.6rem; }
    .stat { border:1px solid var(--line-soft); border-radius:12px; padding:.9rem 1rem; background:var(--surface); display:flex; flex-direction:column; gap:.2rem; }
    .stat .n { font-family:var(--display); font-size:1.7rem; line-height:1; }
    .stat .l { font-family:var(--mono); font-size:.7rem; color:var(--muted); }
    .stat.good { border-color:#2a5; } .stat.good .n { color:#8be0a0; }
    .stat.bad { border-color:var(--solar); } .stat.bad .n { color:var(--solar); }
    .feed { display:grid; gap:.35rem; }
    .row { display:flex; justify-content:space-between; gap:1rem; align-items:baseline; padding:.55rem .8rem; border:1px solid var(--line-soft); border-radius:9px; background:var(--surface); transition:border-color .2s; }
    .row:hover { border-color:var(--amber); }
    .msg { color:var(--ink-2); font-size:.92rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .meta { font-family:var(--mono); font-size:.68rem; color:var(--muted); white-space:nowrap; flex-shrink:0; }
    .repo { color:var(--solar); } .sha { color:var(--faint); }
    .muted { color:var(--muted); }
    @media (max-width:560px){ .row { flex-direction:column; gap:.2rem; } .meta { white-space:normal; } }
  `],
})
export class Commits implements OnInit {
  readonly user = 'Aroxora';
  commits = signal<Commit[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    this.error.set('');
    // 1) Prefer the authenticated Lambda proxy (fuller feed across all public repos,
    //    rate-limit-proof). The token stays server-side; only public repos are returned.
    if (LAMBDA_API_BASE) {
      try {
        const r = await fetch(LAMBDA_API_BASE + '/commits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data.commits) && data.commits.length) {
            this.commits.set(data.commits);
            this.loading.set(false);
            return;
          }
        }
      } catch { /* fall through to the client-side public API */ }
    }
    // 2) Fallback: client-side public events API (works with no backend).
    try {
      const r = await fetch(`https://api.github.com/users/${this.user}/events/public?per_page=100`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) throw new Error(`GitHub API ${r.status}${r.status === 403 ? ' (rate limit — try again shortly)' : ''}`);
      const events = await r.json();
      const out: Commit[] = [];
      for (const e of events) {
        if (e.type === 'PushEvent' && e.payload?.commits?.length) {
          const repo = e.repo?.name || '';
          const t = new Date(e.created_at).getTime();
          for (const c of e.payload.commits) {
            out.push({ repo, message: (c.message || '').split('\n')[0], sha: (c.sha || '').slice(0, 7), url: `https://github.com/${repo}/commit/${c.sha}`, date: t });
          }
        }
      }
      out.sort((a, b) => b.date - a.date);
      this.commits.set(out);
    } catch (e: any) {
      this.error.set(e?.message || String(e));
    } finally {
      this.loading.set(false);
    }
  }

  stats = computed(() => {
    const c = this.commits();
    if (c.length < 2) return null;
    const times = c.map((x) => x.date);
    const gaps: number[] = [];
    for (let i = 0; i < times.length - 1; i++) gaps.push(times[i] - times[i + 1]);
    const avg = gaps.reduce((s, x) => s + x, 0) / (gaps.length || 1);
    const sinceLast = Date.now() - times[0];
    return { count: c.length, avgHrs: avg / 3600000, sinceHrs: sinceLast / 3600000, onPace: sinceLast <= avg, repos: new Set(c.map((x) => x.repo)).size };
  });

  shortRepo(r: string) { return (r || '').split('/').pop() || r; }
  ago(ms: number) {
    const h = (Date.now() - ms) / 3600000;
    if (h < 1) return Math.round(h * 60) + 'm ago';
    if (h < 24) return h.toFixed(1) + 'h ago';
    return (h / 24).toFixed(1) + 'd ago';
  }
}
