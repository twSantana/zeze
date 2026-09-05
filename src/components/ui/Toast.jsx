import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 dark:bg-emerald-950/90 dark:border-emerald-500/40 dark:text-emerald-100',
      iconColor: 'text-emerald-400',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-rose-950/90 border-rose-500/40 text-rose-100 dark:bg-rose-950/90 dark:border-rose-500/40 dark:text-rose-100',
      iconColor: 'text-rose-400',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-950/90 border-amber-500/40 text-amber-100 dark:bg-amber-950/90 dark:border-amber-500/40 dark:text-amber-100',
      iconColor: 'text-amber-400',
    },
    info: {
      icon: Info,
      bgColor: 'bg-slate-900/90 border-slate-700 text-slate-100 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100',
      iconColor: 'text-sky-400',
    },
  }[toast.type] || {
    icon: Info,
    bgColor: 'bg-slate-900/90 border-slate-700 text-slate-100',
    iconColor: 'text-sky-400',
  };

  const IconComponent = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-fadeIn ${config.bgColor}`}
    >
      <IconComponent className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
      <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
