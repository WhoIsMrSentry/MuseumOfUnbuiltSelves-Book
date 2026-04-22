import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProgress, useProgressStore } from '@/store/progress';
import { getBookBySlug, getPageContent, type Book, type Page, type PageEntry } from '@/utils/markdown';

// MARK: - useReader: encapsulates book/page resolution + nav
export function useReader(bookSlug: string | undefined, pageSlug: string | undefined) {
  const navigate = useNavigate();
  const setProgress = useProgressStore((s) => s.set);
  const clearProgress = useProgressStore((s) => s.clear);

  const book = useMemo<Book | null>(
    () => (bookSlug ? getBookBySlug(bookSlug) : null),
    [bookSlug],
  );

  const pageIndex = useMemo(() => {
    if (!book) return -1;
    const target = pageSlug || getProgress(book.bookSlug) || '';
    const i = book.pages.findIndex((p) => p.pageSlug === target);
    return i >= 0 ? i : 0;
  }, [book, pageSlug]);

  const total = book?.pages.length ?? 0;
  const entry: PageEntry | null = book && pageIndex >= 0 ? book.pages[pageIndex] : null;
  const hasPrev = pageIndex > 0;
  const hasNext = pageIndex >= 0 && pageIndex < total - 1;

  // MARK: - Redirect + URL sync
  useEffect(() => {
    if (!bookSlug) return;
    if (!book) { navigate('/', { replace: true }); return; }
    if (entry && pageSlug !== entry.pageSlug) {
      navigate(`/reader/${book.bookSlug}/${entry.pageSlug}`, { replace: true });
    }
  }, [bookSlug, book, entry, pageSlug, navigate]);

  // MARK: - Load page content
  const [page, setPage] = useState<Page | null>(null);
  useEffect(() => {
    if (!book || !entry) return;
    setPage(null);
    let alive = true;
    getPageContent(book.bookSlug, entry.pageSlug).then((p) => alive && setPage(p));
    return () => { alive = false; };
  }, [book, entry]);

  // MARK: - Side-effects on page change
  useEffect(() => {
    if (book && entry) setProgress(book.bookSlug, entry.pageSlug);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [book, entry, setProgress]);

  // MARK: - Navigation helpers
  const goTo = useCallback((i: number) => {
    if (!book || i < 0 || i >= book.pages.length) return;
    navigate(`/reader/${book.bookSlug}/${book.pages[i].pageSlug}`);
  }, [book, navigate]);

  const goPrev = useCallback(() => goTo(pageIndex - 1), [goTo, pageIndex]);
  const goNext = useCallback(() => goTo(pageIndex + 1), [goTo, pageIndex]);
  const finish = useCallback(() => { if (book) clearProgress(book.bookSlug); }, [book, clearProgress]);

  return { book, entry, page, pageIndex, total, hasPrev, hasNext, goPrev, goNext, finish };
}
