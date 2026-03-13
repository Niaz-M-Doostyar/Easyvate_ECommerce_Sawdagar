"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
const Ctx = createContext({});
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchUser = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        const u = d.user || d;
        // Only accept admin/supplier roles in the admin panel
        if (u && ['admin', 'supplier'].includes(u.role)) {
          setUser(u);
        } else {
          setUser(null);
        }
      }
      else setUser(null);
    } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchUser(); }, [fetchUser]);
  const login = async (email, password) => {
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
    const d = await r.json();
    if (r.ok) { setUser(d.user); return { success: true, user: d.user }; }
    return { success: false, error: d.error || "Login failed" };
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };
  return <Ctx.Provider value={{ user, loading, login, logout, fetchUser }}>{children}</Ctx.Provider>;
}
