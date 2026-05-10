import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setToken, getToken } from '../services/api';

const AuthContext = createContext();

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    name: user.name || user.fullName || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const t = await getToken();
      if (!t) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await authApi.me();
      setUser(normalizeUser(data.user));
    } catch { await setToken(null); setUser(null); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    await setToken(data.token);
    setUser(normalizeUser(data.user));
    return data;
  };

  const register = async (body) => {
    const payload = {
      ...body,
      fullName: body.fullName || body.name,
    };
    delete payload.name;
    const data = await authApi.register(payload);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    await clearSession();
  };

  const deleteAccount = async () => {
    const data = await authApi.deleteAccount();
    await clearSession();
    return data;
  };

  const updateProfile = async (body) => {
    const payload = {
      ...body,
      fullName: body.fullName || body.name,
    };
    delete payload.name;
    const data = await authApi.updateProfile(payload);
    if (data.user) setUser(prev => normalizeUser({ ...prev, ...data.user }));
    return data;
  };

  const changePassword = async (body) => {
    return authApi.changePassword(body);
  };

  const syncToken = useCallback(async (nextToken) => {
    if (!nextToken) {
      await clearSession();
      return;
    }

    await setToken(nextToken);
    await fetchMe();
  }, [clearSession, fetchMe]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      deleteAccount,
      updateProfile,
      changePassword,
      refresh: fetchMe,
      syncToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
