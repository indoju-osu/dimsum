'use client';

/**
 * Notifikasi ringan (toast) untuk umpan balik aksi: tambah ke keranjang,
 * simpan pengaturan, gagal memuat data, dsb.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, string> = {
  success: 'border-olive/40 bg-white text-forest',
  error: 'border-red-200 bg-white text-red-800',
  info: 'border-sand bg-white text-forest',
};

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 aria-hidden className="h-5 w-5 text-olive" />,
  error: <AlertTriangle aria-hidden className="h-5 w-5 text-red-600" />,
  info: <Info aria-hidden className="h-5 w-5 text-harvest" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      // Toast hilang otomatis agar tidak menutupi konten.
      setTimeout(() => dismiss(id), toast.tone === 'error' ? 7000 : 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      push,
      dismiss,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) => push({ tone: 'error', title, description }),
      info: (title, description) => push({ tone: 'info', title, description }),
    }),
    [toasts, push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-fade-in-up items-start gap-3 rounded-2xl border p-4 shadow-card',
              TONE_STYLE[toast.tone],
            )}
          >
            <span className="mt-0.5 shrink-0">{TONE_ICON[toast.tone]}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm text-charcoal/80">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-lg p-1 text-charcoal/60 transition hover:bg-stone hover:text-forest"
              aria-label="Tutup notifikasi"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast harus dipakai di dalam <ToastProvider>.');
  return context;
}

export default useToast;
