import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const TOKEN_KEY = 'sawdagar_token';
const USER_KEY = 'sawdagar_user';
let _token = null;

export async function getToken() {
  if (_token) return _token;
  _token = await AsyncStorage.getItem(TOKEN_KEY);
  return _token;
}
export async function setToken(t) { _token = t; if (t) await AsyncStorage.setItem(TOKEN_KEY, t); else await AsyncStorage.removeItem(TOKEN_KEY); }
export async function getStoredUser() {
  const value = await AsyncStorage.getItem(USER_KEY);
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}
export async function setStoredUser(user) {
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(USER_KEY);
}

function toQueryString(params) {
  if (!params) return '';
  if (typeof params === 'string') return params.replace(/^\?/, '');
  if (params instanceof URLSearchParams) return params.toString();

  const normalized = { ...params };
  if (normalized.categoryId != null && normalized.category == null) {
    normalized.category = normalized.categoryId;
  }
  delete normalized.categoryId;

  const searchParams = new URLSearchParams();
  Object.entries(normalized).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });

  return searchParams.toString();
}

function withQuery(path, params) {
  const query = toQueryString(params);
  return query ? `${path}?${query}` : path;
}

async function request(path, opts = {}) {
  const token = await getToken();
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (p) => request(p, { method: 'DELETE' }),
};

// Auth
export const authApi = {
  login: (d) => api.post('/api/auth/login', d),
  register: (d) => api.post('/api/auth/register', d),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout', {}),
  deleteAccount: () => api.del('/api/auth/account'),
  forgotPassword: (d) => api.post('/api/auth/forgot-password', d),
  resetPassword: (d) => api.post('/api/auth/reset-password', d),
  updateProfile: (d) => api.put('/api/auth/profile', d),
  changePassword: (d) => api.put('/api/auth/change-password', d),
};

// Products
export const productsApi = {
  list: (params) => api.get(withQuery('/api/products', params)),
  get: (id) => api.get(`/api/products/${id}`),
  sponsored: () => api.get('/api/products/sponsored'),
  search: (params) => api.get(withQuery('/api/products/search', typeof params === 'string' ? { q: params } : params)),
};

// Categories
export const categoriesApi = {
  list: () => api.get('/api/categories'),
};

// Cart
export const cartApi = {
  get: () => api.get('/api/cart'),
  add: (d) => api.post('/api/cart', d),
  update: (id, d) => api.put(`/api/cart/${id}`, d),
  remove: (id) => api.del(`/api/cart/${id}`),
  clear: () => api.del('/api/cart'),
};

// Orders
export const ordersApi = {
  list: (params) => api.get(withQuery('/api/orders', params)),
  get: (id) => api.get(`/api/orders/${id}`),
  create: (d) => api.post('/api/orders', d),
  tracking: (id) => api.get(`/api/orders/${id}/tracking`),
};

// Site Content
export const siteApi = {
  content: () => api.get('/api/site-content'),
  contact: (d) => api.post('/api/site-content/contact', d),
};

// Blog
export const blogApi = {
  list: (params) => api.get(withQuery('/api/blog', params)),
  get: (slug) => api.get(`/api/blog/${slug}`),
};

// Subscribe
export const subscribeApi = {
  subscribe: (d) => api.post('/api/subscribe', d),
  validateCoupon: (d) => api.post('/api/subscribe/validate-coupon', typeof d === 'string' ? { code: d } : d),
};

// Supplier
export const supplierApi = {
  products: (params) => api.get(withQuery('/api/supplier/products', params)),
  getProduct: (id) => api.get(`/api/supplier/products/${id}`),
  createProduct: (d) => api.post('/api/supplier/products', d),
  updateProduct: (id, d) => api.put(`/api/supplier/products/${id}`, d),
  deleteProduct: (id) => api.del(`/api/supplier/products/${id}`),
  orders: (params) => api.get(withQuery('/api/supplier/orders', params)),
  sponsorships: () => api.get('/api/supplier/sponsorships'),
  requestSponsorship: (d) => api.post('/api/supplier/sponsorships', d),
};

supplierApi.myProducts = supplierApi.products;
supplierApi.myOrders = supplierApi.orders;

// Delivery
export const deliveryApi = {
  orders: (params) => api.get(withQuery('/api/delivery/orders', params)),
  updateOrder: (id, d) => api.put(`/api/delivery/orders/${id}`, d),
  shareLocation: (d) => api.post('/api/delivery/location', d),
};

export default api;

// Upload helpers (use FormData to send files)
function extensionForMime(type) {
  const mime = String(type || '').toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('heic')) return 'heic';
  if (mime.includes('heif')) return 'heif';
  return 'jpg';
}

function normalizeUploadFile(file, fallbackName) {
  const uri = typeof file === 'string' ? file : file?.uri;
  if (!uri) throw new Error('Selected image is missing a file URI');

  const type = file?.type || 'image/jpeg';
  const rawName = file?.fileName || file?.name || fallbackName || `photo.${extensionForMime(type)}`;
  const hasExtension = /\.[a-z0-9]+$/i.test(rawName);
  const name = hasExtension ? rawName : `${rawName}.${extensionForMime(type)}`;

  return { uri, name, type };
}

export const uploadApi = {
  single: async (file) => {
    const token = await getToken();
    const form = new FormData();
    form.append('file', normalizeUploadFile(file, 'photo.jpg'));

    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || data.message || `Upload failed (${res.status})`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  },
  multiple: async (files) => {
    const token = await getToken();
    const form = new FormData();
    files.forEach((file, idx) => {
      form.append('files', normalizeUploadFile(file, `photo_${idx}.jpg`));
    });

    const res = await fetch(`${API_URL}/api/upload/multiple`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.error || data.message || `Upload failed (${res.status})`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  },
};
