import staticImageVariants from '@/data/staticImageVariants.json';

const FALLBACK_PRODUCT_IMAGE = '/assets/img/product/e1.png';
// Keep these in sync with backend/routes/image.js so srcSet describes the
// dimensions the server actually produces, with one URL per cached variant.
const IMAGE_WIDTHS = [80, 160, 280, 320, 420, 500, 560, 700, 760, 800, 1200];
const IMAGE_QUALITIES = [60, 75, 85];
const UPLOAD_HOSTS = new Set(['sawdagar.com', 'www.sawdagar.com']);

export function normalizeImageUrl(image) {
  const source = typeof image === 'string' ? image : image?.url || image?.src || image?.image;
  if (typeof source !== 'string' || !source.trim()) return FALLBACK_PRODUCT_IMAGE;
  const src = source.trim();

  if (/^(?:https?:)?\/\//i.test(src)) {
    try {
      const url = new URL(src, 'https://sawdagar.com');
      if (UPLOAD_HOSTS.has(url.hostname) && !url.port && !url.username && !url.password && url.pathname.startsWith('/uploads/')) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch { /* Leave an unrecognized external source unchanged. */ }
    return src;
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(src) || src.startsWith('/')) return src;
  return `/${src}`;
}

function uploadSource(normalized) {
  if (!normalized.startsWith('/uploads/')) return null;
  try {
    const url = new URL(normalized, 'https://sawdagar.com');
    const pathname = decodeURIComponent(url.pathname);
    // The image route accepts only an upload filename, never its query/hash.
    if (!pathname.startsWith('/uploads/') || pathname.includes('..') || /[\\\0]/.test(pathname) || pathname.slice(9).startsWith('.')) return null;
    return { pathname, version: url.searchParams.toString() };
  } catch { return null; }
}

function nearestAllowed(value, allowed, fallback) {
  const requested = Number(value);
  if (!Number.isFinite(requested) || requested <= 0) return fallback;
  return allowed.reduce((nearest, current) => (
    Math.abs(current - requested) < Math.abs(nearest - requested) ? current : nearest
  ), allowed[0]);
}

function variantUrl(upload, width, quality, lossless) {
  const params = new URLSearchParams({ src: upload.pathname, w: String(width) });
  if (lossless) params.set('lossless', '1');
  else params.set('q', String(nearestAllowed(quality, IMAGE_QUALITIES, 75)));
  // Retain explicit source versioning without passing it as part of a filename.
  if (upload.version) params.set('v', upload.version);
  return `/api/image?${params.toString()}`;
}

function staticVariants(normalized, widths) {
  if (!normalized.startsWith('/') || normalized.startsWith('//')) return null;
  const available = staticImageVariants[normalized.split(/[?#]/, 1)[0]];
  if (!Array.isArray(available) || !available.length) return null;
  const sorted = [...available].sort((a, b) => a.width - b.width);
  return [...new Map(widths.map(width => {
    const candidate = sorted.find(item => item.width >= width) || sorted[sorted.length - 1];
    return [candidate.width, candidate];
  })).values()].sort((a, b) => a.width - b.width);
}

export function optimizedImageUrl(src, { width = 700, quality = 75, lossless = true } = {}) {
  const normalized = normalizeImageUrl(src);
  const upload = uploadSource(normalized);
  if (!upload) return staticVariants(normalized, [width])?.[0].src || normalized;
  return variantUrl(upload, nearestAllowed(width, IMAGE_WIDTHS, 700), quality, lossless);
}

/** Lossless display derivatives leave uploaded originals available for zoom. */
export function responsiveImage(src, { widths = [320, 560, 800], quality = 75, lossless = true, sizes = '(max-width: 576px) 90vw, (max-width: 992px) 45vw, 280px' } = {}) {
  const normalized = normalizeImageUrl(src);
  const upload = uploadSource(normalized);
  const requestedWidths = Array.isArray(widths) && widths.length ? widths : [320, 560, 800];
  if (!upload) {
    const variants = staticVariants(normalized, requestedWidths);
    return variants ? {
      src: variants[Math.min(1, variants.length - 1)].src,
      srcSet: variants.map(item => `${item.src} ${item.width}w`).join(', '),
      sizes,
    } : { src: normalized, srcSet: undefined, sizes: undefined };
  }

  const candidates = [...new Set(requestedWidths
    .map(width => nearestAllowed(width, IMAGE_WIDTHS, 560)))].sort((a, b) => a - b);
  return {
    src: variantUrl(upload, candidates[Math.min(1, candidates.length - 1)], quality, lossless),
    srcSet: candidates.map(width => `${variantUrl(upload, width, quality, lossless)} ${width}w`).join(', '),
    sizes,
  };
}

export { FALLBACK_PRODUCT_IMAGE };
