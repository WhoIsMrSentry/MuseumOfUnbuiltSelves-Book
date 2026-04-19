// MARK: - Markdown Utility

// @ts-ignore — virtual module from plugins/mdx-mtime.ts
import mtimeMap from 'virtual:mdx-mtime';

export interface PageMetadata {
  title: string;
  description?: string;
  cover?: string;
  lastModified?: string; // MARK: auto-derived from file mtime
}

/** Lightweight page stub — derived from file path alone, zero fetches */
export interface PageEntry {
  pageSlug: string;
  bookSlug: string;
  metadata: PageMetadata;
}

/** Full page with content — only loaded on demand */
export interface Page extends PageEntry {
  content: string;
}

export interface Book {
  bookSlug: string;
  title: string;
  description: string;
  lastModified: string;
  cover: string;
  pages: PageEntry[];
}

// MARK: - Frontmatter Parser

function parseFrontmatter(raw: string): Partial<PageMetadata> {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta: Partial<PageMetadata> = {};
  for (const line of match[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key as keyof PageMetadata] = val;
  }
  return meta;
}

function formatTitle(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// MARK: - File mtime lookup
function getMtime(bookSlug: string, pageSlug: string): string {
  return (mtimeMap as Record<string, string>)[`${bookSlug}/${pageSlug}`] || '';
}

// MARK: - Glob handle (lazy loaders, paths available immediately)
const mdxFiles = import.meta.glob('../../../content/stories/**/*.{md,mdx}', { query: '?raw', import: 'default' });

// MARK: - Asset Glob handle (eager load for direct URL access)
const assetFiles = import.meta.glob('../../../content/stories/**/assets/*.{png,jpg,jpeg,gif,webp,svg}', { 
  eager: true, 
  import: 'default' 
}) as Record<string, string>;

/** 
 * Resolves a virtual path (e.g. /assets/foo.png) to a real Vite asset URL 
 * based on the book context.
 */
export function resolveAsset(bookSlug: string, virtualPath: string): string {
  if (!virtualPath) return '';
  if (virtualPath.startsWith('http')) return virtualPath;

  const fileName = virtualPath.split('/').pop();
  if (!fileName) return virtualPath;

  const targetPath = `../../../content/stories/${bookSlug}/assets/${fileName}`;
  return assetFiles[targetPath] || virtualPath;
}

/** Parse a glob path into bookSlug + pageSlug (no fetch needed) */
function parsePath(path: string): { bookSlug: string; pageSlug: string } | null {
  const parts = path.replace('../../../content/stories/', '').split('/');
  if (parts.length < 2) return null;
  const bookSlug = parts[0];
  const fileName = parts.pop() || '';
  const m = fileName.match(/(.+?)\.(md|mdx)$/);
  return { bookSlug, pageSlug: m ? m[1] : fileName };
}

/** Fetch a single file's raw content */
async function fetchRaw(bookSlug: string, pageSlug: string): Promise<string | null> {
  for (const path in mdxFiles) {
    const p = parsePath(path);
    if (!p || p.bookSlug !== bookSlug || p.pageSlug !== pageSlug) continue;
    const raw = await mdxFiles[path]();
    return typeof raw === 'string' ? raw : String(raw);
  }
  return null;
}

// MARK: - Book index cache (built from paths, zero fetches)
let _indexCache: Book[] | null = null;

/**
 * Builds the book index from glob paths alone — no file content is fetched.
 * Page metadata is derived from slug (title = formatted slug).
 */
function buildIndex(): Book[] {
  if (_indexCache) return _indexCache;

  const booksMap: Record<string, Book> = {};

  for (const path in mdxFiles) {
    const parsed = parsePath(path);
    if (!parsed) continue;

    if (!booksMap[parsed.bookSlug]) {
      booksMap[parsed.bookSlug] = {
        bookSlug: parsed.bookSlug,
        title: formatTitle(parsed.bookSlug),
        description: '',
        lastModified: '',
        cover: '',
        pages: [],
      };
    }

    booksMap[parsed.bookSlug].pages.push({
      pageSlug: parsed.pageSlug,
      bookSlug: parsed.bookSlug,
      metadata: {
        title: formatTitle(parsed.pageSlug),
        lastModified: getMtime(parsed.bookSlug, parsed.pageSlug),
      },
    });
  }

  _indexCache = Object.values(booksMap).map((book) => {
    book.pages.sort((a, b) => a.pageSlug.localeCompare(b.pageSlug));
    book.description = `${book.pages.length} chapters`;
    return book;
  });

  return _indexCache;
}

// MARK: - Public API

/** Returns all books with page lists — zero network fetches */
export function getAllBooks(): Book[] {
  return buildIndex();
}

/** Returns a single book's metadata + page list — zero fetches */
export function getBookBySlug(bookSlug: string): Book | null {
  return buildIndex().find((b) => b.bookSlug === bookSlug) || null;
}

/**
 * Enriches a book with metadata from its first page (for Library cards).
 * Fetches only 1 file per book, only when called.
 */
export async function enrichBookMeta(book: Book): Promise<Book> {
  if (book.pages.length === 0) return book;

  const first = book.pages[0];
  const raw = await fetchRaw(book.bookSlug, first.pageSlug);
  if (!raw) return book;

  const meta = parseFrontmatter(raw);
  first.metadata = { ...first.metadata, ...meta, title: meta.title || first.metadata.title };
  book.description = meta.description || `${book.pages.length} chapters`;
  // MARK: - Book lastModified = most recent page mtime
  book.lastModified = book.pages.reduce((latest, p) => {
    const m = p.metadata.lastModified || '';
    return m > latest ? m : latest;
  }, '');
  book.cover = resolveAsset(book.bookSlug, meta.cover || '');
  return book;
}

/** Loads a single page's full content on demand — 1 fetch */
export async function getPageContent(bookSlug: string, pageSlug: string): Promise<Page | null> {
  const raw = await fetchRaw(bookSlug, pageSlug);
  if (!raw) return null;

  const meta = parseFrontmatter(raw);
  const contentMatch = raw.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/);

  return {
    bookSlug,
    pageSlug,
    metadata: {
      title: meta.title || formatTitle(pageSlug),
      description: meta.description || '',
      cover: resolveAsset(bookSlug, meta.cover || ''),
      lastModified: getMtime(bookSlug, pageSlug),
    },
    content: contentMatch ? contentMatch[1].trim() : raw.trim(),
  };
}
