import { Platform } from 'react-native';

const VPS_ENDPOINTS = {
  api: 'https://sawdagaraf.com',
  website: 'https://sawdagaraf.com',
  admin: 'https://sawdagaraf.com/sawdagar-admin',
};

const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

// Default to the online Sawdagar API. To use a local backend during development,
// change this to `LOCAL_API_URL` or implement an env/config toggle.
export const API_URL = VPS_ENDPOINTS.api;
export const WEBSITE_URL = VPS_ENDPOINTS.website;
export const ADMIN_PORTAL_URL = VPS_ENDPOINTS.admin;
export const CURRENCY_SYMBOL = '؋';
export const CURRENCY_CODE = 'AFN';

export function resolvePortalUrl(baseUrl, initialPath = '/') {
  if (!initialPath) return baseUrl;
  if (/^https?:\/\//i.test(initialPath)) return initialPath;

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = initialPath.startsWith('/') ? initialPath : `/${initialPath}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function formatPrice(price) {
  if (price == null || isNaN(price)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${Number(price).toLocaleString()}`;
}

function extractImageValue(src) {
  if (!src) return null;

  if (typeof src === 'object') {
    if (src.uri) return extractImageValue(src.uri);
    if (src.url) return extractImageValue(src.url);
    if (src.path) return extractImageValue(src.path);
    if (src.image) return extractImageValue(src.image);
    if (src.src) return extractImageValue(src.src);
    return null;
  }

  return typeof src === 'string' ? src : null;
}

export function buildImageUriCandidates(src) {
  const rawValue = extractImageValue(src);
  if (!rawValue) return [];

  const normalizedValue = rawValue.trim().replace(/\\/g, '/');
  if (!normalizedValue) return [];

  const candidates = [];
  const push = (value) => {
    if (!value || candidates.includes(value)) return;
    candidates.push(value);
  };

  const uploadMatch = normalizedValue.match(/\/uploads\/[^?#]+/i) || normalizedValue.match(/^uploads\/[^?#]+/i);
  if (uploadMatch) {
    const uploadPath = uploadMatch[0].startsWith('/') ? uploadMatch[0] : `/${uploadMatch[0]}`;
    push(`${API_URL}${uploadPath}`);
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    push(normalizedValue);
    return candidates;
  }

  const relativePath = normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue.replace(/^\.\//, '')}`;
  push(`${API_URL}${relativePath}`);
  return candidates;
}

export function optimizedImageUri(src) {
  return buildImageUriCandidates(src)[0] || null;
}
