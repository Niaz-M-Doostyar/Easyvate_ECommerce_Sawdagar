export function safeJsonParse(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value !== 'string') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return fallback;
    }
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
