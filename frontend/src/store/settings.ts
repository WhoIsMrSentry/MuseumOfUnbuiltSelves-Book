import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// MARK: - Types
export type ThemeType = 'obsidian' | 'amoled' | 'sentry-kizili';
export type FontType = 'default' | 'serif' | 'fancy';
export type FontSizeType = 'sm' | 'md' | 'lg' | 'xl';

export interface SettingsState {
  theme: ThemeType;
  font: FontType;
  fontSize: FontSizeType;
}

interface SettingsStore extends SettingsState {
  update: (patch: Partial<SettingsState>) => void;
}

const DEFAULTS: SettingsState = { theme: 'obsidian', font: 'fancy', fontSize: 'lg' };

// MARK: - DOM mapping (key -> attribute, optional default value to omit)
const DOM_MAP: { [K in keyof SettingsState]: { attr: string; defaultValue?: SettingsState[K] } } = {
  theme:    { attr: 'data-theme',     defaultValue: 'obsidian' },
  font:     { attr: 'data-font' },
  fontSize: { attr: 'data-font-size' },
};

export function applySettingsToDOM(s: SettingsState) {
  const html = document.documentElement;
  (Object.keys(DOM_MAP) as (keyof SettingsState)[]).forEach((k) => {
    const { attr, defaultValue } = DOM_MAP[k];
    const value = s[k];
    if (defaultValue !== undefined && value === defaultValue) html.removeAttribute(attr);
    else html.setAttribute(attr, value);
  });
}

// MARK: - Store (persisted, cross-tab synced)
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (patch) => set((s) => {
        const next = { ...s, ...patch };
        applySettingsToDOM(next);
        return next;
      }),
    }),
    {
      name: 'museum_unbuilt_selves_user_settings',
      version: 6,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, font: s.font, fontSize: s.fontSize }),
      migrate: () => DEFAULTS, // bumped to v6: default font is now 'fancy' (Atkinson Hyperlegible / Easy read)
      onRehydrateStorage: () => (state) => { if (state) applySettingsToDOM(state); },
    },
  ),
);

// MARK: - UI groups (single source of truth)
type Choice<T extends string> = { value: T; label: string };

export const SETTING_GROUPS: {
  [K in keyof SettingsState]: { label: string; options: Choice<SettingsState[K]>[] };
} = {
  theme: {
    label: 'Tema',
    options: [
      { value: 'obsidian', label: 'Yumuşak koyu' },
      { value: 'amoled',   label: 'Derin siyah' },
      { value: 'sentry-kizili', label: 'Sentry Kızılı' },
    ],
  },
  font: {
    label: 'Yazı tipi',
    options: [
      { value: 'default', label: 'Sans' },
      { value: 'serif',   label: 'Serif' },
      { value: 'fancy',   label: 'Kolay okuma' },
    ],
  },
  fontSize: {
    label: 'Metin boyutu',
    options: [
      { value: 'sm', label: 'Küçük' },
      { value: 'md', label: 'Orta' },
      { value: 'lg', label: 'Büyük' },
      { value: 'xl', label: 'XL' },
    ],
  },
};

