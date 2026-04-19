import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle, Settings2, X } from 'lucide-react';
import { useSettings } from '@/store/settings';
import { clearProgress, getProgress, setProgress } from '@/store/progress';
import { getBookBySlug, getPageContent } from '@/utils/markdown';
import type { Book, Page } from '@/utils/markdown';

// MARK: - Constants
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

const TOOLBAR_HIDE_MS = 3500;

// MARK: - Reader
export default function Reader() {
  const { bookSlug, pageSlug } = useParams<{ bookSlug: string; pageSlug: string }>();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  const [book, setBook] = useState<Book | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedSlug = useMemo(() => getProgress(bookSlug || ''), [bookSlug]);

  // MARK: - Load book index (synchronous — zero fetches)
  useEffect(() => {
    if (!bookSlug) { navigate('/', { replace: true }); return; }
    const b = getBookBySlug(bookSlug);
    if (!b) { navigate('/', { replace: true }); return; }
    setBook(b);
    setLoading(false);
  }, [bookSlug, navigate]);

  // MARK: - Resolve page index
  const pageIndex = useMemo(() => {
    if (!book) return -1;
    if (pageSlug) {
      const idx = book.pages.findIndex((p) => p.pageSlug === pageSlug);
      if (idx >= 0) return idx;
    }
    if (savedSlug) {
      const idx = book.pages.findIndex((p) => p.pageSlug === savedSlug);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [book, pageSlug, savedSlug]);

  const totalPages = book?.pages.length ?? 0;
  const entry = book && pageIndex >= 0 ? book.pages[pageIndex] : null;
  const hasPrev = pageIndex > 0;
  const hasNext = pageIndex >= 0 && pageIndex < totalPages - 1;

  // MARK: - Route sync
  useEffect(() => {
    if (loading || !book || !entry) return;
    if (pageSlug !== entry.pageSlug) {
      navigate(`/reader/${book.bookSlug}/${entry.pageSlug}`, { replace: true });
    }
  }, [book, loading, entry, pageSlug, navigate]);

  // MARK: - Load single page content on demand
  useEffect(() => {
    if (!book || !entry) return;
    setPage(null); // clear old content while loading
    getPageContent(book.bookSlug, entry.pageSlug).then((p) => setPage(p));
  }, [book, entry]);

  // MARK: - Save progress
  useEffect(() => {
    if (!book || !entry) return;
    setProgress(book.bookSlug, entry.pageSlug);
  }, [book, entry]);

  // MARK: - Scroll to top on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [pageSlug]);

  // MARK: - Navigation helpers
  const goTo = useCallback((idx: number) => {
    if (!book || idx < 0 || idx >= book.pages.length) return;
    navigate(`/reader/${book.bookSlug}/${book.pages[idx].pageSlug}`);
  }, [book, navigate]);

  const goPrev = useCallback(() => goTo(pageIndex - 1), [goTo, pageIndex]);
  const goNext = useCallback(() => goTo(pageIndex + 1), [goTo, pageIndex]);

  // MARK: - Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('button, a, input, textarea, select')) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext]);

  // MARK: - Toolbar auto-hide
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToolbarVisible(false), TOOLBAR_HIDE_MS);
  }, []);

  const toggleToolbar = useCallback(() => {
    setToolbarVisible((v) => { const next = !v; if (next) resetHideTimer(); return next; });
  }, [resetHideTimer]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [pageSlug, resetHideTimer]);

  // MARK: - Center-tap
  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a, button, input')) return;
    const relY = e.clientY / window.innerHeight;
    if (relY > 0.25 && relY < 0.75) toggleToolbar();
  }, [toggleToolbar]);

  // MARK: - Loading
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--bg-color)] text-[var(--muted-color)]">
        <LoaderCircle size={24} className="animate-spin" />
      </div>
    );
  }

  if (!book || !entry) return null;

  return (
    <div className="relative min-h-svh bg-[var(--bg-color)] text-[var(--text-color)]" onClick={handleTap}>
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
              <p className="truncate text-sm font-medium text-[var(--text-color)]">{entry.metadata.title}</p>
              <p className="truncate text-xs text-[var(--muted-color)]">{book.title} · {pageIndex + 1}/{totalPages}</p>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 pb-28 pt-14 sm:px-6 md:px-8">
        {page ? (
          <>
            <ChapterContent page={page} number={pageIndex + 1} />
            <PaginationNav
              bookSlug={book.bookSlug}
              prevPage={hasPrev ? book.pages[pageIndex - 1] : null}
              nextPage={hasNext ? book.pages[pageIndex + 1] : null}
              onFinish={() => clearProgress(book.bookSlug)}
            />
          </>
        ) : (
          <div className="flex items-center justify-center py-32 text-[var(--muted-color)]">
            <LoaderCircle size={20} className="animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom bar — simple: ‹ Prev | Page X of Y | Next › | ⚙ */}
      <AnimatePresence>
        {toolbarVisible && (
          <motion.nav
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[var(--bg-color)]/90 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md sm:px-4 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pt-3"
          >
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-1">
              <NavBtn disabled={!hasPrev} icon={<ChevronLeft size={18} />} label="Prev" onClick={goPrev} />
              <span className="text-xs tabular-nums text-[var(--muted-color)] sm:text-sm">
                {pageIndex + 1} / {totalPages}
              </span>
              <NavBtn disabled={!hasNext} icon={<ChevronRight size={18} />} label="Next" onClick={goNext} />
              <NavBtn icon={<Settings2 size={18} />} onClick={() => { setShowSettings(true); setToolbarVisible(true); }} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <SettingsSheet settings={settings} onClose={() => setShowSettings(false)} onUpdate={updateSettings} />
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

// MARK: - Chapter Content
function ChapterContent({ page, number }: { page: Page; number: number }) {
  return (
    <article className="py-6">
      {page.metadata.cover && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/8 shadow-2xl">
          <img 
            src={page.metadata.cover} 
            alt={page.metadata.title} 
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted-color)]">Chapter {number}</p>
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--text-color)] sm:text-2xl md:text-3xl">
        {page.metadata.title}
      </h2>
      {page.metadata.lastModified && (
        <p className="mb-6 text-xs text-[var(--muted-color)] opacity-60">Son düzenlenme: {page.metadata.lastModified}</p>
      )}
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
  bookSlug: string; prevPage: { pageSlug: string; metadata: { title: string } } | null;
  nextPage: { pageSlug: string; metadata: { title: string } } | null; onFinish: () => void;
}) {
  const path = (slug: string) => `/reader/${bookSlug}/${slug}`;
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      {prevPage ? (
        <PageLink to={path(prevPage.pageSlug)} label="Previous" title={prevPage.metadata.title} align="left" />
      ) : (
        <div className="hidden sm:block" />
      )}
      {nextPage ? (
        <PageLink to={path(nextPage.pageSlug)} label="Next" title={nextPage.metadata.title} align="right" />
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
    <Link to={to} onClick={onClick}
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
function NavBtn({ icon, onClick, disabled = false, label }: { icon: ReactNode; onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} disabled={disabled}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-2 text-[var(--text-color)] transition-colors hover:bg-white/8 active:scale-95 disabled:opacity-30 disabled:pointer-events-none sm:px-3"
    >
      {icon}
      {label && <span className="hidden text-xs font-medium sm:inline">{label}</span>}
    </button>
  );
}

// MARK: - Settings Sheet
function SettingsSheet({ settings, onClose, onUpdate }: {
  settings: ReturnType<typeof useSettings>['settings']; onClose: () => void;
  onUpdate: ReturnType<typeof useSettings>['updateSettings'];
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose}
    >
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 max-h-[65vh] overflow-y-auto rounded-t-3xl border-t border-white/8 bg-[var(--card-color)] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-5"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/12" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-color)]">Settings</h2>
          <button type="button" onClick={onClose}
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
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
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
