import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService, PhdProgram, Job } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { SEED_PHDS, SEED_JOBS } from '../seed.data';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ live trackers</p>
        <h2 class="title">AI lab jobs + top PhD / lab status</h2>
        <p>Agentically refreshed daily (or on-demand) with DeepSeek-v4-pro + Tavily. Includes explicit visa/sponsorship notes. DeepSeek roles often surface visa process details for international applicants.</p>
      </div>

      @if (auth.isAdmin()) {
        <div class="admin-bar">
          <button class="btn" (click)="scanJobs()">Force jobs scan (admin)</button>
          <button class="btn" (click)="scanPhd()">Force PhD scan (admin)</button>
          <span class="small">Writes to Firestore via callable. Results appear live.</span>
        </div>
      }

      <h3>PhD programs &amp; AI labs (US / China / Hong Kong / other)</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Program / Lab</th><th>Country</th><th>Status</th><th>Deadline</th><th>Notes / Visa</th></tr></thead>
          <tbody>
            @for (p of phds(); track p.id) {
              <tr>
                <td>{{ p.program }}</td>
                <td>{{ p.country }}</td>
                <td><span class="status" [class.open]="p.status==='open'" [class.closed]="p.status==='closed'">{{ p.status }}</span></td>
                <td>{{ p.deadline || '—' }}</td>
                <td class="small">{{ p.notes }} {{ p.visaNotes ? '· ' + p.visaNotes : '' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <h3 style="margin-top:2rem">Recent AI-lab + AI engineering / red-team / dev jobs</h3>
      <div class="jobs">
        @for (j of jobs().slice(0,18); track j.id) {
          <div class="job">
            <div><strong>{{ j.title }}</strong> @ {{ j.company }}</div>
            <div class="meta">{{ j.location || '' }} · {{ j.visaSponsorship || 'visa: check' }} · {{ j.level || '' }}</div>
            @if (j.url) { <a [href]="j.url" target="_blank" class="go">view posting →</a> }
            @if (j.description) { <p class="desc">{{ j.description }}</p> }
          </div>
        }
      </div>
      <p class="small">Full history and more filters live in the /jobs view. Data agent-written; verify primary sources before applying.</p>
    </div>
  `,
  styles: [`
    .admin-bar { display:flex; gap:.6rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap; }
    table { width:100%; border-collapse: collapse; }
    th,td { text-align:left; padding:.55rem .6rem; border-bottom:1px solid var(--line-soft); vertical-align:top; font-size:.92rem; }
    .status { padding:.05rem .4rem; border-radius:4px; font-size:.75rem; }
    .status.open { background:#1f3a2a; color:#9f9; }
    .status.closed { background:#3a2424; color:#f99; }
    .job { border:1px solid var(--line-soft); border-radius:10px; padding:.7rem .9rem; margin-bottom:.6rem; background:var(--surface); }
    .job .meta { font-family:var(--mono); font-size:.72rem; color:var(--muted); }
    .job .desc { margin:.4rem 0 0; color:var(--ink-2); font-size:.9rem; }
    .go { font-size:.8rem; }
    .small { font-size:.78rem; color:var(--muted); }
    .table-wrap { overflow:auto; }
  `]
})
export class Tracker implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);
  auth = inject(AuthService);
  phds = signal<PhdProgram[]>([]);
  jobs = signal<Job[]>([]);
  unsubs: Array<() => void> = [];

  ngOnInit() {
    this.unsubs.push(this.fs.listenPhds((p) => this.phds.set(p.length ? p : SEED_PHDS)));
    this.unsubs.push(this.fs.listenJobs((j) => this.jobs.set(j.length ? j : SEED_JOBS)));
  }
  ngOnDestroy() { this.unsubs.forEach(u => u()); }

  async scanJobs() { try { await this.fs.triggerJobsScan(); } catch (e:any){ alert(e?.message || e); } }
  async scanPhd() { try { await this.fs.triggerPhdScan(); } catch (e:any){ alert(e?.message || e); } }
}
