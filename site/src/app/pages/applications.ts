import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService, JobApplication, ApplicationQueueItem } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ agentic applications</p>
        <h2 class="title">Auto + manual job applications + full history</h2>
        <p class="sub">When Auto-Apply is enabled (topbar toggle or chatbot "toggle autoApply on"), the local Proton worker auto-selects high-fit roles (DeepSeek visa-track, AI eng/red-team, frontier labs), drafts personalized applications using the complete shipped-project resume context, sends via bridge, and logs the COMPLETE text here.</p>
      </div>

      @if (!auth.isAdmin()) {
        <p class="muted">Admin-only (sign in as daburu.dragon@gmail.com to view and control).</p>
      } @else {
        <div class="admin-bar">
          <button class="btn" (click)="toggleAuto()">{{ autoApply() ? 'Disable' : 'Enable' }} auto-apply (DeepSeek/visa priority)</button>
          <a class="btn" routerLink="/jobs">Browse jobs →</a>
          <a class="btn" routerLink="/tracker">Tracker + PhD →</a>
        </div>

        <h3>Pending queue (will be drained by local worker)</h3>
        @if (queue().length === 0) { <p class="small">Queue empty. Use "Draft & queue" on a job in /jobs or let auto-select do it.</p> }
        <div class="qlist">
          @for (q of queue(); track q.id) {
            <div class="qrow">
              <strong>{{ q.title }}</strong> @ {{ q.company }}
              <div class="meta">{{ q.notes || '' }}</div>
            </div>
          }
        </div>

        <h3 style="margin-top:1.6rem">Sent applications (full logged text)</h3>
        @if (apps().length === 0) { <p class="small">No applications sent yet. Trigger via chatbot ("draft app for jobId...", "queue application...") or enable auto-apply.</p> }

        <div class="applist">
          @for (a of apps(); track a.id) {
            <div class="appcard">
              <div class="hdr">
                <strong>{{ a.title }}</strong> — {{ a.company }}
                <span class="vtag" *ngIf="a.visaContext">{{ a.visaContext }}</span>
              </div>
              <div class="meta">to: {{ a.to }} · via: {{ a.via }} · {{ a.status || 'sent' }}</div>
              <pre class="body">{{ a.bodySent }}</pre>
              <div class="small">Logged {{ a._scanDate || '' }} — full agentic history preserved.</div>
            </div>
          }
        </div>

        <div class="note">
          All applications use the same DeepSeek-v4-pro + rich resume context as the rest of the agentic surface. Outreach (general) and job applications are logged both in jobApplications and outreachHistory for unified review.
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-bar { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:1rem; }
    .qlist, .applist { display:grid; gap:.6rem; }
    .qrow { border:1px solid var(--line-soft); padding:.6rem .8rem; border-radius:8px; background:var(--surface); font-size:.9rem; }
    .appcard { border:1px solid var(--line-soft); border-radius:10px; padding:.7rem .9rem; background:var(--surface); }
    .hdr { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
    .vtag { font-size:.65rem; padding:.05rem .4rem; border:1px solid var(--solar); border-radius:3px; color:var(--solar); }
    .meta { font-family:var(--mono); font-size:.7rem; color:var(--muted); margin:.2rem 0 .4rem; }
    .body { white-space:pre-wrap; font-size:.82rem; background:#0a0a0a; padding:.5rem; border-radius:6px; border:1px solid #222; max-height:260px; overflow:auto; margin:.3rem 0; }
    .small, .note { font-size:.78rem; color:var(--muted); }
    .muted { color:var(--muted); }
  `]
})
export class Applications implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);
  auth = inject(AuthService);
  apps = signal<JobApplication[]>([]);
  queue = signal<ApplicationQueueItem[]>([]);
  autoApply = signal(false);
  unsubs: any[] = [];

  ngOnInit() {
    if (this.auth.isAdmin()) {
      this.unsubs.push(this.fs.listenApplications(a => this.apps.set(a)));
      this.unsubs.push(this.fs.listenAppQueue(q => this.queue.set(q)));
      this.fs.getAutoApply().then(v => this.autoApply.set(v));
    }
  }
  ngOnDestroy() { this.unsubs.forEach(u => u && u()); }

  async toggleAuto() {
    const next = !this.autoApply();
    await this.fs.setAutoApply(next);
    this.autoApply.set(next);
  }
}
