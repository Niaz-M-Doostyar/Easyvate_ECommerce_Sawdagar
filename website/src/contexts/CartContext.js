'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, authHeaders } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      const local = localStorage.getItem('sawdagar_cart');
      setItems(local ? JSON.parse(local) : []);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/cart', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      console.error('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

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
      localStorage.setItem('sawdagar_cart', JSON.stringify(updated));
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
      localStorage.setItem('sawdagar_cart', JSON.stringify(updated));
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
      localStorage.setItem('sawdagar_cart', JSON.stringify(updated));
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
      localStorage.removeItem('sawdagar_cart');
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
