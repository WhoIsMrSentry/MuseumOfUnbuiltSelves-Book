import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
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

const TOOLBAR_HIDE_MS = 3500;

export default function Reader() {
  const { bookSlug, pageSlug } = useParams<{ bookSlug: string; pageSlug: string }>();
  const r = useReader(bookSlug, pageSlug);

  // MARK: - Toolbar auto-hide
  const [toolbar, setToolbar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToolbar(false), TOOLBAR_HIDE_MS);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [pageSlug, resetTimer]);

  const toggleToolbar = useCallback(() => {
    setToolbar((v) => { if (!v) resetTimer(); return !v; });
  }, [resetTimer]);

  // MARK: - Keyboard nav
  const { goPrev, goNext } = r;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('button, a, input, textarea, select')) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a, button, input')) return;
    const ry = e.clientY / window.innerHeight;
    if (ry > 0.25 && ry < 0.75) toggleToolbar();
  }, [toggleToolbar]);

  if (!r.book) return <CenteredSpinner />;
  if (!r.entry) return null;

  return (
    <div className="relative min-h-svh bg-[var(--bg)] text-[var(--text)]" onClick={handleTap}>
      <ProgressBar current={r.pageIndex + 1} total={r.total} />

      <Link
        to="/"
        aria-label="Back to Library"
        className="fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg)]/80 backdrop-blur-sm transition-colors hover:bg-white/10 active:scale-95 sm:left-4 sm:top-4"
      >
        <ArrowLeft size={18} />
      </Link>

      <AnimatePresence>
        {toolbar && (
          <TopBar
            title={r.entry.metadata.title}
            subtitle={`${r.book.title} · ${r.pageIndex + 1}/${r.total}`}
          />
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {toolbar && (
          <BottomBar
            current={r.pageIndex + 1}
            total={r.total}
            hasPrev={r.hasPrev}
            hasNext={r.hasNext}
            onPrev={r.goPrev}
            onNext={r.goNext}
            onSettings={() => { setShowSettings(true); setToolbar(true); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsSheet onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
