import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FirestoreService, Job } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ job openings</p>
        <h2 class="title">AI labs + AI engineering / red team / development roles</h2>
      </div>

      <div class="filters">
        <input class="in" [(ngModel)]="q" placeholder="Filter title / company / location">
        <select class="in" [(ngModel)]="visa">
          <option value="">Any visa status</option>
          <option value="visa">Mentions visa / sponsorship</option>
          <option value="intl">International / H1B / relocation friendly</option>
        </select>
        <button class="btn" (click)="refresh()">Refresh from live</button>
        @if (auth.isAdmin()) {
          <button class="btn btn-solar" (click)="force()">Force agent scan (admin)</button>
        }
      </div>

      <p class="note">
        Data is synthesized by agent from public sources. Always verify on the original posting. DeepSeek roles frequently note visa processes for qualified international candidates.
      </p>

      <div class="list">
        @for (j of filtered(); track j.id) {
          <div class="row">
            <div>
              <strong>{{ j.title }}</strong><br>
              <span class="co">{{ j.company }} — {{ j.location || 'location not specified' }}</span>
              @if (j.visaSponsorship) { <span class="vtag">{{ j.visaSponsorship }}</span> }
            </div>
            <div class="side">
              @if (j.url) { <a [href]="j.url" target="_blank" class="go">view</a> }
              @if (auth.isAdmin() && j.id) {
                <button class="btn tiny" (click)="draftApp(j.id)">Draft</button>
                <button class="btn tiny" (click)="queueApp(j.id)">Queue app</button>
              }
            </div>
          </div>
        }
        @if (filtered().length === 0) { 
          <p class="muted">
            No matches or no data yet — run a scan from the <a routerLink="/tracker">/tracker</a> page or the topbar chatbot (admin only).
            <br>
            As admin, click "Force agent scan (admin)" above or use the chatbot command "scan jobs now".
          </p> 
        }
      </div>

      @if (auth.isAdmin()) {
        <div class="admin-foot">
          <a routerLink="/applications">View all sent applications + queue →</a>
          <span class="small">Auto-apply (when enabled) prioritizes DeepSeek + visa/international roles using full resume context.</span>
        </div>
      }
      <p class="small">Data is synthesized by agent from public sources. Always verify on the original posting. DeepSeek roles frequently note visa processes for qualified international candidates.</p>
    </div>
  `,
  styles: [`
    .filters { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:1rem; }
    .in { background:#111; color:#ddd; border:1px solid #333; padding:.45rem .6rem; border-radius:8px; }
    .list { display:grid; gap:.4rem; }
    .row { display:flex; justify-content:space-between; gap:1rem; padding:.6rem .8rem; border:1px solid var(--line-soft); border-radius:10px; background:var(--surface); }
    .co { color:var(--muted); font-size:.9rem; }
    .vtag { font-size:.7rem; padding:.1rem .4rem; border:1px solid var(--solar); border-radius:4px; color:var(--solar); }
    .go { font-family:var(--mono); font-size:.75rem; }
    .small { margin-top:1rem; color:var(--muted); font-size:.78rem; }
    .muted { color:var(--muted); }
    .tiny { font-size:.65rem; padding:.15rem .4rem; }
    .admin-foot { margin-top:1rem; font-size:.8rem; }
  `]
})
export class Jobs implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);
  auth = inject(AuthService);
  jobs = signal<Job[]>([]);
  q = '';
  visa = '';
  unsub?: () => void;

  ngOnInit() { this.unsub = this.fs.listenJobs(j => this.jobs.set(j)); }
  ngOnDestroy() { this.unsub?.(); }

  filtered() {
    const term = this.q.toLowerCase();
    return this.jobs().filter(j => {
      const hay = ((j.title||'') + ' ' + (j.company||'') + ' ' + (j.location||'') + ' ' + (j.description||'')).toLowerCase();
      if (term && !hay.includes(term)) return false;
      if (this.visa === 'visa' && !/visa|sponsor|international|h1b/i.test((j.visaSponsorship||'') + hay)) return false;
      if (this.visa === 'intl' && !/international|relocation|h1b|visa/i.test(hay)) return false;
      return true;
    });
  }

  refresh() { /* listener already live */ }
  async force() { try { await this.fs.triggerJobsScan(); } catch(e:any){ alert(e.message||e); } }

  async draftApp(jobId: string) {
    try {
      const res: any = await this.fs.draftJobApplication(jobId, 'Tailor for visa/international if applicable. Keep concise and specific to Bo\'s agentic projects.');
      alert('Draft ready (copy from alert or use chatbot for more control):\n\n' + (res?.draft || JSON.stringify(res)));
    } catch (e:any) { alert('Draft failed: ' + (e.message || e)); }
  }

  async queueApp(jobId: string) {
    const to = prompt('Recipient email (or leave blank for worker to use a reasonable one):') || '';
    const notes = prompt('Extra notes for drafter (e.g. "emphasize DeepSeek experience and visa willingness")') || '';
    try {
      await this.fs.queueJobApplication(jobId, to, notes);
      alert('Queued. Local Proton worker will draft (if needed) + send when running + autoApply or manual drain.');
    } catch (e:any) { alert('Queue failed: ' + (e.message || e)); }
  }
}
