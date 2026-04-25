import { Quote } from 'lucide-react';

export default function TopBar({ title, subtitle, entered, onQuotes }: {
  title: string; subtitle: string; entered: boolean; onQuotes?: () => void;
}) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center gap-3 border-b border-white/[0.08] bg-[var(--bg)]/90 px-4 py-3 pl-14 backdrop-blur-md transition-all duration-200 ease-out sm:pl-16 ${
        entered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-[var(--muted)]">{subtitle}</p>
      </div>
      {onQuotes && (
        <button
          type="button"
          onClick={onQuotes}
          title="Alıntılar"
          aria-label="Alıntıları aç"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--quote-accent)]/40 bg-[color:var(--quote-accent)]/10 text-[var(--quote-accent)] transition-colors hover:bg-[color:var(--quote-accent)]/20"
        >
          <Quote size={15} />
        </button>
      )}
    </header>
  );
}
