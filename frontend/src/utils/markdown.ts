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
const FRONTMATTER = /^---\s*\n([\s\S]*?)\n---/;
const CONTENT_AFTER_FM = /^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/;

const getMtime = (bookSlug: string, pageSlug: string): string =>
  (mtimeMap as Record<string, string>)[`${bookSlug}/${pageSlug}`] || '';

const formatTitle = (slug: string): string =>
  slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function parseFrontmatter(raw: string): Partial<PageMetadata> {
  const match = raw.match(FRONTMATTER);
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

// MARK: - Globs (MDX only)
const mdxFiles = import.meta.glob('../../../content/stories/**/*.mdx', { query: '?raw', import: 'default' });
const assetFiles = import.meta.glob('../../../content/stories/**/assets/*.{png,jpg,jpeg,gif,webp,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

// MARK: - O(1) loader map: "bookSlug/pageSlug" -> raw loader
type RawLoader = () => Promise<unknown>;
const loaderMap: Map<string, { bookSlug: string; pageSlug: string; load: RawLoader }> = (() => {
  const m = new Map<string, { bookSlug: string; pageSlug: string; load: RawLoader }>();
  for (const path in mdxFiles) {
    const rel = path.replace(STORIES_PREFIX, '').split('/');
    if (rel.length < 2) continue;
    const bookSlug = rel[0];
    const fileName = rel[rel.length - 1];
    const match = fileName.match(/(.+?)\.mdx$/);
    if (!match) continue;
    const pageSlug = match[1];
    m.set(`${bookSlug}/${pageSlug}`, { bookSlug, pageSlug, load: mdxFiles[path] });
  }
  return m;
})();

const fetchRaw = async (bookSlug: string, pageSlug: string): Promise<string | null> => {
  const entry = loaderMap.get(`${bookSlug}/${pageSlug}`);
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

// MARK: - Index cache
let _indexCache: Book[] | null = null;

function buildIndex(): Book[] {
  if (_indexCache) return _indexCache;
  const books: Record<string, Book> = {};

  for (const { bookSlug, pageSlug } of loaderMap.values()) {
    if (!books[bookSlug]) {
      books[bookSlug] = {
        bookSlug,
        title: formatTitle(bookSlug),
        description: '',
        lastModified: '',
        cover: '',
        pages: [],
      };
    }
    books[bookSlug].pages.push({
      pageSlug,
      bookSlug,
      metadata: { title: formatTitle(pageSlug), lastModified: getMtime(bookSlug, pageSlug) },
    });
  }

  _indexCache = Object.values(books).map((book) => {
    book.pages.sort((a, b) => a.pageSlug.localeCompare(b.pageSlug, undefined, { numeric: true }));
    book.description = `${book.pages.length} chapters`;
    return book;
  });
  return _indexCache;
}

// MARK: - Public API
export const getAllBooks = (): Book[] => buildIndex();
export const getBookBySlug = (bookSlug: string): Book | null =>
  buildIndex().find((b) => b.bookSlug === bookSlug) || null;

export async function enrichBookMeta(book: Book): Promise<Book> {
  if (book.pages.length === 0) return book;
  const first = book.pages[0];
  const raw = await fetchRaw(book.bookSlug, first.pageSlug);
  if (!raw) return book;

  const meta = parseFrontmatter(raw);
  first.metadata = { ...first.metadata, ...meta, title: meta.title || first.metadata.title };
  book.description = meta.description || `${book.pages.length} chapters`;
  book.lastModified = book.pages.reduce((latest, p) => {
    const m = p.metadata.lastModified || '';
    return m > latest ? m : latest;
  }, '');
  book.cover = resolveAsset(book.bookSlug, meta.cover || '');
  return book;
}

export async function getPageContent(bookSlug: string, pageSlug: string): Promise<Page | null> {
  const raw = await fetchRaw(bookSlug, pageSlug);
  if (!raw) return null;
  const meta = parseFrontmatter(raw);
  const body = raw.match(CONTENT_AFTER_FM);
  return {
    bookSlug,
    pageSlug,
    metadata: {
      title: meta.title || formatTitle(pageSlug),
      description: meta.description || '',
      cover: resolveAsset(bookSlug, meta.cover || ''),
      lastModified: getMtime(bookSlug, pageSlug),
    },
    content: (body ? body[1] : raw).trim(),
    raw,
  };
}

// MARK: - Dev-only: save raw MDX back to disk via Vite middleware
export async function savePageRaw(bookSlug: string, pageSlug: string, content: string): Promise<void> {
  if (!import.meta.env.DEV) throw new Error('Editing is only allowed in dev');
  const res = await fetch(`/__save-mdx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookSlug, pageSlug, content }),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status} ${await res.text()}`);
}

// MARK: - Dev-only: compute the next chapter slug based on the current one.
// Finds the LAST number in the slug, increments it, preserves padding and the
// surrounding text. Examples:
//   "chapter18"  -> "chapter19"
//   "01-foo"     -> "02-foo"
//   "foo-03-bar" -> "foo-04-bar"
//   "intro"      -> "intro-2"
export function nextChapterSlug(book: Book, currentPageSlug: string): string {
  const m = currentPageSlug.match(/^(.*?)(\d+)(\D*)$/);
  if (m) {
    const [, head, num, tail] = m;
    const next = (parseInt(num, 10) + 1).toString().padStart(num.length, '0');
    return `${head}${next}${tail}`;
  }
  if (currentPageSlug) return `${currentPageSlug}-2`;
  const n = (book.pages.length + 1).toString().padStart(2, '0');
  return `${n}-new-chapter`;
}

// MARK: - Dev-only: create a new chapter file with a starter template.
// The template includes a cover field pointing at /assets/chapter-NN.png
// using the chapter number found in the new slug. The user can drop the
// image in later — the template is unaffected if the file is missing.
export async function createNextChapter(book: Book, currentPageSlug: string): Promise<string> {
  const slug = nextChapterSlug(book, currentPageSlug);
  const numMatch = slug.match(/(\d+)/);
  const coverLine = numMatch ? `cover: "/assets/chapter-${numMatch[1]}.png"\n` : '';
  const template =
    `---\ntitle: "New Chapter"\ndescription: ""\n${coverLine}---\n\nWrite here...\n`;
  await savePageRaw(book.bookSlug, slug, template);
  // Invalidate the in-memory index so subsequent reads pick up the new page.
  _indexCache = null;
  return slug;
}
