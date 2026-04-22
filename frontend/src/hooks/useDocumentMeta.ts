import { useEffect } from 'react';

// MARK: - SEO meta hook
// Updates <title>, description, canonical, OG/Twitter on route change.
// Keep it tiny: no external lib, no helmet provider needed.

export interface DocMeta {
  title: string;
  description: string;
  path: string;       // route path, e.g. "/reader/kisho/chapter1"
  image?: string;     // absolute URL preferred; relative ok
  type?: 'website' | 'article' | 'book';
  keywords?: string[];
}

const SITE_URL = 'https://hamzayslmn.github.io/mystory';
const SITE_NAME = 'MyStory by hamzayslmn';

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    if (selector.startsWith('link')) {
      el = document.createElement('link');
      const rel = selector.match(/rel="([^"]+)"/)?.[1];
      if (rel) (el as HTMLLinkElement).rel = rel;
    } else {
      el = document.createElement('meta');
      const name = selector.match(/name="([^"]+)"/)?.[1];
      const prop = selector.match(/property="([^"]+)"/)?.[1];
      if (name) (el as HTMLMetaElement).name = name;
      if (prop) (el as HTMLMetaElement).setAttribute('property', prop);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function useDocumentMeta(meta: DocMeta) {
  useEffect(() => {
    const url = `${SITE_URL}${meta.path}`;
    const image = meta.image
      ? meta.image.startsWith('http') ? meta.image : `${SITE_URL}${meta.image}`
      : `${SITE_URL}/favicon.svg`;
    const type = meta.type || 'website';

    document.title = meta.title;
    setMeta('meta[name="description"]', 'content', meta.description);
    if (meta.keywords?.length) {
      setMeta('meta[name="keywords"]', 'content', meta.keywords.join(', '));
    }
    setMeta('link[rel="canonical"]', 'href', url);

    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:site_name"]', 'content', SITE_NAME);

    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', meta.title);
    setMeta('meta[name="twitter:description"]', 'content', meta.description);
    setMeta('meta[name="twitter:image"]', 'content', image);
  }, [meta.title, meta.description, meta.path, meta.image, meta.type, meta.keywords?.join('|')]);
}
