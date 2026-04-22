// MARK: - Vite Plugin: Dev-only MDX Editor
// Exposes POST /__save-mdx that writes raw MDX back to disk.
// Only mounted in dev (configureServer); has zero effect in production builds.
//
// content/stories/ lives outside the frontend root, so Vite's default watcher
// does not see it. We explicitly add it to the watcher and invalidate any
// modules using import.meta.glob('../../../content/stories/**') after each
// write so newly-created chapters show up on the next page load.

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import type { Plugin, ViteDevServer } from 'vite';

const ENDPOINT = '/__save-mdx';
const SLUG_RE = /^[a-zA-Z0-9_-]+$/;

function invalidateGlobConsumers(server: ViteDevServer, root: string): void {
  // MARK: - Invalidate every module whose source references the stories dir
  for (const mod of server.moduleGraph.idToModuleMap.values()) {
    if (!mod.file) continue;
    // Only check transformed source files (cheap path filter first)
    if (!mod.file.endsWith('.ts') && !mod.file.endsWith('.tsx')) continue;
    if (mod.transformResult?.code?.includes(root)) {
      server.moduleGraph.invalidateModule(mod);
    }
  }
}

export default function mdxEditorPlugin(storiesDir: string): Plugin {
  const root = resolve(storiesDir);
  return {
    name: 'mdx-editor',
    apply: 'serve',
    configureServer(server) {
      // MARK: - Watch the external stories dir so file changes are noticed
      server.watcher.add(root);

      server.middlewares.use(ENDPOINT, (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const { bookSlug, pageSlug, content } = JSON.parse(body) as {
              bookSlug?: string; pageSlug?: string; content?: string;
            };
            if (!bookSlug || !pageSlug || typeof content !== 'string') {
              res.statusCode = 400;
              res.end('Missing fields');
              return;
            }
            if (!SLUG_RE.test(bookSlug) || !SLUG_RE.test(pageSlug)) {
              res.statusCode = 400;
              res.end('Invalid slug');
              return;
            }
            const filePath = resolve(join(root, bookSlug, `${pageSlug}.mdx`));
            // MARK: - Path traversal guard
            if (!filePath.startsWith(root)) {
              res.statusCode = 400;
              res.end('Invalid path');
              return;
            }
            const dir = dirname(filePath);
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
            const isNew = !existsSync(filePath);
            writeFileSync(filePath, content, 'utf8');

            // MARK: - On a new file, force Vite to re-transform glob consumers
            if (isNew) {
              server.watcher.emit('add', filePath);
              invalidateGlobConsumers(server, root);
              server.ws.send({ type: 'full-reload' });
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, created: isNew }));
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
        });
      });
    },
  };
}
