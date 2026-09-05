/**
 * Sawdagar Mobile – Brand theme engine.
 * All built-in themes stay within the Sawdagar blue / ink palette.
 */
import { StyleSheet } from 'react-native';

const BRAND = {
  cobalt: '#2144C8',
  cobaltLight: '#3288F5',
  cobaltDark: '#17339B',
  ink: '#111317',
  slate: '#5F7984',
  paper: '#F4F7FB',
  cloud: '#D6E1E9',
  navy: '#0B1220',
  navySoft: '#121B2D',
};

function makeLightTheme(name, overrides = {}) {
  const primary = overrides.primary || BRAND.cobalt;
  const primaryLight = overrides.primaryLight || BRAND.cobaltLight;
  const primaryDark = overrides.primaryDark || BRAND.cobaltDark;

  return {
    name,
    dark: false,
    colors: {
      primary,
      primaryLight,
      primaryDark,
      secondary: overrides.secondary || BRAND.ink,
      accent: overrides.accent || BRAND.slate,
      background: overrides.background || BRAND.paper,
      surface: overrides.surface || '#FFFFFF',
      surfaceElevated: overrides.surfaceElevated || '#FCFDFF',
      card: overrides.card || '#FFFFFF',
      text: overrides.text || BRAND.ink,
      textSecondary: overrides.textSecondary || '#44515D',
      textMuted: overrides.textMuted || '#64748B',
      border: overrides.border || BRAND.cloud,
      borderLight: overrides.borderLight || '#EBF1F6',
      success: '#14B86A',
      warning: '#E8A33B',
      error: '#E35B5B',
      info: '#3288F5',
      gradientStart: overrides.gradientStart || '#2859D9',
      gradientEnd: overrides.gradientEnd || primaryDark,
      tabBar: overrides.tabBar || '#FFFFFF',
      tabBarBorder: overrides.tabBarBorder || BRAND.cloud,
      statusBar: overrides.statusBar || (overrides.background || BRAND.paper),
      overlay: 'rgba(12, 18, 32, 0.42)',
      skeleton: overrides.skeleton || '#DFE8EE',
      badge: '#E35B5B',
      star: '#E8A33B',
      inputBg: overrides.inputBg || '#FFFFFF',
      inputBorder: overrides.inputBorder || '#D2DDE6',
      placeholder: overrides.placeholder || '#64748B',
      headerBg: overrides.headerBg || (overrides.background || BRAND.paper),
      brandSurface: overrides.brandSurface || '#EAF0FF',
      brandSurfaceStrong: overrides.brandSurfaceStrong || '#DCE5FF',
      brandInk: BRAND.ink,
      brandSteel: BRAND.slate,
      // Text/surfaces rendered on top of the dark `secondary` hero blocks.
      // These are identical across all themes because hero blocks are always dark ink.
      heroText: '#FFFFFF',
      heroTextMuted: '#D6E5FF',
      heroSurface: 'rgba(255,255,255,0.08)',
      heroBorder: 'rgba(255,255,255,0.14)',
      white: '#FFFFFF',
      black: '#000000',
    },
  };
}

