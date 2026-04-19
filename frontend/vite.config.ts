import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import mdxMtime from './plugins/mdx-mtime'

// MARK: - Vite Configuration
// https://vite.dev/config/
export default defineConfig({
  base: '/mystory/',
  plugins: [react(), tailwindcss(), mdxMtime(path.resolve(__dirname, '../content/stories'))],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
