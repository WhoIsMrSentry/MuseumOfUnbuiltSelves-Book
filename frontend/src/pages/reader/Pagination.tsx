import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageEntry } from '@/utils/markdown';

type SideItem = { side: 'left' | 'right'; to: string; label: string; title: string; onClick?: () => void };

export default function Pagination({ bookSlug, prev, next, onFinish }: {
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
