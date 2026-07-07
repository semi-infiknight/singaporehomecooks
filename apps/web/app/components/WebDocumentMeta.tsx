'use client';

import { useEffect } from 'react';
import { useShcI18n, getWebLayoutCopy } from '@shc/i18n';

function setMetaContent(selector: string, content: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', content);
}

export function WebDocumentMeta() {
  const { locale } = useShcI18n();
  const layout = getWebLayoutCopy(locale);

  useEffect(() => {
    document.title = layout.metaTitle;
    setMetaContent('meta[name="description"]', layout.metaDescription);
    setMetaContent('meta[property="og:title"]', layout.metaOgTitle);
    setMetaContent('meta[property="og:description"]', layout.metaOgDescription);
    setMetaContent('meta[name="apple-mobile-web-app-title"]', layout.pwaShortName);
  }, [layout]);

  return null;
}
