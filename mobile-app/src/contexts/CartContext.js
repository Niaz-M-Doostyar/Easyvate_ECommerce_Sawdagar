import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cart as cartApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const data = await cartApi.get();
      setItems(data.items || data.cart || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  async function addToCart(productId, quantity = 1) {
    const data = await cartApi.add(productId, quantity);
    await fetchCart();
    return data;
  }

  async function updateQuantity(itemId, quantity) {
    await cartApi.update(itemId, quantity);
    await fetchCart();
  }

  async function removeItem(itemId) {
    await cartApi.remove(itemId);
    await fetchCart();
  }

  async function clearCart() {
    await cartApi.clear();
    setItems([]);
  }

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const total = items.reduce((sum, item) => {
    const price = item.product?.retailPrice || item.product?.suggestedPrice || 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider value={{ items, loading, itemCount, total, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
