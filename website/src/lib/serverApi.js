const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

export async function fetchPublicJson(path, fallback, init = {}) {
  const targetPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${targetPath}`;

  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: { Accept: 'application/json', ...(init.headers || {}) },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Public API fetch failed for ${url}:`, error?.message || error);
    return fallback;
  }
}
