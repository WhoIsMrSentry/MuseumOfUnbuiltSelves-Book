import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import mdxMtime from './plugins/mdx-mtime'
import mdxEditor from './plugins/mdx-editor'
import coverOptimize from './plugins/cover-optimize'
import sitemap from './plugins/sitemap'

// MARK: - Vite Configuration
// https://vite.dev/config/
export default defineConfig({
  base: '/mystory/',
  plugins: [
    react(),
    tailwindcss(),
    mdxMtime(path.resolve(__dirname, '../content/stories')),
    mdxEditor(path.resolve(__dirname, '../content/stories')),
    coverOptimize(),
    sitemap({
      storiesDir: path.resolve(__dirname, '../content/stories'),
      siteUrl: 'https://hamzayslmn.github.io/mystory',
    }),
  ],
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
