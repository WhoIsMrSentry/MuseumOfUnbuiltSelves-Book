import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, ChevronRight } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import { enrichBookMeta, getAllBooks, type Book } from '@/utils/markdown';
import { useProgressStore } from '@/store/progress';

// MARK: - Library
export default function Library() {
  const [books, setBooks] = useState<Book[]>(() => getAllBooks());
  const progressMap = useProgressStore((s) => s.map);

  useEffect(() => {
    Promise.all(books.map(enrichBookMeta)).then(setBooks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-svh bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        <Header />
        {books.length === 0
          ? <Empty />
          : (
            <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {books.map((b, i) => (
                <BookCard key={b.bookSlug} book={b} index={i} savedSlug={progressMap[b.bookSlug]} />
              ))}
            </main>
          )}
        <footer className="mt-20 text-center text-xs text-[var(--muted)] opacity-60">
          MyStory &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

// MARK: - Header
function Header() {
  return (
    <header className="mb-10 sm:mb-14">
      <h1 className="animate-[fade-in-down_0.4s_ease-out_both] text-3xl font-bold tracking-tight sm:text-4xl">
        Library
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">My published stories.</p>
    </header>
  );
}

// MARK: - Empty State
function Empty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-[var(--muted)]">
      <BookMarked size={36} className="opacity-40" />
      <p className="text-sm">No books yet.</p>
    </div>
  );
}

// MARK: - Book Card
function BookCard({ book, index, savedSlug }: { book: Book; index: number; savedSlug?: string }) {
  const target = savedSlug || book.pages[0]?.pageSlug || '';
  const savedIdx = savedSlug ? book.pages.findIndex((p) => p.pageSlug === savedSlug) : -1;
  const hasProgress = savedIdx >= 0;
  const pct = hasProgress ? Math.round(((savedIdx + 1) / book.pages.length) * 100) : 0;

  return (
    <div
      className="animate-[fade-in-up_0.4s_ease-out_both]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link
        to={`/reader/${book.bookSlug}/${target}`}
        className="surface group flex h-full flex-col overflow-hidden no-underline transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-2xl"
      >
        {book.cover && (
          <div className="relative aspect-[16/10] overflow-hidden border-b border-white/5">
            <OptimizedImage
              src={book.cover}
              alt={book.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-[var(--accent)] sm:text-xl">
            {book.title}
          </h2>
          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
            {book.description}
          </p>

          <div className="mt-2 flex items-end justify-between border-t border-white/5 pt-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-[var(--muted)]">
                {hasProgress ? `${savedIdx + 1} / ${book.pages.length}` : `${book.pages.length} chapters`}
              </span>
              {hasProgress && (
                <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-transform group-hover:translate-x-0.5">
              {hasProgress ? 'Continue' : 'Read'} <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
