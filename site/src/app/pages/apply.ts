import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FirestoreService, Application } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';

const STATUSES = ['flagged', 'drafted', 'queued', 'applied', 'interview', 'offer', 'rejected'];

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ application agent</p>
        <h2 class="title">Applications tracker — PhD &amp; jobs, visa-aware</h2>
        <p class="sub">A high-confidence agent (DeepSeek-v4-pro + Tavily) researches PhD programs and jobs in China, Hong Kong, the US and beyond, scores fit, works out the exact <strong>visa pathway</strong>, and drafts a tailored email. High-confidence finds are marked <em>drafted</em>; the rest are <em>flagged</em> for your review. Approving one queues it for the Proton worker to send.</p>
      </div>

      @if (!auth.isAdmin()) {
        <p class="muted">Admin-only. Sign in as the admin account (top bar) to run the agent and manage applications.</p>
      } @else {
        <div class="agent-bar">
          <span class="ab-label">Find applications →</span>
          @for (c of combos; track c.label) {
            <button class="btn" [disabled]="busy()" (click)="run(c.kind, c.region)">{{ c.label }}</button>
          }
          @if (busy()) { <span class="small">researching… (this calls the Lambda; ~20–40s)</span> }
          @if (msg()) { <span class="small">{{ msg() }}</span> }
        </div>
        <p class="visa-note small">Visa pathways: <b>CN PhD</b> → X1 study · <b>CN job</b> → Z work · <b>HK</b> → student/employment (IANG) · <b>US PhD</b> → F-1 · <b>US job</b> → H-1B/O-1.</p>

        <div class="filters">
          <select class="in" [(ngModel)]="kindF"><option value="">All kinds</option><option value="phd">PhD</option><option value="job">Jobs</option></select>
          <select class="in" [(ngModel)]="regionF"><option value="">All regions</option><option value="CN">China</option><option value="HK">Hong Kong</option><option value="US">United States</option><option value="other">Other</option></select>
          <select class="in" [(ngModel)]="statusF"><option value="">Any status</option>@for (s of statuses; track s) {<option [value]="s">{{ s }}</option>}</select>
          <span class="count small">{{ filtered().length }} of {{ apps().length }}</span>
        </div>

        @if (apps().length === 0) {
          <p class="muted">No applications yet — run the agent above (e.g. “PhD · China”). Results stream in here with full details. (Requires the Lambda backend deployed.)</p>
        }

        <div class="cards">
          @for (a of filtered(); track a.id) {
            <div class="acard" [class.flagged]="a.status==='flagged'">
              <div class="ah">
                <span class="ah-title"><strong>{{ a.institution }}</strong>@if (a.role) {<span class="role"> · {{ a.role }}</span>}</span>
                <span class="badges">
                  <span class="tag k-{{a.kind}}">{{ a.kind === 'phd' ? 'PhD' : 'job' }}</span>
                  <span class="tag">{{ a.region }}</span>
                  @if (a.visaType) { <span class="tag visa">{{ a.visaType }}</span> }
                </span>
              </div>
              <div class="conf"><span class="bar"><i [style.width.%]="(a.confidence||0)*100"></i></span><span class="small">{{ ((a.confidence||0)*100) | number:'1.0-0' }}% fit</span></div>
              @if (a.why) { <p class="why">{{ a.why }}</p> }
              <div class="meta small">
                @if (a.deadline) { <span>⏱ {{ a.deadline }}</span> }
                @if (a.contactEmail) { <span>✉ {{ a.contactEmail }}</span> }
                @if (a.url) { <a [href]="a.url" target="_blank" rel="noopener" class="go">source ↗</a> }
              </div>
              @if (a.visaNotes) { <p class="visa-line small"><strong>Visa.</strong> {{ a.visaNotes }}</p> }
              @if (a.draftEmail) {
                <details class="draft"><summary>Draft email</summary><pre>{{ a.draftEmail }}</pre></details>
              }
              <div class="actions">
                <label class="small">Status
                  <select class="in" [value]="a.status||'flagged'" (change)="setStatus(a, $any($event.target).value)">
                    @for (s of statuses; track s) {<option [value]="s">{{ s }}</option>}
                  </select>
                </label>
                @if (a.contactEmail && a.draftEmail) {
                  <button class="btn btn-solar tiny" [disabled]="busy()" (click)="queue(a)">Queue outreach →</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .agent-bar { display:flex; flex-wrap:wrap; gap:.45rem; align-items:center; margin-bottom:.5rem; }
    .ab-label { font-family:var(--mono); font-size:.72rem; color:var(--muted); margin-right:.2rem; }
    .visa-note { margin:.2rem 0 1rem; color:var(--muted); }
    .filters { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; margin-bottom:1rem; }
    .count { margin-left:auto; }
    .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:.8rem; }
    .acard { border:1px solid var(--line-soft); border-radius:12px; padding:.9rem 1rem; background:var(--surface); display:flex; flex-direction:column; gap:.4rem; }
    .acard.flagged { border-left:3px solid var(--solar); }
    .ah { display:flex; justify-content:space-between; gap:.5rem; align-items:flex-start; }
    .ah-title strong { font-size:.98rem; } .role { color:var(--muted); font-size:.85rem; }
    .badges { display:flex; gap:.3rem; flex-shrink:0; flex-wrap:wrap; }
    .tag { font:.6rem/1.4 var(--mono); padding:.05rem .35rem; border-radius:4px; background:var(--surface-2); color:var(--ink-2); white-space:nowrap; }
    .tag.k-phd { background:#243; color:#9fd; } .tag.k-job { background:#342; color:#fd9; } .tag.visa { background:#234; color:#9cf; }
    .conf { display:flex; align-items:center; gap:.5rem; }
    .conf .bar { flex:1; height:5px; background:var(--surface-2); border-radius:99px; overflow:hidden; }
    .conf .bar i { display:block; height:100%; background:var(--solar-grad); }
    .why { font-size:.88rem; color:var(--ink-2); margin:0; }
    .meta { display:flex; gap:.7rem; flex-wrap:wrap; color:var(--muted); }
    .visa-line { color:var(--muted); margin:0; }
    .draft summary { cursor:pointer; font-family:var(--mono); font-size:.72rem; color:var(--solar); }
    .draft pre { white-space:pre-wrap; font-size:.8rem; background:#0a0a0a; border:1px solid var(--line-soft); border-radius:8px; padding:.6rem; margin:.4rem 0 0; max-height:240px; overflow:auto; }
    .actions { display:flex; justify-content:space-between; align-items:center; gap:.5rem; margin-top:.2rem; }
    .tiny { font-size:.68rem; padding:.28rem .6rem; }
    .muted { color:var(--muted); }
  `],
})
export class Apply implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);
  auth = inject(AuthService);
  readonly statuses = STATUSES;
  readonly combos = [
    { label: 'PhD · China', kind: 'phd' as const, region: 'CN' },
    { label: 'PhD · Hong Kong', kind: 'phd' as const, region: 'HK' },
    { label: 'PhD · US', kind: 'phd' as const, region: 'US' },
    { label: 'Jobs · China', kind: 'job' as const, region: 'CN' },
    { label: 'Jobs · Hong Kong', kind: 'job' as const, region: 'HK' },
    { label: 'Jobs · US', kind: 'job' as const, region: 'US' },
  ];

  apps = signal<Application[]>([]);
  busy = signal(false);
  msg = signal('');
  kindF = ''; regionF = ''; statusF = '';
  private unsub?: () => void;

  ngOnInit() { if (this.auth.isAdmin()) this.unsub = this.fs.listenApplications2((a) => this.apps.set(a)); }
  ngOnDestroy() { this.unsub?.(); }

  filtered() {
    return this.apps().filter((a) =>
      (!this.kindF || a.kind === this.kindF) &&
      (!this.regionF || (this.regionF === 'other' ? !['CN', 'HK', 'US'].includes(a.region) : a.region === this.regionF)) &&
      (!this.statusF || (a.status || 'flagged') === this.statusF));
  }

  async run(kind: 'phd' | 'job', region: string) {
    this.busy.set(true); this.msg.set('');
    try { const r = await this.fs.findApplications(kind, region); this.msg.set(`+${r.written} found (${r.highConfidence} high-confidence)`); }
    catch (e: any) { this.msg.set('failed: ' + (e?.message || e)); }
    finally { this.busy.set(false); }
  }
  async setStatus(a: Application, status: string) { try { if (a.id) await this.fs.setApplicationStatus(a.id, status); } catch (e: any) { alert(e?.message || e); } }
  async queue(a: Application) {
    this.busy.set(true);
    try { await this.fs.queueApplicationOutreach(a); this.msg.set(`queued outreach to ${a.contactEmail}`); }
    catch (e: any) { alert(e?.message || e); }
    finally { this.busy.set(false); }
  }
}
