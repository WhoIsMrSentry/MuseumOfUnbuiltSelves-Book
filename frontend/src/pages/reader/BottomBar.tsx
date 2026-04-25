import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import NavBtn from '@/pages/reader/NavBtn';

export default function BottomBar(props: {
  current: number; total: number;
  hasPrev: boolean; hasNext: boolean;
  onPrev: () => void; onNext: () => void; onSettings: () => void;
  entered: boolean;
}) {
  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[var(--bg)]/90 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md transition-all duration-200 ease-out sm:px-4 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pt-3 ${
        props.entered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-1">
        <NavBtn disabled={!props.hasPrev} icon={<ChevronLeft size={18} />} label="Geri" onClick={props.onPrev} />
        <span className="text-xs tabular-nums text-[var(--muted)] sm:text-sm">
          {props.current} / {props.total}
        </span>
        <NavBtn disabled={!props.hasNext} icon={<ChevronRight size={18} />} label="İleri" onClick={props.onNext} />
        <NavBtn icon={<Settings2 size={18} />} label="Ayarlar" onClick={props.onSettings} />
      </div>
    </nav>
  );
}
