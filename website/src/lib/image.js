const FALLBACK_PRODUCT_IMAGE = '/assets/img/product/e1.png';

export function normalizeImageUrl(src) {
  if (!src) return FALLBACK_PRODUCT_IMAGE;
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return src;
  return `/${src}`;
}

export function optimizedImageUrl(src, { width = 700, quality = 75 } = {}) {
  const normalized = normalizeImageUrl(src);

  // Only optimize backend uploads. Keep static theme assets as-is.
  if (!normalized.startsWith('/uploads/')) {
    return normalized;
  }

  const params = new URLSearchParams({ src: normalized, w: String(width), q: String(quality) });
  return `/api/image?${params.toString()}`;
}

/**
 * Generate srcSet string for responsive images.
 * Returns { src, srcSet, sizes } for use in <img> elements.
 */
export function responsiveImage(src, { widths = [320, 560, 800], quality = 75, sizes = '(max-width: 576px) 90vw, (max-width: 992px) 45vw, 280px' } = {}) {
  const normalized = normalizeImageUrl(src);

  if (!normalized.startsWith('/uploads/')) {
    return { src: normalized, srcSet: undefined, sizes: undefined };
  }

  const srcSet = widths
    .map(w => {
      const params = new URLSearchParams({ src: normalized, w: String(w), q: String(quality) });
      return `/api/image?${params.toString()} ${w}w`;
    })
    .join(', ');

  return {
    src: optimizedImageUrl(src, { width: widths[1] || 560, quality }),
    srcSet,
    sizes,
  };
}

export { FALLBACK_PRODUCT_IMAGE };
