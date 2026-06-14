import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BAKED_I18N } from './i18n.data';
import { LAMBDA_API_BASE } from './api.config';

export type Lang = 'en' | 'zh';
interface Tr { zh: string; py: string; }

// Skip nodes/text that should never be machine-translated.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'svg', 'TEXTAREA', 'INPUT', 'OPTION', 'SELECT']);
const NO_LETTERS = /^[\s\d\W_]*$/;            // numbers / symbols / punctuation only
const EMAILY = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // emails
const URLY = /^(https?:\/\/|www\.|\/)/i;       // urls / paths

@Injectable({ providedIn: 'root' })
export class LangService {
  private doc = inject(DOCUMENT);

  readonly lang = signal<Lang>('en');
  readonly pinyin = signal(false);
  readonly busy = signal(false);

  private cache = new Map<string, Tr>();
  private originals = new WeakMap<Text, string>();
  private observer?: MutationObserver;

  constructor() {
    try {
      if (localStorage.getItem('lang') === 'zh') this.lang.set('zh');
      if (localStorage.getItem('pinyin') === '1') this.pinyin.set(true);
      const c = localStorage.getItem('i18nCache');
      if (c) for (const [k, v] of Object.entries(JSON.parse(c))) this.cache.set(k, v as Tr);
    } catch { /* ignore */ }
    for (const [k, v] of Object.entries(BAKED_I18N)) if (!this.cache.has(k)) this.cache.set(k, v);

    effect(() => {
      const l = this.lang();
      try { localStorage.setItem('lang', l); } catch {}
      this.doc.documentElement.setAttribute('lang', l === 'zh' ? 'zh-CN' : 'en');
    });
    effect(() => { try { localStorage.setItem('pinyin', this.pinyin() ? '1' : '0'); } catch {} });
  }

  setLang(l: Lang) { this.lang.set(l); this.refresh(); }
  togglePinyin() { this.pinyin.update((v) => !v); this.refresh(); }

  /** Re-translate the page; call after navigation and on language/pinyin change. */
  refresh() {
    // let Angular finish rendering first
    setTimeout(() => this.apply().catch(() => {}), 0);
  }

  private roots(): HTMLElement[] {
    const out: HTMLElement[] = [];
    const main = this.doc.querySelector('main');
    const nav = this.doc.querySelector('.nav__links');
    if (nav) out.push(nav as HTMLElement);
    if (main) out.push(main);
    return out;
  }

  private collect(): Text[] {
    const nodes: Text[] = [];
    for (const root of this.roots()) {
      const walker = this.doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n: Node) => {
          const t = (n.nodeValue || '').trim();
          if (t.length < 2 || NO_LETTERS.test(t) || EMAILY.test(t) || URLY.test(t)) return NodeFilter.FILTER_REJECT;
          let p: HTMLElement | null = (n as Text).parentElement;
          while (p) {
            if (SKIP_TAGS.has(p.tagName) || p.classList?.contains('notranslate')) return NodeFilter.FILTER_REJECT;
            p = p.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let cur: Node | null;
      while ((cur = walker.nextNode())) nodes.push(cur as Text);
    }
    return nodes;
  }

  private render(orig: string): string {
    const tr = this.cache.get(orig.trim());
    if (!tr) return orig;
    return this.pinyin() && tr.py ? `${tr.zh}（${tr.py}）` : tr.zh;
  }

  private async apply() {
    this.disconnect();
    const nodes = this.collect();

    if (this.lang() === 'en') {
      for (const n of nodes) { const o = this.originals.get(n); if (o != null && n.nodeValue !== o) n.nodeValue = o; }
      return;
    }

    // record originals + find untranslated unique strings
    const missing = new Set<string>();
    for (const n of nodes) {
      if (!this.originals.has(n)) this.originals.set(n, n.nodeValue || '');
      const key = (this.originals.get(n) || '').trim();
      if (key && !this.cache.has(key)) missing.add(key);
    }

    if (missing.size && LAMBDA_API_BASE) {
      try {
        this.busy.set(true);
        await this.fetchTranslations([...missing]);
      } catch { /* leave untranslated */ } finally { this.busy.set(false); }
    }

    for (const n of nodes) {
      const o = this.originals.get(n) || '';
      const lead = o.match(/^\s*/)?.[0] ?? '';
      const trail = o.match(/\s*$/)?.[0] ?? '';
      n.nodeValue = lead + this.render(o) + trail;
    }
    this.connect();
  }

  private async fetchTranslations(texts: string[]) {
    // batch to keep payloads reasonable
    const CH = 60;
    for (let i = 0; i < texts.length; i += CH) {
      const batch = texts.slice(i, i + CH);
      const r = await fetch(LAMBDA_API_BASE + '/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: batch, target: 'zh' }),
      });
      if (!r.ok) continue;
      const { map } = await r.json();
      if (map) for (const [k, v] of Object.entries(map)) this.cache.set(k, v as Tr);
    }
    try {
      const obj: Record<string, Tr> = {};
      this.cache.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem('i18nCache', JSON.stringify(obj));
    } catch { /* quota — ignore */ }
  }

  // Re-translate when Angular re-renders content (filters, route data) while in zh.
  private connect() {
    if (this.lang() === 'en') return;
    const main = this.doc.querySelector('main');
    if (!main) return;
    this.observer = new MutationObserver(() => {
      clearTimeout((this as any)._t);
      (this as any)._t = setTimeout(() => this.apply().catch(() => {}), 250);
    });
    this.observer.observe(main, { childList: true, subtree: true, characterData: true });
  }
  private disconnect() { this.observer?.disconnect(); this.observer = undefined; }
}
