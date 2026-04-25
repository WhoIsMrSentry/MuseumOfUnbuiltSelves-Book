// MARK: - Markdown Utility
// @ts-ignore — virtual module from plugins/mdx-mtime.ts
import mtimeMap from 'virtual:mdx-mtime';

// MARK: - Types
export interface PageMetadata {
  title: string;
  description?: string;
  cover?: string;
  lastModified?: string;
}
export interface PageEntry {
  pageSlug: string;
  bookSlug: string;
  metadata: PageMetadata;
}
export interface Page extends PageEntry {
  content: string;
  raw: string;
}
export interface QuoteEntry {
  id: string;
  bookSlug: string;
  pageSlug: string;
  chapterTitle: string;
  text: string;
}
export interface Book {
  bookSlug: string;
  title: string;
  description: string;
  lastModified: string;
  cover: string;
  pages: PageEntry[];
}

// MARK: - Helpers
const STORIES_PREFIX = '../../../content/stories/';
const FRONTMATTER_FULL = /^---\s*\n([\s\S]*?)\n---\s*(?:\n([\s\S]*))?$/;
const FM_LINE = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/gm;
const MTIME = mtimeMap as Record<string, string>;

const formatTitle = (slug: string): string =>
  slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const stripQuotes = (s: string): string => {
  const c = s[0];
  return (c === '"' || c === "'") && s.endsWith(c) ? s.slice(1, -1) : s;
};

// MARK: - Parse frontmatter via a single regex pass; return body too.
function parseRaw(raw: string): { meta: Partial<PageMetadata>; body: string } {
  const m = raw.match(FRONTMATTER_FULL);
  if (!m) return { meta: {}, body: raw };
  const meta: Partial<PageMetadata> = {};
  let line: RegExpExecArray | null;
  FM_LINE.lastIndex = 0;
  while ((line = FM_LINE.exec(m[1]))) {
    meta[line[1] as keyof PageMetadata] = stripQuotes(line[2].trim());
  }
  return { meta, body: m[2] ?? '' };
}

