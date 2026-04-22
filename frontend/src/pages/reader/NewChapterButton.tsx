// MARK: - "Create next chapter" card (dev-only)
// Styled to match the pagination PageLink cards. Creates a new MDX file with
// a starter template, then navigates to it via a hard reload so Vite's
// import.meta.glob picks up the new file.

import { useState } from 'react';
import { ChevronRight, LoaderCircle, Plus } from 'lucide-react';
import { createNextChapter, type Book } from '@/utils/markdown';

export default function NewChapterButton({ book, currentPageSlug }: {
  book: Book; currentPageSlug: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      const newSlug = await createNextChapter(book, currentPageSlug);
      // Hard reload so Vite's import.meta.glob picks up the new file.
      // ?edit=1 tells the Reader to open the editor immediately.
      const url = `${import.meta.env.BASE_URL}reader/${book.bookSlug}/${newSlug}?edit=1`.replace(/([^:])\/+/g, '$1/');
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="surface surface-hover flex w-full min-h-[64px] items-center justify-between gap-3 px-4 py-3 text-right active:scale-[0.98] disabled:opacity-50 sm:px-5 sm:py-4"
      >
        <div className="flex items-center gap-2 text-[var(--accent)]">
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
          <span className="text-xs font-medium uppercase tracking-widest">Dev</span>
        </div>
        <div className="ml-auto min-w-0">
          <p className="text-xs text-[var(--muted)]">New</p>
          <p className="mt-0.5 truncate text-sm font-medium">Create next chapter</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" />
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

