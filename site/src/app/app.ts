import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
} from '@angular/core';

interface Mote {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  a: number;
  seed: number;
  color: string;
}

interface Focus {
  tag: string;
  label: string;
  body: string;
}

interface Project {
  name: string;
  meta: string;
  blurb: string;
  href?: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  @ViewChild('field') private fieldRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('hero') private heroRef?: ElementRef<HTMLElement>;
  @ViewChild('navbar') private navRef?: ElementRef<HTMLElement>;
  @ViewChild('progress') private progressRef?: ElementRef<HTMLElement>;
  @ViewChild('clock') private clockRef?: ElementRef<HTMLElement>;

  readonly year = new Date().getFullYear();

  // ── EDIT: nav sections ──────────────────────────────────────────────
  readonly nav = [
    { id: 'work', label: 'Work' },
    { id: 'focus', label: 'Focus' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  // ── EDIT: what you do ───────────────────────────────────────────────
  readonly focus: Focus[] = [
    { tag: '01', label: 'Software engineering', body: 'Full-stack web and cloud — dependable systems from data model to interface.' },
    { tag: '02', label: 'Solar & clean energy', body: 'Work at ero.solar where software meets solar power.' },
    { tag: '03', label: 'Web & product', body: 'Fast, accessible front-ends and the services behind them.' },
    { tag: '04', label: 'Automation & data', body: 'Tooling that turns messy inputs into something you can rely on.' },
  ];

  // ── EDIT: replace with your real projects (specifics beat adjectives) ─
  readonly projects: Project[] = [
    { name: 'ero.solar', meta: 'Software · Solar', blurb: 'Home base for my software and solar-energy work. Replace this with a real description of what ero.solar is and does.', href: 'mailto:bo@ero.solar' },
    { name: 'Project two', meta: 'Add a tag', blurb: 'A concrete thing you built — the problem, what you made, the result. Numbers and tech land better than adjectives.' },
    { name: 'Project three', meta: 'Add a tag', blurb: 'Another piece of work worth showing. Link it to a repo, a demo, or a write-up.' },
  ];

  private raf = 0;
  private io?: IntersectionObserver;
  private readonly cleanup: Array<() => void> = [];

  ngAfterViewInit(): void {
    // All visual/interaction work runs outside Angular to avoid change-detection churn.
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

  /** Drifting solar motes on the hero canvas, with gentle cursor repulsion. */
  private startField(): void {
    const canvas = this.fieldRef?.nativeElement;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const palette = ['#ffd36e', '#ff9f45', '#ff7a33', '#ff5a36'];
    const pointer = { x: -9999, y: -9999, active: false };
    let w = 0;
    let h = 0;
    let motes: Mote[] = [];

    const make = (): Mote => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.5,
      vy: Math.random() * 0.5 + 0.15,
      vx: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.22,
      seed: Math.random() * 100,
      color: palette[(Math.random() * palette.length) | 0],
    });

    const resize = (): void => {
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(120, Math.max(34, (w * h) / 14000)));
      motes = Array.from({ length: count }, make);
    };
    resize();

    const draw = (): void => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of motes) {
        p.y -= p.vy;
        p.x += p.vx + Math.sin((p.y + p.seed) * 0.012) * 0.25;
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 13000) {
            const d = Math.sqrt(d2) || 1;
            const f = ((13000 - d2) / 13000) * 1.4;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
        if (p.y < -24) { p.y = h + 24; p.x = Math.random() * w; }
        if (p.x < -24) p.x = w + 24;
        if (p.x > w + 24) p.x = -24;
        const tw = 0.6 + Math.sin(p.y * 0.05 + p.seed) * 0.4;
        const rad = p.r * (0.85 + tw * 0.3) * 4;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'transparent');
        ctx.globalAlpha = p.a * tw;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    let running = true;
    const loop = (): void => {
      if (!running) return;
      this.raf = requestAnimationFrame(loop);
      draw();
    };

    const onResize = (): void => resize();
    const onMove = (e: PointerEvent): void => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const onLeave = (): void => { pointer.active = false; pointer.x = -9999; pointer.y = -9999; };
    const onVis = (): void => {
      running = !document.hidden;
      if (running && !reduce) loop();
    };

    window.addEventListener('resize', onResize, { passive: true });
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });
    document.addEventListener('visibilitychange', onVis);

    if (reduce) draw();
    else loop();

    this.cleanup.push(() => {
      running = false;
      window.removeEventListener('resize', onResize);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    });
  }

  /** Hero light follows the cursor via CSS custom properties. */
  private bindPointer(): void {
    const hero = this.heroRef?.nativeElement;
    if (!hero) return;
    const onMove = (e: PointerEvent): void => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    this.cleanup.push(() => hero.removeEventListener('pointermove', onMove));
  }

  /** Top progress bar, condensed nav on scroll, and scroll-spy. */
  private bindScroll(): void {
    const nav = this.navRef?.nativeElement;
    const bar = this.progressRef?.nativeElement;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-spy]'));
    let ticking = false;

    const update = (): void => {
      ticking = false;
      const sc = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const p = docH > 0 ? sc / docH : 0;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (nav) nav.classList.toggle('is-scrolled', sc > 24);
      let current = sections[0]?.id ?? '';
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) current = s.id;
      }
      for (const l of links) l.classList.toggle('active', l.dataset['spy'] === current);
    };

    const onScroll = (): void => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    this.cleanup.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  }

  /** Reveal elements as they enter the viewport. */
  private bindReveal(): void {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      items.forEach((i) => i.classList.add('is-in'));
      return;
    }
    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('is-in');
            this.io?.unobserve(e.target);
          }
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach((i) => this.io?.observe(i));
  }

  /** Ambient live clock in the footer. */
  private bindClock(): void {
    const el = this.clockRef?.nativeElement;
    if (!el) return;
    const tick = (): void => {
      el.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    };
    tick();
    const id = window.setInterval(tick, 15000);
    this.cleanup.push(() => clearInterval(id));
  }
}
