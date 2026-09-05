'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SiteDataContext = createContext();

export function SiteDataProvider({ children, initialCategories = [], initialSiteContent = null }) {
  const hasInitialData = initialCategories.length > 0 || initialSiteContent !== null;
  const [categories, setCategories] = useState(initialCategories);
  const [siteContent, setSiteContent] = useState(initialSiteContent);
  const [loaded, setLoaded] = useState(hasInitialData);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/categories', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      fetch('/api/site-content', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    ]).then(([catData, siteData]) => {
      if (cancelled) return;
      const hasCategoryPayload = Array.isArray(catData?.categories) || Array.isArray(catData);
      const cats = Array.isArray(catData?.categories)
        ? catData.categories
        : Array.isArray(catData) ? catData : [];
      if (hasCategoryPayload) setCategories(cats);
      if (siteData?.content) setSiteContent(siteData.content);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const getName = useCallback((item, lang) => {
    if (!item) return '';
    if (lang === 'ps' && item.namePs) return item.namePs;
    if (lang === 'dr' && item.nameDr) return item.nameDr;
    return item.nameEn || '';
  }, []);

  return (
    <SiteDataContext.Provider value={{ categories, siteContent, loaded, getName }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used within SiteDataProvider');
  return ctx;
}
