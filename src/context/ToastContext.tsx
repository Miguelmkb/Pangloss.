import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  showToast: (message: string, variant?: Toast['variant']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: Toast['variant'] = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={`flex items-center gap-2.5 px-4 py-3 bg-white border shadow-sm text-sm font-sans max-w-xs animate-toast-in ${
              t.variant === 'error' ? 'border-accent text-accent' : 'border-border text-text-primary'
            }`}
          >
            {t.variant === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0 text-success" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar" className="text-text-muted hover:text-text-primary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
