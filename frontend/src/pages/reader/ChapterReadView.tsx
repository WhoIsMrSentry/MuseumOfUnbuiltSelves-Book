import ReactMarkdown from 'react-markdown';
import { Pencil } from 'lucide-react';
import type { Page } from '@/utils/markdown';

export default function ChapterReadView({ page, number, onEdit }: {
  page: Page; number: number; onEdit?: () => void;
}) {
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
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
          Chapter {number}
        </p>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.12] hover:text-[var(--text)]"
            title="Edit this chapter (dev only)"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
      </div>
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