function makeDarkTheme(name, overrides = {}) {
  const primary = overrides.primary || BRAND.cobaltLight;
  const primaryLight = overrides.primaryLight || '#64A5FF';
  const primaryDark = overrides.primaryDark || BRAND.cobalt;

  return {
    name,
    dark: true,
    colors: {
      primary,
      primaryLight,
      primaryDark,
      secondary: overrides.secondary || '#0E1625',
      accent: overrides.accent || '#7E95A2',
      background: overrides.background || BRAND.navy,
      surface: overrides.surface || BRAND.navySoft,
      surfaceElevated: overrides.surfaceElevated || '#192336',
      card: overrides.card || '#131D2E',
      text: overrides.text || '#F5F7FB',
      textSecondary: overrides.textSecondary || '#C3CFD9',
      textMuted: overrides.textMuted || '#9BACBF',
      border: overrides.border || '#24344C',
      borderLight: overrides.borderLight || '#2D3E57',
      success: '#3DD38A',
      warning: '#F1B756',
      error: '#F27A7A',
      info: '#64A5FF',
      gradientStart: overrides.gradientStart || '#2A6DEA',
      gradientEnd: overrides.gradientEnd || BRAND.cobalt,
      tabBar: overrides.tabBar || '#111A2A',
      tabBarBorder: overrides.tabBarBorder || '#24344C',
      statusBar: overrides.statusBar || (overrides.background || BRAND.navy),
      overlay: 'rgba(0, 0, 0, 0.58)',
      skeleton: overrides.skeleton || '#23344B',
      badge: '#F27A7A',
      star: '#F1B756',
      inputBg: overrides.inputBg || '#172132',
      inputBorder: overrides.inputBorder || '#2A3A53',
      placeholder: overrides.placeholder || '#9BACBF',
      headerBg: overrides.headerBg || (overrides.background || BRAND.navy),
      brandSurface: overrides.brandSurface || 'rgba(50, 136, 245, 0.14)',
      brandSurfaceStrong: overrides.brandSurfaceStrong || 'rgba(50, 136, 245, 0.2)',
      brandInk: '#F5F7FB',
      brandSteel: '#AFC0CC',
      // Hero blocks stay dark ink in dark themes as well.
      heroText: '#FFFFFF',
      heroTextMuted: '#D6E5FF',
      heroSurface: 'rgba(255,255,255,0.08)',
      heroBorder: 'rgba(255,255,255,0.14)',
      white: '#FFFFFF',
      black: '#000000',
    },
  };
}

const T = {
  midnight: makeDarkTheme('Sawdagar Night'),
  ocean: makeLightTheme('Sawdagar Day'),
  emerald: makeLightTheme('Market Slate', {
    background: '#EEF3F7',
    surfaceElevated: '#F8FBFD',
    brandSurface: '#E5EEFF',
    brandSurfaceStrong: '#D8E5FF',
    border: '#D2DEE6',
    borderLight: '#E6EDF3',
    textSecondary: '#4B5D69',
    textMuted: '#627587',
  }),
  sunset: makeDarkTheme('Courier Blue', {
    background: '#0F1726',
    surface: '#152033',
    surfaceElevated: '#1B2940',
    card: '#172337',
    gradientStart: '#3A7CF4',
    gradientEnd: '#1A40A8',
    border: '#2A3B56',
    borderLight: '#344760',
  }),
  rose: makeLightTheme('Paper Blue', {
    background: '#FBFCFE',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    brandSurface: '#F0F5FF',
    brandSurfaceStrong: '#E2EBFF',
    border: '#DCE5EC',
    borderLight: '#EEF3F7',
    inputBg: '#FDFEFF',
  }),
};

export const DEFAULT_THEME_KEY = 'ocean';
export function hasTheme(key) {
  return Object.prototype.hasOwnProperty.call(T, key);
}

function withThemeMeta(key, theme) {
  return {
    key,
    ...theme,
    mode: theme.dark ? 'dark' : 'light',
  };
}

export function getTheme(key) {
  const resolvedKey = hasTheme(key) ? key : DEFAULT_THEME_KEY;
  return withThemeMeta(resolvedKey, T[resolvedKey]);
}

export function getAllThemes() {
  return Object.entries(T).map(([key, theme]) => withThemeMeta(key, theme));
}

export const spacing = { xs:4, sm:8, md:12, base:16, lg:20, xl:24, xxl:32, xxxl:48 };
export const fontSize = { xs:11, sm:13, base:15, md:17, lg:20, xl:24, xxl:30, xxxl:36, hero:42 };
export const fontWeight = { regular:'400', medium:'500', semibold:'600', bold:'700', heavy:'800' };
export const borderRadius = { xs:4, sm:8, md:12, lg:18, xl:24, xxl:30, full:999 };
export const shadows = {
  sm: { shadowColor:'#0B1220', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:4, elevation:1 },
  md: { shadowColor:'#0B1220', shadowOffset:{width:0,height:4}, shadowOpacity:0.06, shadowRadius:12, elevation:3 },
  lg: { shadowColor:'#0B1220', shadowOffset:{width:0,height:8}, shadowOpacity:0.09, shadowRadius:20, elevation:5 },
  xl: { shadowColor:'#0B1220', shadowOffset:{width:0,height:14}, shadowOpacity:0.12, shadowRadius:28, elevation:9 },
};

/** Standard hairline separator width used between list rows. */
export const hairline = StyleSheet.hairlineWidth;
