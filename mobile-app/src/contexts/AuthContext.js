import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await auth.getToken();
      if (token) {
        const data = await auth.getMe();
        setUser(data.user);
      }
    } catch {
      await auth.removeToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await auth.login(email, password);
    await auth.setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(formData) {
    const data = await auth.register(formData);
    return data;
  }

  async function logout() {
    await auth.removeToken();
    setUser(null);
  }

  async function updateProfile(data) {
    const result = await auth.updateProfile(data);
    if (result.user) setUser(result.user);
    return result;
  }

  async function refreshUser() {
    try {
      const data = await auth.getMe();
      setUser(data.user);
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
