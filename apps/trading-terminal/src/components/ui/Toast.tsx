import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-green-500/20 border-green-500/50',
    error: 'bg-red-500/20 border-red-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
    warning: 'bg-yellow-500/20 border-yellow-500/50',
  };

  const textColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400',
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 glass-card border ${bgColors[type]} min-w-[300px] max-w-md animate-slide-up`}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="text-2xl">{icons[type]}</div>
        <div className="flex-1">
          <p className={`${textColors[type]} font-semibold text-sm`}>
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Toast Container for managing multiple toasts
interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  removeToast 
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(-${index * 10}px)`,
            transition: 'all 0.3s ease'
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Hook for using toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};
