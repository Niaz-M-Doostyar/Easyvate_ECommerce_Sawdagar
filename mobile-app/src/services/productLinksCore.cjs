const HOST = '(?:www\\.)?sawdagar\\.com';
const ID = '([A-Za-z0-9_-]{1,128})';
function normalizeProductLink(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  const match = value.trim().match(new RegExp(`^(?:https://${HOST}/(?:share/)?products/|sawdagar://products/)${ID}(?:[?#].*)?$`, 'i'));
  return match ? `sawdagar://products/${match[1]}` : null;
}
function referrerProductLink(referrer) {
  if (typeof referrer !== 'string' || referrer.length > 4096) return null;
  try {
    const values = referrer.split('&').map(part => part.split('='));
    const ids = values.filter(([key]) => decodeURIComponent(key) === 'sawdagar_product');
    if (ids.length !== 1) return null;
    return normalizeProductLink(`sawdagar://products/${decodeURIComponent(ids[0][1] || '')}`);
  } catch { return null; }
}
function copiedProductLink(value, now = Date.now()) {
  const link = normalizeProductLink(value);
  if (!link) return null;
  // Only our explicit Copy & install flow should be restored on first launch.
  // Reject stale clipboard contents, arbitrary text and links from other apps.
  const match = value.match(/[?&]sawdagar_install=(\d{13})(?:&|$)/);
  if (!match) return null;
  const age = now - Number(match[1]);
  return age >= -300000 && age <= 7 * 86400000 ? link : null;
}
module.exports = { normalizeProductLink, referrerProductLink, copiedProductLink };
