import { useState, useEffect } from 'react';

// MARK: - Settings Types & Constants
export type ThemeType = 'obsidian' | 'amoled';
export type FontType = 'default' | 'serif' | 'comic';

export interface SettingsState {
  theme: ThemeType;
  font: FontType;
}

const SETTINGS_KEY = 'mystory_user_settings';

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'obsidian',
  font: 'default',
};

// MARK: - LocalStorage Helpers
export function getSettings(): SettingsState {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to parse settings registry', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<SettingsState>): SettingsState {
  const current = getSettings();
  const next = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  applySettingsToDOM(next);
  return next;
}

export function applySettingsToDOM(settings?: SettingsState) {
  const s = settings || getSettings();
  const html = document.documentElement;

  if (s.theme === 'amoled') {
    html.setAttribute('data-theme', 'amoled');
  } else {
    html.removeAttribute('data-theme');
  }

  if (s.font !== 'default') {
    html.setAttribute('data-font', s.font);
  } else {
    html.removeAttribute('data-font');
  }
}

// MARK: - React Hook
export function useSettings() {
  const [settings, setSettingsState] = useState<SettingsState>(getSettings());

  useEffect(() => {
    applySettingsToDOM(settings);
  }, [settings]);

  const updateSettings = (updates: Partial<SettingsState>) => {
    const next = saveSettings(updates);
    setSettingsState(next);
  };

  return { settings, updateSettings };
}
