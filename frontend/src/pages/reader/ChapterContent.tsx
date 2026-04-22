import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChapterEditor from '@/pages/reader/ChapterEditor';
import ChapterReadView from '@/pages/reader/ChapterReadView';
import type { Page } from '@/utils/markdown';

export default function ChapterContent({ page, number }: { page: Page; number: number }) {
  const isDev = import.meta.env.DEV;
  const [searchParams, setSearchParams] = useSearchParams();
  const autoEdit = isDev && searchParams.get('edit') === '1';
  const [editing, setEditing] = useState(autoEdit);

  // MARK: - Reset editing flag when navigating to a different page
  useEffect(() => { setEditing(autoEdit); }, [page.bookSlug, page.pageSlug, autoEdit]);

  // MARK: - Strip the ?edit=1 marker after consuming it
  useEffect(() => {
    if (autoEdit) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isDev && editing) {
    return <ChapterEditor page={page} number={number} onClose={() => setEditing(false)} />;
  }
  return <ChapterReadView page={page} number={number} onEdit={isDev ? () => setEditing(true) : undefined} />;
}
