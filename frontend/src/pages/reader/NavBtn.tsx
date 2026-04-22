import type { ReactNode } from 'react';

export default function NavBtn({ icon, onClick, disabled = false, label }: {
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