// MARK: - Globs (MDX only)
const mdxFiles = import.meta.glob('../../../content/stories/**/*.mdx', { query: '?raw', import: 'default' });
const assetFiles = import.meta.glob('../../../content/stories/**/assets/*.{png,jpg,jpeg,gif,webp,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

// MARK: - Single-pass index build: O(N) loaders + grouped by book + sorted.
type RawLoader = () => Promise<unknown>;
type LoaderEntry = { bookSlug: string; pageSlug: string; load: RawLoader };

let _loaderMap: Map<string, LoaderEntry> | null = null;
let _indexCache: Book[] | null = null;
let _quotesCache: Map<string, QuoteEntry[]> | null = null;

function buildAll(): { loaders: Map<string, LoaderEntry>; books: Book[] } {
  if (_loaderMap && _indexCache) return { loaders: _loaderMap, books: _indexCache };

  const loaders = new Map<string, LoaderEntry>();
  const byBook = new Map<string, Book>();

  for (const path in mdxFiles) {
    const rel = path.slice(STORIES_PREFIX.length).split('/');
    if (rel.length < 2) continue;
    const bookSlug = rel[0];
    const fileName = rel[rel.length - 1];
    if (!fileName.endsWith('.mdx')) continue;
    const pageSlug = fileName.slice(0, -4);

    loaders.set(`${bookSlug}/${pageSlug}`, { bookSlug, pageSlug, load: mdxFiles[path] });

    let book = byBook.get(bookSlug);
    if (!book) {
      book = {
        bookSlug,
        title: formatTitle(bookSlug),
        description: '',
        lastModified: '',
        cover: '',
        pages: [],
      };
      byBook.set(bookSlug, book);
    }
    book.pages.push({
      pageSlug,
      bookSlug,
      metadata: { title: formatTitle(pageSlug), lastModified: MTIME[`${bookSlug}/${pageSlug}`] || '' },
    });
  }

  const books: Book[] = [];
  for (const book of byBook.values()) {
    book.pages.sort((a, b) => a.pageSlug.localeCompare(b.pageSlug, undefined, { numeric: true }));
    book.description = `${book.pages.length} chapters`;
    books.push(book);
  }

  _loaderMap = loaders;
  _indexCache = books;
  return { loaders, books };
}

const fetchRaw = async (bookSlug: string, pageSlug: string): Promise<string | null> => {
  const entry = buildAll().loaders.get(`${bookSlug}/${pageSlug}`);
  if (!entry) return null;
  const raw = await entry.load();
  return typeof raw === 'string' ? raw : String(raw);
};

// MARK: - Asset URL resolver
export function resolveAsset(bookSlug: string, virtualPath: string): string {
  if (!virtualPath || virtualPath.startsWith('http')) return virtualPath;
  const fileName = virtualPath.split('/').pop();
  if (!fileName) return virtualPath;
  return assetFiles[`${STORIES_PREFIX}${bookSlug}/assets/${fileName}`] || virtualPath;
}

// MARK: - Public API
export const getAllBooks = (): Book[] => buildAll().books;
export const getBookBySlug = (bookSlug: string): Book | null =>
  buildAll().books.find((b) => b.bookSlug === bookSlug) || null;

export async function enrichBookMeta(book: Book): Promise<Book> {
  if (book.pages.length === 0) return book;
  const first = book.pages[0];
  const raw = await fetchRaw(book.bookSlug, first.pageSlug);
  if (!raw) return book;

  const { meta } = parseRaw(raw);
  first.metadata = { ...first.metadata, ...meta, title: meta.title || first.metadata.title };
  book.description = meta.description || `${book.pages.length} chapters`;

  // MARK: - Single reduce for latest mtime
  let latest = '';
  for (const p of book.pages) {
    const m = p.metadata.lastModified || '';
    if (m > latest) latest = m;
  }
  book.lastModified = latest;
  book.cover = resolveAsset(book.bookSlug, meta.cover || '');
  return book;
}

export async function getPageContent(bookSlug: string, pageSlug: string): Promise<Page | null> {
  const raw = await fetchRaw(bookSlug, pageSlug);
  if (!raw) return null;
  const { meta, body } = parseRaw(raw);
  return {
    bookSlug,
    pageSlug,
    metadata: {
      title: meta.title || formatTitle(pageSlug),
      description: meta.description || '',
      cover: resolveAsset(bookSlug, meta.cover || ''),
      lastModified: MTIME[`${bookSlug}/${pageSlug}`] || '',
    },
    content: body.trim(),
    raw,
  };
}

function extractQuotesFromBody(body: string): string[] {
  const lines = body.split('\n');
  const quotes: string[] = [];
  let bucket: string[] = [];

  const flush = () => {
    if (!bucket.length) return;
    const text = bucket.join(' ').replace(/\s+/g, ' ').trim();
    if (text) quotes.push(text);
    bucket = [];
  };

  for (const line of lines) {
    const m = line.match(/^>\s?(.*)$/);
    if (m) bucket.push(m[1]);
    else flush();
  }
  flush();
  return quotes;
}

export async function getBookQuotes(bookSlug: string): Promise<QuoteEntry[]> {
  if (_quotesCache?.has(bookSlug)) return _quotesCache.get(bookSlug) || [];

  const book = getBookBySlug(bookSlug);
  if (!book) return [];

  const out: QuoteEntry[] = [];
  for (const page of book.pages) {
    const raw = await fetchRaw(bookSlug, page.pageSlug);
    if (!raw) continue;
    const { meta, body } = parseRaw(raw);
    const chapterTitle = meta.title || formatTitle(page.pageSlug);
    const quotes = extractQuotesFromBody(body);

    for (let i = 0; i < quotes.length; i += 1) {
      out.push({
        id: `${bookSlug}/${page.pageSlug}/${i + 1}`,
        bookSlug,
        pageSlug: page.pageSlug,
        chapterTitle,
        text: quotes[i],
      });
    }
  }

  if (!_quotesCache) _quotesCache = new Map<string, QuoteEntry[]>();
  _quotesCache.set(bookSlug, out);
  return out;
}

// MARK: - Dev-only: save raw MDX back to disk via Vite middleware
export async function savePageRaw(bookSlug: string, pageSlug: string, content: string): Promise<void> {
  if (!import.meta.env.DEV) throw new Error('Editing is only allowed in dev');
  const res = await fetch('/__save-mdx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookSlug, pageSlug, content }),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status} ${await res.text()}`);
}

// MARK: - Dev-only: compute the next chapter slug.
// Finds the LAST number in the slug, increments it, preserves padding.
//   "chapter18"  -> "chapter19"
//   "01-foo"     -> "02-foo"
//   "intro"      -> "intro-2"
export function nextChapterSlug(book: Book, currentPageSlug: string): string {
  const m = currentPageSlug.match(/^(.*?)(\d+)(\D*)$/);
  if (m) {
    const [, head, num, tail] = m;
    return `${head}${(parseInt(num, 10) + 1).toString().padStart(num.length, '0')}${tail}`;
  }
  if (currentPageSlug) return `${currentPageSlug}-2`;
  return `${(book.pages.length + 1).toString().padStart(2, '0')}-new-chapter`;
}

// MARK: - Dev-only: create a new chapter file with a starter template.
export async function createNextChapter(book: Book, currentPageSlug: string): Promise<string> {
  const slug = nextChapterSlug(book, currentPageSlug);
  const numMatch = slug.match(/(\d+)/);
  const coverLine = numMatch ? `cover: "/assets/chapter-${numMatch[1]}.png"\n` : '';
  const template = `---\ntitle: "New Chapter"\ndescription: ""\n${coverLine}---\n\nWrite here...\n`;
  await savePageRaw(book.bookSlug, slug, template);
  // MARK: - Reset the cached index so the new page surfaces on next read.
  _loaderMap = null;
  _indexCache = null;
  _quotesCache = null;
  return slug;
}
