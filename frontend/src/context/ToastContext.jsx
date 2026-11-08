import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title = '', message, duration = 4500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
      return id;
    },
    [dismissToast],
  );

  const toast = {
    show: showToast,
    success: (message, title = 'Success') => showToast({ type: 'success', title, message }),
    warning: (message, title = 'Notice') => showToast({ type: 'warning', title, message }),
    error: (message, title = 'Error') => showToast({ type: 'error', title, message, duration: 6000 }),
    info: (message, title = 'Info') => showToast({ type: 'info', title, message }),
    dismiss: dismissToast,
  };
  toast.toast = toast;

  const styles = {
    success: {
      border: 'border-[#ccd5ae]',
      icon: CheckCircle2,
      iconColor: 'text-[#ccd5ae]',
      titleColor: 'text-[#fefae0]',
    },
    warning: {
      border: 'border-[#faedcd]',
      icon: AlertTriangle,
      iconColor: 'text-[#faedcd]',
      titleColor: 'text-[#faedcd]',
    },
    error: {
      border: 'border-[#da7770]',
      icon: AlertCircle,
      iconColor: 'text-[#da7770]',
      titleColor: 'text-[#da7770]',
    },
    info: {
      border: 'border-[#d4a373]',
      icon: Info,
      iconColor: 'text-[#d4a373]',
      titleColor: 'text-[#fefae0]',
    },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Accessible Toast Viewport */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((t) => {
          const cfg = styles[t.type] || styles.info;
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto rounded-xl bg-[#17211d]/95 backdrop-blur-md border ${cfg.border} p-4 shadow-2xl flex items-start gap-3 text-xs text-[#f1f2e9]`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
              <div className="flex-1 min-w-0 space-y-0.5">
                {t.title && <div className={`font-semibold ${cfg.titleColor}`}>{t.title}</div>}
                {t.message && <p className="text-[#a9b3a8] leading-snug break-words">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Close notification"
                className="text-[#77857b] hover:text-[#fefae0] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
