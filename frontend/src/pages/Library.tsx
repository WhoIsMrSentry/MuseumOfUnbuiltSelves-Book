import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookMarked, Layers, ChevronRight } from 'lucide-react';
import { getAllBooks, enrichBookMeta } from '@/utils/markdown';
import { getProgress } from '@/store/progress';
import type { Book } from '@/utils/markdown';

// MARK: - Library Page (Landing)
export default function Library() {
  // getAllBooks() is synchronous — zero fetches, instant render
  const [books, setBooks] = useState<Book[]>(() => getAllBooks());

  // Enrich each book with first-page metadata (description/date) lazily
  useEffect(() => {
    Promise.all(books.map((b) => enrichBookMeta(b))).then(setBooks);
  }, []);

  return (
    <div className="min-h-screen px-6 py-12 sm:px-8 sm:py-16 max-w-5xl mx-auto w-full bg-[var(--bg-color)] text-[var(--text-color)]">
      {/* MARK: - Header */}
      <header className="mb-12 sm:mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-color)]"
        >
          Library
        </motion.h1>
        <p className="mt-2 text-sm text-[var(--muted-color)]">My published stories.</p>
      </header>

      {/* MARK: - Book Grid */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {books.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[var(--muted-color)] rounded-2xl border border-dashed border-white/8 bg-white/3 flex flex-col items-center gap-3">
            <BookMarked size={40} className="opacity-40" />
            <p className="text-sm">No books yet.</p>
          </div>
        ) : (
          books.map((book, idx) => <BookCard key={book.bookSlug} book={book} index={idx} />)
        )}
      </main>

      {/* MARK: - Footer */}
      <footer className="mt-20 text-center text-xs text-[var(--muted-color)] opacity-50">
        MyStory &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// MARK: - Book Card
function BookCard({ book, index }: { book: Book; index: number }) {
  const savedSlug = getProgress(book.bookSlug);
  const targetSlug = savedSlug || book.pages[0]?.pageSlug || '';
  const hasProgress = !!savedSlug;

  const savedIndex = hasProgress ? book.pages.findIndex((p) => p.pageSlug === savedSlug) : -1;
  const pct = hasProgress && savedIndex !== -1
    ? Math.round(((savedIndex + 1) / book.pages.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        to={`/reader/${book.bookSlug}/${targetSlug}`}
        className="group flex flex-col justify-between h-full min-h-[220px] rounded-2xl border border-white/8 bg-white/3 p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/5 hover:border-white/16"
      >
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-color)] leading-snug mb-3">{book.title}</h2>
          <p className="text-sm text-[var(--muted-color)] leading-relaxed line-clamp-3">{book.description}</p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-xs text-[var(--muted-color)]">
              <Layers size={12} />
              {hasProgress && savedIndex !== -1
                ? `${savedIndex + 1} / ${book.pages.length}`
                : `${book.pages.length} pages`}
            </span>
            {hasProgress && savedIndex !== -1 && (
              <div className="h-1 w-20 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent-color)] transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-color)] transition-transform group-hover:translate-x-0.5">
            {hasProgress && savedIndex !== -1 ? 'Continue' : 'Read'} <ChevronRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
