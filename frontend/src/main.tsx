import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applySettingsToDOM, useSettingsStore } from '@/store/settings'
// MARK: - Self-hosted Atkinson Hyperlegible (Braille Institute, OFL).
// Designed for maximum character distinction — the most popular open-source
// dyslexia-friendly book font. Bundled so every device renders identically.
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/atkinson-hyperlegible/400-italic.css'
import '@/index.css'
import App from '@/App.tsx'

// MARK: - Apply persisted settings to DOM at startup
applySettingsToDOM(useSettingsStore.getState());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
