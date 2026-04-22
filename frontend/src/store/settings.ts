import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// MARK: - Types
export type ThemeType = 'obsidian' | 'amoled';
export type FontType = 'default' | 'serif' | 'comic';
export type FontSizeType = 'sm' | 'md' | 'lg' | 'xl';

export interface SettingsState {
  theme: ThemeType;
  font: FontType;
  fontSize: FontSizeType;
}

interface SettingsStore extends SettingsState {
  update: (patch: Partial<SettingsState>) => void;
}

const DEFAULTS: SettingsState = { theme: 'obsidian', font: 'comic', fontSize: 'lg' };

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
      name: 'mystory_user_settings',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, font: s.font, fontSize: s.fontSize }),
      migrate: () => DEFAULTS, // v1 -> v2: reset to new defaults (playful + large)
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
    label: 'Theme',
    options: [
      { value: 'obsidian', label: 'Soft dark' },
      { value: 'amoled',   label: 'Deep black' },
    ],
  },
  font: {
    label: 'Font',
    options: [
      { value: 'default', label: 'Sans' },
      { value: 'serif',   label: 'Serif' },
      { value: 'comic',   label: 'Playful' },
    ],
  },
  fontSize: {
    label: 'Text size',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'XL' },
    ],
  },
};
