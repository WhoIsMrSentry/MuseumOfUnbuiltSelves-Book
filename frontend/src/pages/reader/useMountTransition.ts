// MARK: - useMountTransition
// Drop-in replacement for AnimatePresence: keeps a component mounted until
// `durationMs` after `show` flips to false, and exposes an `entered` flag the
// caller can use to switch CSS classes (e.g. translate-y-0 vs translate-y-full).

import { useEffect, useState } from 'react';

export function useMountTransition(show: boolean, durationMs = 200) {
  const [mounted, setMounted] = useState(show);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      // Next frame so the initial class applies before the transition class.
      const r = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(r);
    }
    setEntered(false);
    const t = window.setTimeout(() => setMounted(false), durationMs);
    return () => window.clearTimeout(t);
  }, [show, durationMs]);

  return { mounted, entered };
}
