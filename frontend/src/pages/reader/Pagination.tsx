import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageEntry } from '@/utils/markdown';
import { shouldUseBatTransition } from '@/utils/batTransition';

type SideItem = {
  side: 'left' | 'right';
  to: string;
  slug?: string;
  label: string;
  title: string;
  onClick?: () => void;
};

export default function Pagination({
  bookSlug,
  prev,
  next,
  onFinish,
  onChapterNavigate,
  chapterNavDisabled = false,
}: {
  bookSlug: string;
  prev: PageEntry | null;
  next: PageEntry | null;
  onFinish: () => void;
  onChapterNavigate?: (slug: string) => void;
  chapterNavDisabled?: boolean;
}) {
  const link = (slug: string) => `/reader/${bookSlug}/${slug}`;
  const useBatNav = Boolean(onChapterNavigate) && shouldUseBatTransition();

  const items: (SideItem | null)[] = [
    prev ? { side: 'left', to: link(prev.pageSlug), slug: prev.pageSlug, label: 'Önceki', title: prev.metadata.title } : null,
    next
      ? { side: 'right', to: link(next.pageSlug), slug: next.pageSlug, label: 'Sonraki', title: next.metadata.title }
      : { side: 'right', to: '/', label: 'Bitti', title: 'Kütüphaneye Dön', onClick: onFinish },
  ];

  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      {items.map((it, i) => it
        ? (
          <PageLink
            key={it.side}
            {...it}
            useBatNav={useBatNav && Boolean(it.slug)}
            onChapterNavigate={onChapterNavigate}
            disabled={chapterNavDisabled}
          />
        )
        : <div key={i} className="hidden sm:block" />
      )}
    </div>
  );
}

function PageLink({
  to,
  slug,
  label,
  title,
  side,
  onClick,
  useBatNav,
  onChapterNavigate,
  disabled,
}: SideItem & {
  useBatNav?: boolean;
  onChapterNavigate?: (slug: string) => void;
  disabled?: boolean;
}) {
  const right = side === 'right';
  const className = `surface surface-hover flex min-h-[64px] items-center gap-3 px-4 py-3 active:scale-[0.98] sm:px-5 sm:py-4 ${right ? 'justify-between text-right' : ''} disabled:opacity-40`;

  const content = (
    <>
      {!right && <ChevronLeft size={16} className="shrink-0 text-[var(--muted)]" />}
      <div className={`min-w-0 ${right ? 'ml-auto' : ''}`}>
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{title}</p>
      </div>
      {right && <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" />}
    </>
  );

  if (useBatNav && slug && onChapterNavigate) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChapterNavigate(slug)}
        className={`${className} w-full border-0 bg-transparent text-left text-[var(--text)]`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={to} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}
