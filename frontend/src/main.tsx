import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applySettingsToDOM } from '@/store/settings'
import '@/index.css'
import App from '@/App.tsx'

applySettingsToDOM();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
