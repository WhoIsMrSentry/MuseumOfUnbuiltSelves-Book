import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Settings2,
  X,
} from 'lucide-react';
import { useSettings } from '@/store/settings';
import { clearProgress, getProgress, setProgress } from '@/store/progress';
import { getBookBySlug } from '@/utils/markdown';
import type { Book, Page } from '@/utils/markdown';

// MARK: - Types & Constants
type SettingChoice<T extends string> = { label: string; value: T };

const THEME_OPTIONS: SettingChoice<'obsidian' | 'amoled'>[] = [
  { value: 'obsidian', label: 'Soft dark' },
  { value: 'amoled', label: 'Deep black' },
];

const FONT_OPTIONS: SettingChoice<'default' | 'serif' | 'comic'>[] = [
  { value: 'default', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'comic', label: 'Playful' },
];

const TOOLBAR_AUTO_HIDE_MS = 3500;

// MARK: - Reader Component
export default function Reader() {
  const { bookSlug, pageSlug } = useParams<{ bookSlug: string; pageSlug: string }>();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedPageSlug = useMemo(() => getProgress(bookSlug || ''), [bookSlug]);

  // MARK: - Load book
  useEffect(() => {
    async function loadBook() {
      if (!bookSlug) { navigate('/', { replace: true }); return; }
      setLoading(true);
      try {
        const data = await getBookBySlug(bookSlug);
        if (!data) { navigate('/', { replace: true }); return; }
        setBook(data);
      } catch {
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [bookSlug, navigate]);

  // MARK: - Resolve page index from URL / saved progress
  const pageIndex = useMemo(() => {
    if (!book) return -1;
    if (pageSlug) {
      const idx = book.pages.findIndex((p) => p.pageSlug === pageSlug);
      if (idx >= 0) return idx;
    }
    if (savedPageSlug) {
      const idx = book.pages.findIndex((p) => p.pageSlug === savedPageSlug);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [book, pageSlug, savedPageSlug]);

  const totalPages = book?.pages.length ?? 0;
  const activePage = book && pageIndex >= 0 ? book.pages[pageIndex] : null;
  const prevPage = book && pageIndex > 0 ? book.pages[pageIndex - 1] : null;
  const nextPage = book && pageIndex >= 0 && pageIndex < totalPages - 1 ? book.pages[pageIndex + 1] : null;

  const pagePath = useCallback((page: Page) => `/reader/${page.bookSlug}/${page.pageSlug}`, []);

  // MARK: - Route sync
  useEffect(() => {
    if (loading || !book || pageIndex < 0) return;
    const resolvedSlug = book.pages[pageIndex].pageSlug;
    if (pageSlug !== resolvedSlug) {
      navigate(pagePath(book.pages[pageIndex]), { replace: true });
    }
  }, [book, loading, pageIndex, pageSlug, navigate, pagePath]);

  // MARK: - Save progress
  useEffect(() => {
    if (!book || pageIndex < 0 || pageIndex >= book.pages.length) return;
    setProgress(book.bookSlug, book.pages[pageIndex].pageSlug);
  }, [pageIndex, book]);

  // MARK: - Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pageSlug]);

  // MARK: - Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('button, a, input, textarea, select')) return;
      if (e.key === 'ArrowLeft' && prevPage) navigate(pagePath(prevPage));
      if (e.key === 'ArrowRight' && nextPage) navigate(pagePath(nextPage));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, nextPage, prevPage, pagePath]);

  // MARK: - Toolbar auto-hide
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToolbarVisible(false), TOOLBAR_AUTO_HIDE_MS);
  }, []);

  const toggleToolbar = useCallback(() => {
    setToolbarVisible((v) => {
      const next = !v;
      if (next) resetHideTimer();
      return next;
    });
  }, [resetHideTimer]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [pageSlug, resetHideTimer]);

  // MARK: - Center-tap handler (viewport-based)
  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a, button, input')) return;
    const relY = e.clientY / window.innerHeight;
    if (relY > 0.25 && relY < 0.75) toggleToolbar();
  }, [toggleToolbar]);

  // MARK: - Navigation
  const goRelative = useCallback((delta: number) => {
    if (!book) return;
    const next = pageIndex + delta;
    if (next < 0 || next >= totalPages) return;
    navigate(pagePath(book.pages[next]));
  }, [book, pageIndex, totalPages, navigate, pagePath]);

  const handleSliderChange = useCallback((idx: number) => {
    if (!book) return;
    navigate(pagePath(book.pages[idx]));
  }, [book, navigate, pagePath]);

  // MARK: - Loading
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--bg-color)] text-[var(--muted-color)]">
        <LoaderCircle size={24} className="animate-spin" />
      </div>
    );
  }

  if (!book || !activePage) return null;

  // MARK: - Render
  return (
    <div className="relative min-h-svh bg-[var(--bg-color)] text-[var(--text-color)]" onClick={handleContentClick}>
      {/* Progress bar */}
      <ProgressBar current={pageIndex + 1} total={totalPages} />

      {/* Back button — always visible */}
      <Link
        to="/"
        className="fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-color)]/80 text-[var(--text-color)] backdrop-blur-sm transition-colors hover:bg-white/10 active:scale-95 sm:left-4 sm:top-4"
        aria-label="Back to Library"
      >
        <ArrowLeft size={18} />
      </Link>

      {/* Top toolbar */}
      <AnimatePresence>
        {toolbarVisible && (
          <motion.header
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 border-b border-white/8 bg-[var(--bg-color)]/90 px-4 py-3 pl-14 backdrop-blur-md sm:pl-16"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-color)]">
                {activePage.metadata.title}
              </p>
              <p className="truncate text-xs text-[var(--muted-color)]">
                {book.title} · {pageIndex + 1}/{totalPages}
              </p>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 pb-28 pt-14 sm:px-6 md:px-8">
        <ChapterBlock page={activePage} number={pageIndex + 1} />
        <PaginationNav
          bookSlug={book.bookSlug}
          prevPage={prevPage}
          nextPage={nextPage}
          onFinish={() => clearProgress(book.bookSlug)}
        />
      </div>

      {/* Bottom toolbar */}
      <AnimatePresence>
        {toolbarVisible && (
          <motion.nav
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[var(--bg-color)]/90 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md sm:px-4 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pt-3"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-1.5 sm:gap-2">
              <NavButton disabled={!prevPage} icon={<ChevronLeft size={18} />} onClick={() => goRelative(-1)} />

              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-2 sm:gap-3 sm:px-4">
                <span className="text-[11px] tabular-nums text-[var(--muted-color)] sm:text-xs">{pageIndex + 1}</span>
                <input
                  type="range"
                  min={0}
                  max={totalPages - 1}
                  value={pageIndex}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="reader-slider min-w-0 flex-1"
                />
                <span className="text-[11px] tabular-nums text-[var(--muted-color)] sm:text-xs">{totalPages}</span>
              </div>

              <NavButton disabled={!nextPage} icon={<ChevronRight size={18} />} onClick={() => goRelative(1)} />
              <NavButton icon={<Settings2 size={18} />} onClick={() => { setShowSettings(true); setToolbarVisible(true); }} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Settings sheet */}
      <AnimatePresence>
        {showSettings && (
          <SettingsSheet
            settings={settings}
            onClose={() => setShowSettings(false)}
            onUpdate={updateSettings}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// MARK: - Progress Bar
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.max((current / total) * 100, 1) : 0;
  return (
    <div className="fixed inset-x-0 top-0 z-[61] h-[2px] bg-white/6">
      <div className="h-full bg-[var(--accent-color)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

// MARK: - Chapter Block
function ChapterBlock({ page, number }: { page: Page; number: number }) {
  return (
    <article className="py-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted-color)]">
        Chapter {number}
      </p>
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-[var(--text-color)] sm:text-2xl md:text-3xl">
        {page.metadata.title}
      </h2>
      {page.metadata.description && (
        <p className="mb-8 text-sm leading-relaxed text-[var(--muted-color)]">{page.metadata.description}</p>
      )}
      <div className="prose prose-invert prose-obsidian max-w-none prose-sm sm:prose-base md:prose-lg prose-p:leading-7 sm:prose-p:leading-8 prose-p:my-3 sm:prose-p:my-4 prose-p:text-[var(--text-color)] prose-headings:tracking-tight prose-li:text-[var(--text-color)] prose-a:text-[var(--accent-color)] prose-a:underline prose-a:underline-offset-4 prose-strong:text-[var(--text-color)]">
        <ReactMarkdown>{page.content}</ReactMarkdown>
      </div>
    </article>
  );
}

// MARK: - Pagination Nav
function PaginationNav({ bookSlug, prevPage, nextPage, onFinish }: {
  bookSlug: string; prevPage: Page | null; nextPage: Page | null; onFinish: () => void;
}) {
  const path = (p: Page) => `/reader/${bookSlug}/${p.pageSlug}`;
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      {prevPage ? (
        <PageLink to={path(prevPage)} label="Previous" title={prevPage.metadata.title} align="left" />
      ) : (
        <div className="hidden sm:block" />
      )}
      {nextPage ? (
        <PageLink to={path(nextPage)} label="Next" title={nextPage.metadata.title} align="right" />
      ) : (
        <PageLink to="/" label="Finished" title="Back to Library" align="right" onClick={onFinish} />
      )}
    </div>
  );
}

function PageLink({ to, label, title, align, onClick }: {
  to: string; label: string; title: string; align: 'left' | 'right'; onClick?: () => void;
}) {
  const isRight = align === 'right';
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex min-h-[64px] items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-[var(--text-color)] transition-colors hover:bg-white/6 active:scale-[0.98] sm:px-5 sm:py-4 ${isRight ? 'justify-between text-right' : ''}`}
    >
      {!isRight && <ChevronLeft size={16} className="shrink-0 text-[var(--muted-color)]" />}
      <div className={`min-w-0 ${isRight ? 'ml-auto' : ''}`}>
        <p className="text-xs text-[var(--muted-color)]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{title}</p>
      </div>
      {isRight && <ChevronRight size={16} className="shrink-0 text-[var(--muted-color)]" />}
    </Link>
  );
}

// MARK: - Nav Button
function NavButton({ icon, onClick, disabled = false }: { icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-color)] transition-colors hover:bg-white/8 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
    >
      {icon}
    </button>
  );
}

// MARK: - Settings Sheet
function SettingsSheet({ settings, onClose, onUpdate }: {
  settings: ReturnType<typeof useSettings>['settings'];
  onClose: () => void;
  onUpdate: ReturnType<typeof useSettings>['updateSettings'];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 max-h-[65vh] overflow-y-auto rounded-t-3xl border-t border-white/8 bg-[var(--card-color)] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-5"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/12" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-color)]">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-color)] transition-colors hover:bg-white/8 active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
        <OptionRow label="Theme" options={THEME_OPTIONS} value={settings.theme} onChange={(v) => onUpdate({ theme: v })} />
        <OptionRow label="Font" options={FONT_OPTIONS} value={settings.font} onChange={(v) => onUpdate({ font: v })} />
      </motion.div>
    </motion.div>
  );
}

// MARK: - Option Row
function OptionRow<T extends string>({ label, options, value, onChange }: {
  label: string; options: SettingChoice<T>[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted-color)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
              opt.value === value
                ? 'bg-[var(--text-color)] text-[var(--bg-color)]'
                : 'border border-white/10 text-[var(--muted-color)] hover:text-[var(--text-color)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
