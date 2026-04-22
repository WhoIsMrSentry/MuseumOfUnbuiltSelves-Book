import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle, Settings2, X } from 'lucide-react';
import { SETTING_GROUPS, useSettingsStore, type SettingsState } from '@/store/settings';
import { useReader } from '@/pages/useReader';
import type { Page, PageEntry } from '@/utils/markdown';

const TOOLBAR_HIDE_MS = 3500;

// MARK: - Reader
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

  // MARK: - Keyboard nav (stable refs for goPrev/goNext)
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

// MARK: - Spinner
function CenteredSpinner({ padded }: { padded?: boolean } = {}) {
  return (
    <div className={`flex items-center justify-center text-[var(--muted)] ${padded ? 'py-32' : 'min-h-svh'}`}>
      <LoaderCircle size={22} className="animate-spin" />
    </div>
  );
}

// MARK: - Progress Bar
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.max((current / total) * 100, 1) : 0;
  return (
    <div className="fixed inset-x-0 top-0 z-[61] h-[2px] bg-white/[0.06]">
      <div className="h-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

// MARK: - Top Bar
function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 border-b border-white/[0.08] bg-[var(--bg)]/90 px-4 py-3 pl-14 backdrop-blur-md sm:pl-16"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-[var(--muted)]">{subtitle}</p>
      </div>
    </motion.header>
  );
}

// MARK: - Bottom Bar
function BottomBar(props: {
  current: number; total: number;
  hasPrev: boolean; hasNext: boolean;
  onPrev: () => void; onNext: () => void; onSettings: () => void;
}) {
  return (
    <motion.nav
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[var(--bg)]/90 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md sm:px-4 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pt-3"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-1">
        <NavBtn disabled={!props.hasPrev} icon={<ChevronLeft size={18} />} label="Prev" onClick={props.onPrev} />
        <span className="text-xs tabular-nums text-[var(--muted)] sm:text-sm">
          {props.current} / {props.total}
        </span>
        <NavBtn disabled={!props.hasNext} icon={<ChevronRight size={18} />} label="Next" onClick={props.onNext} />
        <NavBtn icon={<Settings2 size={18} />} onClick={props.onSettings} />
      </div>
    </motion.nav>
  );
}

// MARK: - Chapter
function ChapterContent({ page, number }: { page: Page; number: number }) {
  return (
    <section className="py-6">
      {page.metadata.cover && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
          <img
            src={page.metadata.cover}
            alt={page.metadata.title}
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
        Chapter {number}
      </p>
      <h2 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
        {page.metadata.title}
      </h2>
      {page.metadata.lastModified && (
        <p className="mb-6 text-xs text-[var(--muted)] opacity-60">
          Son düzenlenme: {page.metadata.lastModified}
        </p>
      )}
      {page.metadata.description && (
        <p className="mb-8 text-sm leading-relaxed text-[var(--muted)]">{page.metadata.description}</p>
      )}
      <div className="prose prose-invert prose-mystory max-w-none prose-sm sm:prose-base md:prose-lg prose-p:my-3 prose-p:leading-7 sm:prose-p:my-4 sm:prose-p:leading-8 prose-a:underline prose-a:underline-offset-4">
        <ReactMarkdown>{page.content}</ReactMarkdown>
      </div>
    </section>
  );
}

// MARK: - Pagination (single component, both sides via map)
type SideItem = { side: 'left' | 'right'; to: string; label: string; title: string; onClick?: () => void };

function Pagination({ bookSlug, prev, next, onFinish }: {
  bookSlug: string; prev: PageEntry | null; next: PageEntry | null; onFinish: () => void;
}) {
  const link = (slug: string) => `/reader/${bookSlug}/${slug}`;
  const items: (SideItem | null)[] = [
    prev ? { side: 'left',  to: link(prev.pageSlug), label: 'Previous', title: prev.metadata.title } : null,
    next
      ? { side: 'right', to: link(next.pageSlug), label: 'Next', title: next.metadata.title }
      : { side: 'right', to: '/', label: 'Finished', title: 'Back to Library', onClick: onFinish },
  ];

  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      {items.map((it, i) => it
        ? <PageLink key={it.side} {...it} />
        : <div key={i} className="hidden sm:block" />
      )}
    </div>
  );
}

function PageLink({ to, label, title, side, onClick }: SideItem) {
  const right = side === 'right';
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`surface surface-hover flex min-h-[64px] items-center gap-3 px-4 py-3 active:scale-[0.98] sm:px-5 sm:py-4 ${right ? 'justify-between text-right' : ''}`}
    >
      {!right && <ChevronLeft size={16} className="shrink-0 text-[var(--muted)]" />}
      <div className={`min-w-0 ${right ? 'ml-auto' : ''}`}>
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{title}</p>
      </div>
      {right && <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" />}
    </Link>
  );
}

// MARK: - Nav Button
function NavBtn({ icon, onClick, disabled = false, label }: {
  icon: ReactNode; onClick: () => void; disabled?: boolean; label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-white/[0.08] active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:px-3"
    >
      {icon}
      {label && <span className="hidden text-xs font-medium sm:inline">{label}</span>}
    </button>
  );
}

// MARK: - Settings Sheet (reads store directly with primitive selectors)
function SettingsSheet({ onClose }: { onClose: () => void }) {
  const update = useSettingsStore((s) => s.update);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[var(--card)] px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 sm:px-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-white/[0.08] active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
        {(Object.keys(SETTING_GROUPS) as (keyof SettingsState)[]).map((k) => (
          <SettingsRow key={k} settingKey={k} onChange={(v) => update({ [k]: v } as Partial<SettingsState>)} />
        ))}
      </motion.div>
    </motion.div>
  );
}

// MARK: - Settings Row (subscribes to one primitive — no infinite loop risk)
function SettingsRow<K extends keyof SettingsState>({ settingKey, onChange }: {
  settingKey: K; onChange: (v: SettingsState[K]) => void;
}) {
  const value = useSettingsStore((s) => s[settingKey]);
  const group = SETTING_GROUPS[settingKey];
  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[var(--muted)]">{group.label}</p>
      <div className="grid grid-flow-col auto-cols-fr gap-1.5 rounded-full bg-white/[0.04] p-1">
        {group.options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value as SettingsState[K])}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors active:scale-95 ${
                active
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
