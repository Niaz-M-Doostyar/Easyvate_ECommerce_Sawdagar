'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext(null);

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', dir: 'rtl' },
  { code: 'dr', name: 'Dari', nativeName: 'دری', dir: 'rtl' },
];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [translations, setTranslations] = useState({});
  const [dir, setDir] = useState('ltr');

  const loadTranslations = useCallback(async (code) => {
    try {
      const res = await fetch(`/locales/${code}/common.json`);
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
      }
    } catch {
      console.error('Failed to load translations');
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sawdagar_lang') || 'en';
    setLang(saved);
    const langObj = LANGUAGES.find((l) => l.code === saved);
    setDir(langObj?.dir || 'ltr');
    loadTranslations(saved);
  }, [loadTranslations]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const switchLanguage = (code) => {
    setLang(code);
    localStorage.setItem('sawdagar_lang', code);
    const langObj = LANGUAGES.find((l) => l.code === code);
    setDir(langObj?.dir || 'ltr');
    loadTranslations(code);
  };

  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, t, switchLanguage, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

export default LanguageContext;
