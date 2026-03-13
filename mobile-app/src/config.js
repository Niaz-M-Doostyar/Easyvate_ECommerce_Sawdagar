import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to access host machine's localhost
// iOS simulator can use localhost directly
const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  ios: 'http://localhost:4000',
  default: 'http://localhost:4000',
});

export const API_URL = __DEV__ ? DEV_API_URL : 'https://api.sawdagar.com';
export const CURRENCY_SYMBOL = '؋';

export function formatPrice(price) {
  if (price == null || isNaN(price)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${Number(price).toLocaleString()}`;
}

/**
 * Build an optimized image URI via /api/image endpoint.
 * For upload paths, returns WebP resized version. Others pass through.
 */
export function optimizedImageUri(src, { width = 400, quality = 75 } = {}) {
  if (!src) return null;
  const full = src.startsWith('http') ? src : `${API_URL}${src}`;
  // Only optimize /uploads/ images
  if (src.startsWith('/uploads/')) {
    return `${API_URL}/api/image?src=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }
  return full;
}
