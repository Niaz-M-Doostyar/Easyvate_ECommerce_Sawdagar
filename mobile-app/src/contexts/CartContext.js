import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();
const GUEST_KEY = 'sawdagar_guest_cart';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const data = await cartApi.get();
        setItems(data.items || []);
      } else {
        const raw = await AsyncStorage.getItem(GUEST_KEY);
        setItems(raw ? JSON.parse(raw) : []);
      }
    } catch { setItems([]); }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const saveGuest = async (newItems) => {
    setItems(newItems);
    await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(newItems));
  };

  const addItem = async (product, qty = 1) => {
    if (user) {
      const data = await cartApi.add({ productId: product.id, quantity: qty });
      await fetchCart();
      return data;
    }
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      const updated = items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i);
      await saveGuest(updated);
    } else {
      await saveGuest([...items, { productId: product.id, quantity: qty, product }]);
    }
  };

  const updateQty = async (itemId, qty) => {
    if (user) {
      if (qty <= 0) await cartApi.remove(itemId);
      else await cartApi.update(itemId, { quantity: qty });
      await fetchCart();
    } else {
      if (qty <= 0) await saveGuest(items.filter(i => i.id !== itemId && i.productId !== itemId));
      else await saveGuest(items.map(i => (i.id === itemId || i.productId === itemId) ? { ...i, quantity: qty } : i));
    }
  };

  const removeItem = async (itemId) => updateQty(itemId, 0);

  const clearCart = async () => {
    if (user) await cartApi.clear();
    setItems([]);
    await AsyncStorage.removeItem(GUEST_KEY);
  };

  const total = items.reduce((s, i) => {
    const price = i.product?.retailPrice || i.product?.suggestedPrice || 0;
    return s + price * (i.quantity || 1);
  }, 0);

  const count = items.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ items, loading, addItem, updateQty, removeItem, clearCart, total, count, refresh: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
