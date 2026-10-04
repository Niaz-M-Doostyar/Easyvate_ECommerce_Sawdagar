// Use the actual window width so iPad Split View behaves like a smaller screen.
// Reserve three rows for loading placeholders; the collection can be longer.
// Larger text reduces columns first.
export function featuredLayout(windowWidth, fontScale = 1) {
  const width = Math.min(1200, Math.max(0, Number.isFinite(windowWidth) ? windowWidth : 0));
  const scale = Math.max(1, Number.isFinite(fontScale) ? fontScale : 1);
  const isTablet = width >= 700;
  const gutter = Math.min(width / 2, width < 360 ? 12 : isTablet ? 24 : 16);
  const gap = isTablet ? 10 : 8;
  const availableWidth = Math.max(0, width - gutter * 2);
  const minimumCard = isTablet
    ? 140 * scale
    : Math.max(104 * scale, scale > 1.2 ? 140 : 104);
  const maximumColumns = isTablet ? 6 : 3;
  const columns = Math.max(1, Math.min(maximumColumns, Math.floor((availableWidth + gap) / (minimumCard + gap))));
  const cardWidth = Math.max(0, (availableWidth - gap * (columns - 1)) / columns);

  return { width, isTablet, columns, cardWidth, gutter, gap, placeholderCount: columns * 3 };
}
