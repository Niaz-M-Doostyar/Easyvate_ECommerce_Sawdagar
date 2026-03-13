import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const TOKEN_KEY = 'sawdagar_token';

async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function setToken(token) {
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

async function removeToken() {
  return AsyncStorage.removeItem(TOKEN_KEY);
}

async function request(endpoint, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_URL}/api${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Auth
export const auth = {
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  setToken,
  getToken,
  removeToken,
};

// Products
export const products = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products?${qs}`);
  },
  get: (id) => request(`/products/${id}`),
  search: (query, limit = 20) => request(`/products?search=${encodeURIComponent(query)}&limit=${limit}`),
  sponsored: () => request('/products/sponsored'),
};

// Categories
export const categories = {
  list: () => request('/categories'),
};

// Cart
export const cart = {
  get: () => request('/cart'),
  add: (productId, quantity = 1) => request('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  }),
  update: (id, quantity) => request(`/cart/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  }),
  remove: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
  clear: () => request('/cart', { method: 'DELETE' }),
};

// Orders
export const orders = {
  list: (page = 1) => request(`/orders?page=${page}`),
  get: (id) => request(`/orders/${id}`),
  create: (data) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  tracking: (id) => request(`/orders/${id}/tracking`),
};

// Site Content
export const siteContent = {
  get: () => request('/site-content'),
  contact: (data) => request('/site-content/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
