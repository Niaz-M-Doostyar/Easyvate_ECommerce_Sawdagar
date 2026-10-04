// Width refers to the usable window, including iPad Split View and rotation.
export function responsiveLayout(windowWidth, fontScale = 1) {
  const width = Math.min(1200, Math.max(0, windowWidth));
  const isTablet = width >= 700;
  const gutter = width < 360 ? 12 : isTablet ? 24 : 16;
  const minimumCard = 160 * Math.min(1.6, Math.max(1, fontScale));
  const columns = Math.max(1, Math.min(5, Math.floor((width - gutter * 2) / minimumCard)));
  return { width, isTablet, gutter, columns, cardWidth: Math.max(0, (width - gutter * 2) / columns - 12) };
}
