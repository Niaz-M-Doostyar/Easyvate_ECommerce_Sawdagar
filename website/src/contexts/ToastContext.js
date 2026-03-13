'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 6000) => {
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
    success: { backgroundColor: '#16a34a', color: '#fff' },
    error: { backgroundColor: '#dc2626', color: '#fff' },
    warning: { backgroundColor: '#f59e0b', color: '#fff' },
    info: { backgroundColor: '#2563eb', color: '#fff' },
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const iconStyles = {
    success: { backgroundColor: '#ffffff', color: '#16a34a' },
    error: { backgroundColor: '#ffffff', color: '#dc2626' },
    warning: { backgroundColor: '#ffffff', color: '#f59e0b' },
    info: { backgroundColor: '#ffffff', color: '#2563eb' },
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 320,
          zIndex: 100000,
          direction: 'ltr',
        }}
      >
        {toasts.map((toast) => {
          const baseStyle = typeStyles[toast.type] || typeStyles.info;
          const style = {
            ...baseStyle,
            background: baseStyle.backgroundColor,
            border: 'none',
          };
          const iconStyle = iconStyles[toast.type] || iconStyles.info;
          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className="toast-enter cursor-pointer rounded-lg px-4 py-3 shadow-lg flex items-center gap-3"
              style={style}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={iconStyle}
              >
                {iconMap[toast.type]}
              </span>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          );
        })}
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
