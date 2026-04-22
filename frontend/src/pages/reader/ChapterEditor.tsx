// MARK: - ChapterEditor (dev-only)
// Owns all draft state for a chapter (title + body) and renders the inline
// editor UI: editable title in place of the <h2>, prose-styled body editor
// with a custom thick blinking cyan caret, and Save / Cancel actions.

import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import SmartField from '@/pages/reader/SmartField';
import { setFrontmatterValue, splitFrontmatter } from '@/pages/reader/frontmatter';
import { savePageRaw, type Page } from '@/utils/markdown';

export default function ChapterEditor({ page, number, onClose }: {
  page: Page; number: number; onClose: () => void;
}) {
  const { frontmatter, body } = splitFrontmatter(page.raw);
  const initialTitle = page.metadata.title;

  const [titleDraft, setTitleDraft] = useState(initialTitle);
  const [bodyDraft, setBodyDraft] = useState(body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MARK: - Reset drafts whenever the page changes underneath the editor
  useEffect(() => {
    setTitleDraft(initialTitle);
    setBodyDraft(body);
    setError(null);
  }, [page.bookSlug, page.pageSlug, body, initialTitle]);

  const dirty = titleDraft !== initialTitle || bodyDraft !== body;

  const onCancel = useCallback(() => {
    setTitleDraft(initialTitle);
    setBodyDraft(body);
    setError(null);
    onClose();
  }, [initialTitle, body, onClose]);

  const onSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const fm = frontmatter
        ? setFrontmatterValue(frontmatter, 'title', titleDraft)
        : `---\ntitle: "${titleDraft.replace(/"/g, '\\"')}"\n---`;
      const merged = `${fm}\n${bodyDraft.replace(/^\n+/, '')}`;
      await savePageRaw(page.bookSlug, page.pageSlug, merged);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [bodyDraft, titleDraft, frontmatter, page.bookSlug, page.pageSlug, onClose]);

  return (
    <section className="py-6">
      {page.metadata.cover && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
          <img
            src={page.metadata.cover}
            alt={titleDraft}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
        Chapter {number}
      </p>
      <div className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
        <SmartField
          value={titleDraft}
          onChange={setTitleDraft}
          placeholder="Chapter title"
        />
      </div>
      {page.metadata.lastModified && (
        <p className="mb-6 text-xs text-[var(--muted)] opacity-60">
          Son düzenlenme: {page.metadata.lastModified}
        </p>
      )}
      {page.metadata.description && (
        <p className="mb-8 text-sm leading-relaxed text-[var(--muted)]">{page.metadata.description}</p>
      )}
      <div className="prose prose-invert prose-mystory max-w-none prose-sm sm:prose-base md:prose-lg prose-p:my-3 prose-p:leading-7 sm:prose-p:my-4 sm:prose-p:leading-8 prose-a:underline prose-a:underline-offset-4">
        <SmartField
          multiline
          centerOnType
          value={bodyDraft}
          onChange={setBodyDraft}
          style={{ minHeight: '40vh' }}
        />
      </div>
      <div className="mt-6 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        {error && <p className="mr-auto text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.06] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>
      {/* MARK: - Spacer so caret can scroll to vertical center on the last line */}
      <div aria-hidden style={{ height: '50vh' }} />
    </section>
  );
}
