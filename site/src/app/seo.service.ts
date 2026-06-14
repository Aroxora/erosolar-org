import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  path: string;
  noindex?: boolean;
}

const SITE = 'https://erosolar.org';
const OG_IMAGE = `${SITE}/og-card.svg`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  update(d: SeoData): void {
    this.title.setTitle(d.title);
    const url = SITE + (d.path === '/' || d.path === '' ? '/' : '/' + d.path.replace(/^\//, ''));

    this.name('description', d.description);
    if (d.keywords) this.name('keywords', d.keywords);
    this.name('author', 'Bo Shang');
    this.name('robots', d.noindex ? 'noindex, nofollow' : 'index, follow');

    this.prop('og:title', d.title);
    this.prop('og:description', d.description);
    this.prop('og:url', url);
    this.prop('og:type', 'website');
    this.prop('og:site_name', 'Bo Shang — erosolar.org');
    this.prop('og:image', OG_IMAGE);

    this.name('twitter:card', 'summary_large_image');
    this.name('twitter:title', d.title);
    this.name('twitter:description', d.description);
    this.name('twitter:image', OG_IMAGE);

    this.canonical(url);
  }

  private name(name: string, content: string) { this.meta.updateTag({ name, content }); }
  private prop(property: string, content: string) { this.meta.updateTag({ property, content }); }
  private canonical(href: string) {
    let link = this.doc.head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) { link = this.doc.createElement('link'); link.setAttribute('rel', 'canonical'); this.doc.head.appendChild(link); }
    link.setAttribute('href', href);
  }
}
