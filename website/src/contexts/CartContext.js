'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, authHeaders } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'sawdagar_cart_v2';
const GUEST_CART_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function sanitizeGuestItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const merged = new Map();
  for (const item of rawItems) {
    const productId = Number(item?.productId || item?.id);
    const quantity = Number(item?.quantity || 0);
    if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    const existing = merged.get(productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      merged.set(productId, {
        productId,
        quantity,
        retailPrice: Number(item?.retailPrice || 0),
        nameEn: item?.nameEn || '',
        image: item?.image || '',
      });
    }
  }

  return Array.from(merged.values());
}

function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      const legacy = localStorage.getItem('sawdagar_cart');
      if (!legacy) return [];
      const migrated = sanitizeGuestItems(JSON.parse(legacy));
      localStorage.removeItem('sawdagar_cart');
      writeGuestCart(migrated);
      return migrated;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    if (!parsed.updatedAt || Date.now() - parsed.updatedAt > GUEST_CART_TTL_MS) {
      localStorage.removeItem(GUEST_CART_KEY);
      return [];
    }

    return sanitizeGuestItems(parsed.items);
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  const cleaned = sanitizeGuestItems(items);
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify({
    version: 2,
    updatedAt: Date.now(),
    items: cleaned,
  }));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      const localItems = readGuestCart();
      setItems(localItems);
      return;
    }
    // User is logged in — clear any guest cart to prevent ghost items
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem('sawdagar_cart');
    setLoading(true);
    try {
      const res = await fetch('/api/cart', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch {
      console.error('Failed to fetch cart');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === GUEST_CART_KEY && !user) {
        setItems(readGuestCart());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      let productData = null;
      try {
        const pRes = await fetch(`/api/products/${productId}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          productData = pData.product || pData;
        }
      } catch {}

      const existing = items.find((i) => i.productId === productId);
      let updated;
      if (existing) {
        updated = items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i));
      } else {
        updated = [...items, {
          productId,
          quantity,
          retailPrice: productData?.retailPrice || 0,
          nameEn: productData?.nameEn || '',
          image: productData?.images?.[0]?.url || '',
        }];
      }
      setItems(updated);
      writeGuestCart(updated);
      return { success: true };
    }
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.ok) {
      await fetchCart();
      return { success: true };
    }
    const data = await res.json();
    return { success: false, error: data.error };
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!user) {
      const updated = items.map((i) => (i.productId === itemId ? { ...i, quantity } : i));
      setItems(updated);
      writeGuestCart(updated);
      return { success: true };
    }
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) {
      await fetchCart();
      return { success: true };
    }
    return { success: false };
  };

  const removeFromCart = async (itemId) => {
    if (!user) {
      const updated = items.filter((i) => i.productId !== itemId);
      setItems(updated);
      writeGuestCart(updated);
      return { success: true };
    }
    const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) {
      await fetchCart();
      return { success: true };
    }
    return { success: false };
  };

  const clearCart = async () => {
    if (!user) {
      setItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }
    await fetch('/api/cart', { method: 'DELETE', headers: authHeaders() });
    setItems([]);
  };

  const cartCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const cartTotal = items.reduce((sum, i) => {
    const price = i.product?.retailPrice || i.retailPrice || 0;
    return sum + price * (i.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider value={{ items, loading, cartCount, cartTotal, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

export default CartContext;
