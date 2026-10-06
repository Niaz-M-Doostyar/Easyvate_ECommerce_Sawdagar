import { responsiveLayout } from './responsiveLayout';

// Shop keeps the full catalogue card and its two 44pt actions. Use three
// columns on normal phones, then give cards more room as text grows.
export function shopLayout(windowWidth, fontScale = 1) {
  const width = Math.min(1200, Math.max(0, Number.isFinite(windowWidth) ? windowWidth : 0));
  const scale = Math.max(1, Number.isFinite(fontScale) ? fontScale : 1);
  const isTablet = width >= 700;
  // Keep the tablet catalogue's existing sizing and six-point card margins.
  if (isTablet) return { ...responsiveLayout(width, scale), gap: 12 };

  const gutter = Math.min(width / 2, width < 360 ? 12 : 16);
  const gap = 8;
  const availableWidth = Math.max(0, width - gutter * 2);
  const minimumCard = Math.max(106 * scale, scale > 1.2 ? 140 : 106);
  const columns = Math.max(1, Math.min(3, Math.floor((availableWidth + gap) / (minimumCard + gap))));
  const cardWidth = Math.max(0, (availableWidth - gap * (columns - 1)) / columns);

  return { width, isTablet, columns, cardWidth, gutter, gap };
}
