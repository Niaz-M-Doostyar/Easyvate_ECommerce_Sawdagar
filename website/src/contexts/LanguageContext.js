'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enTranslations from '../../public/locales/en/common.json';
import psTranslations from '../../public/locales/ps/common.json';
import drTranslations from '../../public/locales/dr/common.json';

const LanguageContext = createContext(null);

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', dir: 'rtl' },
  { code: 'dr', name: 'Dari', nativeName: 'دری', dir: 'rtl' },
];

const TRANSLATIONS = {
  en: enTranslations,
  ps: psTranslations,
  dr: drTranslations,
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [translations, setTranslations] = useState(enTranslations);
  const [dir, setDir] = useState('ltr');

  const loadTranslations = useCallback(async (code) => {
    setTranslations(TRANSLATIONS[code] || enTranslations);
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

  const t = (key, fallback) => {
    return translations[key] || enTranslations[key] || fallback || '';
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
