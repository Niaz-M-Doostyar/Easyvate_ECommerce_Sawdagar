import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, getAllThemes, DEFAULT_THEME_KEY, hasTheme } from '../theme';
import { siteApi } from '../services/api';

const ThemeContext = createContext();
const STORAGE_KEY = 'sawdagar_theme';

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const theme = getTheme(themeKey);
  const allThemes = getAllThemes();

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && hasTheme(saved)) setThemeKey(saved);
      try {
        const data = await siteApi.content();
        const mobile = data?.mobileTheme || data?.content?.mobileTheme;
        if (mobile?.activeTheme && hasTheme(mobile.activeTheme)) {
          setThemeKey(mobile.activeTheme);
          await AsyncStorage.setItem(STORAGE_KEY, mobile.activeTheme);
        }
      } catch {}
    })();
  }, []);

  const switchTheme = async (key) => {
    if (hasTheme(key)) {
      setThemeKey(key);
      await AsyncStorage.setItem(STORAGE_KEY, key);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeKey, switchTheme, allThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
