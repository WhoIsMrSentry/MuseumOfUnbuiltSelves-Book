// MARK: - Markdown Utility

export interface PageMetadata {
  title: string;
  description?: string;
  date?: string;
  cover?: string;
}

export interface Page {
  pageSlug: string;
  bookSlug: string;
  metadata: PageMetadata;
  content: string;
}

export interface Book {
  bookSlug: string;
  title: string;
  description: string;
  date: string;
  cover: string;
  pages: Page[];
}

/**
 * Extracts frontmatter safely from a raw markdown string.
 */
export function parseFrontmatter(rawContent: string, bookSlug: string, pageSlug: string): Page {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = rawContent.match(frontmatterRegex);

  const metadata: Partial<PageMetadata> = {};
  let content = rawContent;

  if (match) {
    const rawYaml = match[1];
    content = match[2];

    const lines = rawYaml.split('\n');
    for (const line of lines) {
      const splitIdx = line.indexOf(':');
      if (splitIdx !== -1) {
        const key = line.slice(0, splitIdx).trim();
        let value = line.slice(splitIdx + 1).trim();

        // Strip quotes if any
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        metadata[key as keyof PageMetadata] = value;
      }
    }
  }

  return {
    bookSlug,
    pageSlug,
    metadata: {
      title: metadata.title || pageSlug,
      description: metadata.description || '',
      date: metadata.date || '',
      cover: metadata.cover || ''
    },
    content: content.trim()
  };
}

/**
 * Parses a book's title magically from its slug. (e.g. 'book-1' -> 'Book 1')
 */
function formatTitleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Loads all stories dynamically using Vite's glob import and constructs Books.
 */
export async function getAllBooks(): Promise<Book[]> {
  // Vite specific feature to load files as raw string content recursively
  const mdxFiles = import.meta.glob('../../../content/stories/**/*.{md,mdx}', { query: '?raw', import: 'default' });
  const booksMap: Record<string, Book> = {};

  for (const path in mdxFiles) {
    const defaultExport = await mdxFiles[path]();
    const rawContent: string = typeof defaultExport === 'string' ? defaultExport : (defaultExport as any).default || String(defaultExport);
    
    // We expect path formats like: ../../../content/stories/book1/01-intro.mdx
    const parts = path.replace('../../../content/stories/', '').split('/');
    if (parts.length < 2) continue; // Skip files that are not grouped into a book folder.

    const bookSlug = parts[0];
    const fileName = parts.pop() || '';
    const match = fileName.match(/(.+?)\.(md|mdx)$/);
    const pageSlug = match ? match[1] : fileName;

    const page = parseFrontmatter(rawContent, bookSlug, pageSlug);

    if (!booksMap[bookSlug]) {
      booksMap[bookSlug] = {
        bookSlug,
        title: formatTitleFromSlug(bookSlug),
        description: '', // Can be extracted from first page or a _meta file
        date: '',
        cover: '',
        pages: []
      };
    }

    booksMap[bookSlug].pages.push(page);
  }

  // Finalize books structure array
  return Object.values(booksMap).map(book => {
    // Sort pages naturally assuming prefix like "01-", "02-"
    book.pages.sort((a, b) => a.pageSlug.localeCompare(b.pageSlug));
    
    // Derive book meta from first page if available
    if (book.pages.length > 0) {
      const firstPage = book.pages[0];
      book.description = firstPage.metadata.description || `A collection of ${book.pages.length} chapters.`;
      book.date = firstPage.metadata.date || '';
      book.cover = firstPage.metadata.cover || '';
    }
    
    return book;
  }).sort((a, b) => b.date.localeCompare(a.date)); // Sort books by date descending
}

/**
 * Get a specific book by its slug
 */
export async function getBookBySlug(bookSlug: string): Promise<Book | null> {
  const books = await getAllBooks();
  return books.find(b => b.bookSlug === bookSlug) || null;
}
