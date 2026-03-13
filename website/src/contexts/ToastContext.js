'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = (msg) => addToast(msg, 'success');
  const error = (msg) => addToast(msg, 'error');
  const info = (msg) => addToast(msg, 'info');
  const warning = (msg) => addToast(msg, 'warning');

  const typeStyles = {
    success: 'bg-white border-l-4 border-l-green-500 text-gray-800',
    error: 'bg-white border-l-4 border-l-red-500 text-gray-800',
    warning: 'bg-white border-l-4 border-l-amber-500 text-gray-800',
    info: 'bg-white border-l-4 border-l-blue-500 text-gray-800',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const iconColors = {
    success: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2 max-w-sm" style={{ direction: 'ltr', zIndex: 100000 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`toast-enter cursor-pointer rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 ${typeStyles[toast.type] || typeStyles.info}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${iconColors[toast.type]}`}>
              {iconMap[toast.type]}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export default ToastContext;
