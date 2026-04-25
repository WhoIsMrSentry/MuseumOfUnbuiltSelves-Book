import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useReader } from '@/pages/useReader';
import CenteredSpinner from '@/pages/reader/CenteredSpinner';
import ProgressBar from '@/pages/reader/ProgressBar';
import TopBar from '@/pages/reader/TopBar';
import BottomBar from '@/pages/reader/BottomBar';
import ChapterContent from '@/pages/reader/ChapterContent';
import Pagination from '@/pages/reader/Pagination';
import SettingsSheet from '@/pages/reader/SettingsSheet';
import NewChapterButton from '@/pages/reader/NewChapterButton';
import QuotesSheet from '@/pages/reader/QuotesSheet';
import { useMountTransition } from '@/pages/reader/useMountTransition';
import { useEditingStore } from '@/store/editing';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getBookQuotes, type QuoteEntry } from '@/utils/markdown';

const TOOLBAR_HIDE_MS = 3500;

export default function Reader() {
  const { bookSlug, pageSlug } = useParams<{ bookSlug: string; pageSlug: string }>();
  const r = useReader(bookSlug, pageSlug);
  const editing = useEditingStore((s) => s.editing);

  const bookName = r.book?.title ?? bookSlug ?? '';
  const chapterTitle = r.page?.metadata.title ?? r.entry?.metadata.title ?? '';
  const chapterDesc = r.page?.metadata.description
    || (r.page ? r.page.content.replace(/\s+/g, ' ').slice(0, 160) : '')
    || `${bookName} anlatısının bir bölümü.`;

  useDocumentMeta({
    title: chapterTitle ? `${chapterTitle} - ${bookName} | İnşa Edilmemiş Benlikler Müzesi` : `${bookName} | İnşa Edilmemiş Benlikler Müzesi`,
    description: chapterDesc,
    path: `/reader/${bookSlug}/${pageSlug}`,
    image: r.page?.metadata.cover,
    type: 'article',
    keywords: [bookSlug ?? '', 'inşa edilmemiş benlikler müzesi', 'roman', 'hikaye', 'alıntı', 'bilim kurgu', 'metaforik'],
  });

  const [toolbar, setToolbar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);

  // MARK: - Auto-hide the toolbar; reset timer whenever it becomes visible.
  useEffect(() => {
    if (!toolbar || editing) return;
    const t = window.setTimeout(() => setToolbar(false), TOOLBAR_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [toolbar, pageSlug, editing]);

  // MARK: - Suppress toolbar entirely while editing.
  const toolbarT = useMountTransition(toolbar && !editing, 200);
  const settingsT = useMountTransition(showSettings, 200);
  const quotesT = useMountTransition(showQuotes, 200);

  useEffect(() => {
    if (!showQuotes || !r.book) return;
    let alive = true;
    getBookQuotes(r.book.bookSlug).then((items) => {
      if (alive) setQuotes(items);
    });
    return () => { alive = false; };
  }, [showQuotes, r.book]);

  // MARK: - Keyboard nav (ignores typing into form fields).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('button, a, input, textarea, select')) return;
      if (e.key === 'ArrowLeft') r.goPrev();
      else if (e.key === 'ArrowRight') r.goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [r.goPrev, r.goNext]);

  // MARK: - Tap middle band to toggle the toolbar.
  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (editing) return;
    if ((e.target as HTMLElement).closest('a, button, input, textarea')) return;
    const ry = e.clientY / window.innerHeight;
    if (ry > 0.25 && ry < 0.75) setToolbar((v) => !v);
  }

  if (!r.book) return <CenteredSpinner />;
  if (!r.entry) return null;

  return (
    <div className="relative min-h-svh bg-[var(--bg)] text-[var(--text)]" onClick={handleTap}>
      <ProgressBar current={r.pageIndex + 1} total={r.total} />

      <Link
        to="/"
        aria-label="Kütüphaneye dön"
        className="fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg)]/80 backdrop-blur-sm transition-colors hover:bg-white/10 active:scale-95 sm:left-4 sm:top-4"
      >
        <ArrowLeft size={18} />
      </Link>

      {toolbarT.mounted && (
        <TopBar
          title={r.entry.metadata.title}
          subtitle={`${r.book.title} · ${r.pageIndex + 1}/${r.total}`}
          entered={toolbarT.entered}
          onQuotes={() => { setShowQuotes(true); setToolbar(true); }}
        />
      )}

      <article className="mx-auto max-w-3xl px-4 pb-28 pt-14 sm:px-6 md:px-8">
        {r.page ? (
          <>
            <ChapterContent page={r.page} number={r.pageIndex + 1} />
            <Pagination
              bookSlug={r.book.bookSlug}
              prev={r.hasPrev ? r.book.pages[r.pageIndex - 1] : null}
              next={r.hasNext ? r.book.pages[r.pageIndex + 1] : null}
              onFinish={r.finish}
            />
            {import.meta.env.DEV && !r.hasNext && (
              <NewChapterButton book={r.book} currentPageSlug={r.entry.pageSlug} />
            )}
          </>
        ) : (
          <CenteredSpinner padded />
        )}
      </article>

      {toolbarT.mounted && (
        <BottomBar
          current={r.pageIndex + 1}
          total={r.total}
          hasPrev={r.hasPrev}
          hasNext={r.hasNext}
          onPrev={r.goPrev}
          onNext={r.goNext}
          onSettings={() => { setShowSettings(true); setToolbar(true); }}
          entered={toolbarT.entered}
        />
      )}

      {settingsT.mounted && (
        <SettingsSheet onClose={() => setShowSettings(false)} entered={settingsT.entered} />
      )}

      {r.book && quotesT.mounted && (
        <QuotesSheet
          entered={quotesT.entered}
          onClose={() => setShowQuotes(false)}
          bookSlug={r.book.bookSlug}
          quotes={quotes}
        />
      )}
    </div>
  );
}

