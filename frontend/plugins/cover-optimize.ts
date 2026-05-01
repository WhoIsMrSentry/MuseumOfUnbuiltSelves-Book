// MARK: - cover-optimize Vite plugin
// Build-time only. After Vite emits the production bundle, walks the asset
// directory and generates `.webp` and `.avif` siblings for every PNG/JPG.
// Also re-compresses the original PNG/JPG with sharp's better encoders so
// the legacy fallback shrinks too. The runtime uses `<picture>` with all
// three sources (see components/OptimizedImage.tsx).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

type Options = {
  outDir?: string;
  webpQuality?: number;
  avifQuality?: number;
  jpegQuality?: number;
  pngEffort?: number;
};

export default function coverOptimize(opts: Options = {}): Plugin {
  const {
    outDir = 'dist',
    webpQuality = 80,
    avifQuality = 55,
    jpegQuality = 82,
    pngEffort = 9,
  } = opts;

  return {
    name: 'museum-of-unbuilt-selves-cover-optimize',
    apply: 'build',
    async closeBundle() {
      const sharp = (await import('sharp')).default;
      const root = path.resolve(outDir, 'assets');

      let files: string[];
      try {
        files = await fs.readdir(root);
      } catch {
        return;
      }

      const targets = files.filter((f) => /\.(png|jpe?g)$/i.test(f));
      let saved = 0;

      await Promise.all(targets.map(async (name) => {
        const full = path.join(root, name);
        const ext = path.extname(name).toLowerCase();
        const base = name.slice(0, -ext.length);
        const buf = await fs.readFile(full);
        const before = buf.length;

        const img = sharp(buf);

        // Re-compress original
        if (ext === '.png') {
          const out = await img.clone().png({ effort: pngEffort, compressionLevel: 9 }).toBuffer();
          if (out.length < before) await fs.writeFile(full, out);
        } else {
          const out = await img.clone().jpeg({ quality: jpegQuality, mozjpeg: true }).toBuffer();
          if (out.length < before) await fs.writeFile(full, out);
        }

        // WebP + AVIF siblings
        const webp = await img.clone().webp({ quality: webpQuality }).toBuffer();
        await fs.writeFile(path.join(root, `${base}.webp`), webp);
        const avif = await img.clone().avif({ quality: avifQuality }).toBuffer();
        await fs.writeFile(path.join(root, `${base}.avif`), avif);

        const after = (await fs.stat(full)).size;
        saved += before - after;
      }));

      if (targets.length) {
        // eslint-disable-next-line no-console
        console.log(
          `[cover-optimize] processed ${targets.length} images, saved ${(saved / 1024).toFixed(0)} KB on originals (+ webp/avif siblings)`,
        );
      }
    },
  };
}

