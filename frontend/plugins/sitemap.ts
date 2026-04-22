// MARK: - Vite Plugin: Sitemap Generator
// Walks content/stories/**/*.mdx at build time and emits:
//   • dist/sitemap.xml  — every book + every chapter
//   • dist/robots.txt   — overrides public/robots.txt with absolute sitemap URL
// Both are deterministic and need zero runtime cost.

import { readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import type { Plugin } from 'vite';

interface SitemapOptions {
  storiesDir: string;
  siteUrl: string; // e.g. "https://hamzayslmn.github.io/mystory"
}

interface UrlEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function collectUrls(storiesDir: string, base: string): UrlEntry[] {
  const urls: UrlEntry[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // MARK: - Library root
  urls.push({ loc: `${base}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' });

  // MARK: - Each book + every chapter
  for (const bookDir of readdirSync(storiesDir, { withFileTypes: true })) {
    if (!bookDir.isDirectory() || bookDir.name.startsWith('.')) continue;
    const bookPath = join(storiesDir, bookDir.name);
    const pages: { slug: string; mtime: string }[] = [];

    for (const file of readdirSync(bookPath, { withFileTypes: true })) {
      if (!file.isFile()) continue;
      if (extname(file.name) !== '.mdx') continue;
      const slug = basename(file.name, '.mdx');
      const mtime = statSync(join(bookPath, file.name)).mtime.toISOString().slice(0, 10);
      pages.push({ slug, mtime });
    }
    pages.sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));
    if (!pages.length) continue;

    // First chapter URL doubles as the book entry point.
    for (const p of pages) {
      urls.push({
        loc: `${base}/reader/${bookDir.name}/${p.slug}`,
        lastmod: p.mtime,
        changefreq: 'monthly',
        priority: p === pages[0] ? '0.9' : '0.7',
      });
    }
  }
  return urls;
}

function renderSitemap(urls: UrlEntry[]): string {
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export default function sitemapPlugin(opts: SitemapOptions): Plugin {
  const base = opts.siteUrl.replace(/\/$/, '');
  return {
    name: 'sitemap',
    apply: 'build',
    generateBundle() {
      const urls = collectUrls(opts.storiesDir, base);
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: renderSitemap(urls),
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`,
      });
    },
  };
}
