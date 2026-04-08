import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: {
    bg: 'bg-emerald-900/90 border-emerald-700/60',
    icon: 'text-emerald-400',
    text: 'text-emerald-100',
  },
  error: {
    bg: 'bg-red-900/90 border-red-700/60',
    icon: 'text-red-400',
    text: 'text-red-100',
  },
  info: {
    bg: 'bg-cyan-900/90 border-cyan-700/60',
    icon: 'text-cyan-400',
    text: 'text-cyan-100',
  },
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[toast.type];
  const colors = COLORS[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl max-w-sm w-full transition-all duration-300 ${colors.bg} ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors.icon}`} />
      <p className={`text-sm font-medium flex-1 leading-relaxed ${colors.text}`}>{toast.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
      >
        <X className={`w-4 h-4 ${colors.text}`} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
