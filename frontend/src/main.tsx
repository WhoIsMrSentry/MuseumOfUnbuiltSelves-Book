import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applySettingsToDOM, useSettingsStore } from '@/store/settings'
import '@/index.css'
import App from '@/App.tsx'

// MARK: - Apply persisted settings to DOM at startup
applySettingsToDOM(useSettingsStore.getState());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
