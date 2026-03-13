"use client";
import { createContext, useContext, useState, useCallback } from "react";
const Ctx = createContext({});
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const success = useCallback((m) => add(m, "success"), [add]);
  const error = useCallback((m) => add(m, "error"), [add]);
  const info = useCallback((m) => add(m, "info"), [add]);
  return (
    <Ctx.Provider value={{ success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-[fadeIn_.2s] ${t.type === "success" ? "bg-green" : t.type === "error" ? "bg-red" : "bg-primary"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
