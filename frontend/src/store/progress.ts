import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// MARK: - Reading progress map: { bookSlug -> last pageSlug }
interface ProgressStore {
  map: Record<string, string>;
  set: (bookSlug: string, pageSlug: string) => void;
  clear: (bookSlug: string) => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      map: {},
      set: (bookSlug, pageSlug) => set((s) => ({ map: { ...s.map, [bookSlug]: pageSlug } })),
      clear: (bookSlug) => set((s) => {
        const next = { ...s.map };
        delete next[bookSlug];
        return { map: next };
      }),
    }),
    {
      name: 'museum_unbuilt_selves_reading_progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ map: s.map }),
    },
  ),
);

// MARK: - Non-reactive accessor (for utilities/effects that don't need subscription)
export const getProgress = (bookSlug: string): string | null =>
  useProgressStore.getState().map[bookSlug] || null;

