import { motion } from 'framer-motion';

export default function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
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
