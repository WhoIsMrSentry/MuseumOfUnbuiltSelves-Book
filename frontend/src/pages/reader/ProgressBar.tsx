export default function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.max((current / total) * 100, 1) : 0;
  return (
    <div className="fixed inset-x-0 top-0 z-[61] h-[2px] bg-white/[0.06]">
      <div className="h-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
