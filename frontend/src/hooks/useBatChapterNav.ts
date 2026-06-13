import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BAT_NAVIGATE_DELAY_MS,
  BAT_TRANSITION_MS,
  shouldUseBatTransition,
} from '@/utils/batTransition';

export function useBatChapterNav(
  bookSlug: string | undefined,
  setTransitioning: (active: boolean) => void,
) {
  const navigate = useNavigate();
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const goToSlug = useCallback((slug: string) => {
    if (!bookSlug || busyRef.current) return;

    const target = `/reader/${bookSlug}/${slug}`;
    if (!shouldUseBatTransition()) {
      navigate(target);
      return;
    }

    busyRef.current = true;
    setTransitioning(true);
    clearTimers();

    timersRef.current.push(
      window.setTimeout(() => navigate(target), BAT_NAVIGATE_DELAY_MS),
      window.setTimeout(() => {
        setTransitioning(false);
        busyRef.current = false;
        clearTimers();
      }, BAT_TRANSITION_MS),
    );
  }, [bookSlug, clearTimers, navigate, setTransitioning]);

  return { goToSlug, isBusy: () => busyRef.current };
}
