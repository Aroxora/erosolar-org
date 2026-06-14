import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  ViewContainerRef,
  createComponent,
  EnvironmentInjector,
  ApplicationRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { FirestoreService } from './services/firestore.service';
import { Chatbot } from './components/chatbot';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  auth = inject(AuthService);
  private fs = inject(FirestoreService);
  private envInjector = inject(EnvironmentInjector);
  private appRef = inject(ApplicationRef);

  @ViewChild('field') private fieldRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('hero') private heroRef?: ElementRef<HTMLElement>;
  @ViewChild('navbar') private navRef?: ElementRef<HTMLElement>;
  @ViewChild('progress') private progressRef?: ElementRef<HTMLElement>;
  @ViewChild('clock') private clockRef?: ElementRef<HTMLElement>;
  @ViewChild('chatHost', { read: ViewContainerRef }) private chatHost?: ViewContainerRef;

  readonly year = new Date().getFullYear();
  readonly ADMIN = 'daburu.dragon@gmail.com';

  // Simple top-level nav for router
  readonly nav = [
    { path: '', label: 'Home' },
    { path: '/work', label: 'Work' },
    { path: '/blog', label: 'Log' },
    { path: '/tracker', label: 'Tracker' },
    { path: '/phd-labs', label: 'PhD & Labs' },
    { path: '/jobs', label: 'Jobs' },
    { path: '/#learning', label: 'Learn' },
  ];

  private raf = 0;
  private io?: IntersectionObserver;
  private readonly cleanup: Array<() => void> = [];
  private chatbotRef?: any;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.startField();
      this.bindPointer();
      this.bindScroll();
      this.bindReveal();
      this.bindClock();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.cleanup.forEach((fn) => fn());
  }

  openChat() {
    if (!this.chatbotRef) {
      if (this.chatHost) {
        const c = createComponent(Chatbot, {
          environmentInjector: this.envInjector,
          hostElement: this.chatHost.element.nativeElement,
        });
        this.appRef.attachView(c.hostView);
        this.chatbotRef = c.instance;
      }
    }
    this.chatbotRef?.show?.();
  }

  async toggleOutreach() {
    if (!this.auth.isAdmin()) return;
    const current = await this.fs.getOutreachAuto();
    await this.fs.setOutreachAuto(!current);
    alert('Outreach auto set to ' + !current + ' (local worker will respect the flag on next poll).');
  }

  async toggleAutoApply() {
    if (!this.auth.isAdmin()) return;
    const current = await this.fs.getAutoApply();
    await this.fs.setAutoApply(!current);
    alert('Auto job application mode set to ' + !current + '. When ON the local worker will auto-select high-fit roles (DeepSeek visa etc.), draft using full resume context, send, and log complete applications.');
  }

  signIn() { this.auth.signInGoogle(); }
  signOut() { this.auth.signOut(); }

  // (kept original canvas code, lightly trimmed)
  private startField(): void {
    const canvas = this.fieldRef?.nativeElement;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const palette = ['#ffc24a', '#ff9e2c', '#ff6a2c', '#e8431f', '#5c87b0'];
    const pointer = { x: -9999, y: -9999, active: false };
    let w = 0; let h = 0; let motes: any[] = [];

    const make = () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.6 + 0.5, vy: Math.random() * 0.5 + 0.15,
      vx: (Math.random() - 0.5) * 0.25, a: Math.random() * 0.5 + 0.22,
      seed: Math.random() * 100,
      color: palette[(Math.random() * palette.length) | 0],
    });

    const resize = () => {
      w = host.clientWidth; h = host.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(120, Math.max(34, (w * h) / 14000)));
      motes = Array.from({ length: count }, make);
    };
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of motes) {
        p.y -= p.vy; p.x += p.vx + Math.sin((p.y + p.seed) * 0.012) * 0.25;
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx*dx+dy*dy;
          if (d2 < 13000) {
            const d = Math.sqrt(d2) || 1;
            const f = ((13000 - d2) / 13000) * 1.4;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
        }
        if (p.y < -24) { p.y = h + 24; p.x = Math.random() * w; }
        if (p.x < -24) p.x = w + 24;
        if (p.x > w + 24) p.x = -24;
        const tw = 0.6 + Math.sin(p.y * 0.05 + p.seed) * 0.4;
        const rad = p.r * (0.85 + tw * 0.3) * 4;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, p.color); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = p.a * tw; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    };

    let running = true;
    const loop = () => { if (!running) return; this.raf = requestAnimationFrame(loop); draw(); };

    const onResize = () => resize();
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; pointer.x = -9999; pointer.y = -9999; };
    const onVis = () => { running = !document.hidden; if (running && !reduce) loop(); };

    window.addEventListener('resize', onResize, { passive: true });
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });
    document.addEventListener('visibilitychange', onVis);

    if (reduce) draw(); else loop();
    this.cleanup.push(() => { running = false; window.removeEventListener('resize', onResize); /* ... */ });
  }

  private bindPointer(): void {
    const hero = this.heroRef?.nativeElement; if (!hero) return;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    this.cleanup.push(() => hero.removeEventListener('pointermove', onMove));
  }

  private bindScroll(): void {
    const nav = this.navRef?.nativeElement;
    const bar = this.progressRef?.nativeElement;
    let ticking = false;
    const update = () => {
      ticking = false;
      const sc = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${docH > 0 ? sc / docH : 0})`;
      if (nav) nav.classList.toggle('is-scrolled', sc > 24);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    this.cleanup.push(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); });
  }

  private bindReveal(): void {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('is-in')); return; }
    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).classList.add('is-in'); this.io?.unobserve(e.target); }
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    items.forEach(i => this.io?.observe(i));
  }

  private bindClock(): void {
    const el = this.clockRef?.nativeElement; if (!el) return;
    const tick = () => { el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); };
    tick(); const id = window.setInterval(tick, 15000);
    this.cleanup.push(() => clearInterval(id));
  }
}
