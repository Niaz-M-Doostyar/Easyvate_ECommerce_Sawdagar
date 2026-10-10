const PREFIX = 'sawdagar.public-home.v1.';
const MAX_AGE = 24 * 60 * 60 * 1000;
const SECTIONS = ['categories', 'products', 'site'];

export async function readHomeCache(storage, now = Date.now()) {
  const result = {};
  await Promise.all(SECTIONS.map(async section => {
    try {
      const value = JSON.parse(await storage.getItem(PREFIX + section));
      if (!value || !Number.isFinite(value.savedAt) || now - value.savedAt > MAX_AGE || value.savedAt > now) return;
      if (section === 'site' ? value.data && typeof value.data === 'object' && !Array.isArray(value.data) : Array.isArray(value.data)) {
        result[section] = value.data;
      }
    } catch { /* Corrupt or unavailable storage must not block the live catalog. */ }
  }));
  return result;
}

export async function writeHomeCache(storage, section, data, now = Date.now()) {
  if (!SECTIONS.includes(section)) return;
  try {
    await storage.setItem(PREFIX + section, JSON.stringify({ savedAt: now, data }));
  } catch { /* Storage exhaustion must not prevent shopping. */ }
}
