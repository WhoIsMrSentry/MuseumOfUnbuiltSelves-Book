import { Link } from 'react-router-dom';
import { Quote, X } from 'lucide-react';
import type { QuoteEntry } from '@/utils/markdown';

export default function QuotesSheet({
  entered,
  onClose,
  bookSlug,
  quotes,
}: {
  entered: boolean;
  onClose: () => void;
  bookSlug: string;
  quotes: QuoteEntry[];
}) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[var(--card)] p-5 transition-transform duration-200 ease-out sm:p-6 ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote size={16} className="text-[var(--quote-accent)]" />
            <h2 className="text-base font-semibold">Alıntılar</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-white/[0.08] active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs text-[var(--muted)]">
          Kitaptan işaretlenen alıntılar. Her karttan doğrudan geçtiği bölüme gidebilirsin.
        </p>

        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-[var(--muted)]">
            Henüz bu kitapta blok alıntı yok. Alıntı eklemek için bölüm içinde satırı {'>'} ile başlat.
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <Link
                key={q.id}
                to={`/reader/${bookSlug}/${q.pageSlug}`}
                onClick={onClose}
                className="block rounded-2xl border border-[color:var(--quote-accent)]/35 bg-[color:var(--quote-accent)]/8 p-4 no-underline transition-colors hover:bg-[color:var(--quote-accent)]/14"
              >
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--quote-accent)]">
                  {q.chapterTitle}
                </p>
                <p className="line-clamp-4 text-sm leading-relaxed text-[var(--text)]">{q.text}</p>
                <p className="mt-3 text-xs text-[var(--quote-accent)]">Bölüme git</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
