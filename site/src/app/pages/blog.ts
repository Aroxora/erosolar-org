import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService, Update } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { SEED_UPDATES } from '../seed.data';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section">
      <div class="section-head">
        <p class="kicker">/ agentic log</p>
        <h2 class="title">Dated updates — blog style</h2>
        <p class="sub">Auto-written (and manually extended) by DeepSeek-v4-pro + Tavily. Past today’s date.</p>
      </div>

      @if (updates().length === 0) {
        <p class="muted">Loading live updates from Firestore… (or seed a first one via the chatbot once authed).</p>
      }

      <div class="log">
        @for (u of updates(); track u.id) {
          <article class="entry">
            <div class="when">{{ u.date }} <span class="tag">{{ u.type }}</span> <span class="agent" *ngIf="u.agent">· {{ u.agent }}</span></div>
            <h3>{{ u.title }}</h3>
            <p>{{ u.body }}</p>
          </article>
        }
      </div>

      @if (auth.isAdmin()) {
        <div class="admin-box">
          <h4>Admin: write a manual dated update</h4>
          <input class="in" placeholder="Title" #title>
          <textarea class="in" rows="3" placeholder="Body (markdown-ish)" #body></textarea>
          <button class="btn btn-solar" (click)="write(title.value, body.value); title.value=''; body.value=''">Write update</button>
          <small>Will also appear in the home resume highlights over time.</small>
        </div>
      }
    </div>
  `,
  styles: [`
    .log { display: grid; gap: 1rem; }
    .entry { border:1px solid var(--line-soft); border-radius:12px; padding:1rem 1.2rem; background:var(--surface); }
    .when { font-family:var(--mono); font-size:.72rem; color:var(--solar); }
    .tag { border:1px solid var(--line); padding:0 .4rem; border-radius:999px; font-size:.65rem; }
    .admin-box { margin-top:2rem; padding:1rem; border:1px dashed var(--line); border-radius:12px; }
    .in { width:100%; margin:.3rem 0; background:#111; color:#ddd; border:1px solid #333; padding:.6rem; border-radius:8px; font-family:inherit; }
    .muted { color:var(--muted); }
  `]
})
export class Blog implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);
  auth = inject(AuthService);
  updates = signal<Update[]>([]);
  private unsub?: () => void;

  ngOnInit() {
    this.unsub = this.fs.listenUpdates((u) => this.updates.set(u.length ? u : SEED_UPDATES));
  }
  ngOnDestroy() { this.unsub?.(); }

  async write(title: string, body: string) {
    if (!title || !body) return;
    const d = new Date().toISOString().slice(0,10);
    await this.fs.writeManualUpdate(d, title, body, 'site');
    // live listener will pick it up
  }
}
