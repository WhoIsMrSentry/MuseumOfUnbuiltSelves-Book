// MARK: - Vite Plugin: MDX File Modification Times
// Scans content/stories/**/*.mdx and exposes a virtual module
// with a map of { "bookSlug/pageSlug" → "YYYY-MM-DD" }.

import { statSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import type { Plugin } from 'vite';

const VIRTUAL_ID = 'virtual:mdx-mtime';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

function collectMtimes(storiesDir: string): Record<string, string> {
  const result: Record<string, string> = {};

  // MARK: - Walk books
  for (const bookDir of readdirSync(storiesDir, { withFileTypes: true })) {
    if (!bookDir.isDirectory() || bookDir.name.startsWith('.')) continue;
    const bookPath = join(storiesDir, bookDir.name);

    for (const file of readdirSync(bookPath, { withFileTypes: true })) {
      if (!file.isFile()) continue;
      const ext = extname(file.name);
      if (ext !== '.mdx') continue;

      const pageSlug = basename(file.name, ext);
      const key = `${bookDir.name}/${pageSlug}`;
      const stat = statSync(join(bookPath, file.name));
      result[key] = stat.mtime.toISOString().slice(0, 10);
    }
  }
  return result;
}

export default function mdxMtimePlugin(storiesDir: string): Plugin {
  return {
    name: 'mdx-mtime',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      const mtimes = collectMtimes(storiesDir);
      return `export default ${JSON.stringify(mtimes)};`;
    },
    // MARK: - HMR: re-scan on mdx file changes
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.mdx')) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
    },
  };
}
