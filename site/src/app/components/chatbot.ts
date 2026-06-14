import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat" *ngIf="open()">
      <div class="head">
        <strong>Admin co-pilot</strong> (DeepSeek-v4-pro + live context)
        <button class="x" (click)="close()">×</button>
      </div>
      <div class="log" #scroll>
        @for (m of messages(); track $index) {
          <div class="msg" [class.u]="m.role==='user'">
            <div class="b">{{ m.content }}</div>
          </div>
        }
        @if (busy()) { <div class="msg sys"><i>thinking…</i></div> }
      </div>
      <div class="bar">
        <input class="in" [(ngModel)]="input" (keyup.enter)="send()" placeholder="Ask about jobs, PhD status, draft outreach, write a site update, toggle auto...">
        <button class="btn" (click)="send()" [disabled]="busy() || !input.trim()">Send</button>
      </div>
      <div class="hint" *ngIf="auth.isAdmin()">
        Try: "scan jobs now", "toggle outreach on", "toggle autoApply on", "draft app for the latest DeepSeek role", "queue application for job [id or title]", "review pending applications", "draft email to anthropic...", "log update..."
      </div>
    </div>
  `,
  styles: [`
    .chat { position:fixed; bottom:18px; right:18px; width:min(92vw,420px); max-height:62vh; background:#111; border:1px solid #333; border-radius:14px; box-shadow:0 20px 60px -20px #000; display:flex; flex-direction:column; z-index:999; overflow:hidden; font-size:.92rem; }
    .head { padding:.5rem .7rem; background:#1a1a1a; display:flex; align-items:center; justify-content:space-between; font-family:var(--mono); font-size:.78rem; }
    .x { background:none; border:0; color:#888; font-size:1.4rem; line-height:1; cursor:pointer; }
    .log { flex:1; overflow:auto; padding:.6rem; display:flex; flex-direction:column; gap:.45rem; background:#0a0a0a; }
    .msg { max-width:88%; }
    .msg.u { align-self:flex-end; }
    .b { padding:.45rem .65rem; border-radius:10px; background:#222; white-space:pre-wrap; }
    .msg.u .b { background:#2a2118; }
    .sys { color:#888; font-style:italic; font-size:.8rem; }
    .bar { display:flex; gap:.4rem; padding:.5rem; border-top:1px solid #222; background:#111; }
    .in { flex:1; background:#0a0a0a; color:#ddd; border:1px solid #333; padding:.4rem .5rem; border-radius:8px; }
    .hint { padding:.3rem .6rem; font-size:.7rem; color:#666; border-top:1px solid #222; }
  `]
})
export class Chatbot {
  private fs = inject(FirestoreService);
  auth = inject(AuthService);
  open = signal(false);
  messages = signal<Array<{role:'user'|'assistant', content:string}>>([{role:'assistant', content:'Hello — I have live jobs, PhD statuses, and the update log. How can I help today?'}]);
  input = '';
  busy = signal(false);

  show() { this.open.set(true); }
  close() { this.open.set(false); }

  async send() {
    const text = this.input.trim();
    if (!text || this.busy()) return;
    this.messages.update(m => [...m, {role:'user', content: text}]);
    this.input = '';
    this.busy.set(true);

    try {
      const hist = this.messages().slice(0,-1).map(m => ({role: m.role === 'user' ? 'user' : 'assistant', content: m.content}));
      const res: any = await this.fs.callChat(text, hist);
      const reply = res?.reply || '(no reply)';
      this.messages.update(m => [...m, {role:'assistant', content: reply}]);

      // naive ACTION parser for common cases the UI can act on (extended for auto job apps)
      const lower = reply.toLowerCase();
      if (lower.includes('action:') && lower.includes('scan job')) { this.fs.triggerJobsScan().catch(()=>{}); }
      if (lower.includes('action:') && lower.includes('scan phd')) { this.fs.triggerPhdScan().catch(()=>{}); }
      if (lower.includes('action:') && lower.includes('outreach on')) { this.fs.setOutreachAuto(true).catch(()=>{}); }
      if (lower.includes('action:') && lower.includes('outreach off')) { this.fs.setOutreachAuto(false).catch(()=>{}); }
      if (lower.includes('action:') && lower.includes('autoapply on') || lower.includes('auto-apply on')) { this.fs.setAutoApply(true).catch(()=>{}); }
      if (lower.includes('action:') && lower.includes('autoapply off') || lower.includes('auto-apply off')) { this.fs.setAutoApply(false).catch(()=>{}); }
      if (lower.includes('action:') && lower.includes('log update')) {
        const m = reply.match(/log update[:\s]+([\s\S]{10,200})/i);
        if (m) this.fs.writeManualUpdate(new Date().toISOString().slice(0,10), 'Chatbot note', m[1].trim()).catch(()=>{});
      }
      // If chatbot returned a draft or suggested queue, user can follow up manually via /jobs buttons
      if (lower.includes('action:') && lower.includes('draft app')) {
        // The CF draftJobApplication is best called from /jobs page or explicit; here we just notify
        console.info('Chat suggested drafting an app — use the Draft button on a job row or call draftJobApplication callable.');
      }
    } catch (e: any) {
      this.messages.update(m => [...m, {role:'assistant', content: 'Error: ' + (e?.message || e)}]);
    } finally {
      this.busy.set(false);
    }
  }
}
