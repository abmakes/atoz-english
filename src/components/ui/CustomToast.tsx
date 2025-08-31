'use client';

import React, { useState, useEffect, useRef, ReactNode, RefObject } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';
type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right' 
  | 'trigger';

interface CustomToastProps {
  message: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  isVisible: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null> | null;
  duration?: number;
}

// Individual Toast Component
export const CustomToast: React.FC<CustomToastProps> = ({ 
  message, 
  variant = 'info', 
  position = 'top-center', 
  isVisible, 
  onClose,
  triggerRef = null,
  duration = 4000 
}) => {
  const [show, setShow] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      
      if (position === 'trigger' && triggerRef?.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setTriggerPosition({
          top: rect.top - 60, // Adjust as needed for spacing above trigger
          left: rect.left + rect.width / 2
        });
      }

      if (duration > 0 && duration !== Infinity) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, duration, position, triggerRef]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Allow time for fade-out animation
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'; // info
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 mr-3 flex-shrink-0";
    switch (variant) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-[100]';
      case 'trigger':
        return triggerPosition.top > 0 
          ? 'fixed z-[100] transform -translate-x-1/2'
          : 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100]';
      case 'top-left':
        return 'fixed top-4 left-4 z-[100]';
      case 'top-right':
        return 'fixed top-4 right-4 z-[100]';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 z-[100]';
      case 'bottom-center':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100]';
      default: // top-center
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[100]';
    }
  };

  const animationClasses = show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full';

  if (!isVisible && !show) return null;

  const dynamicStyles: React.CSSProperties = position === 'trigger' && triggerPosition.top > 0
    ? { top: `${triggerPosition.top}px`, left: `${triggerPosition.left}px` }
    : {};

  return (
    <div 
      className={`${getPositionStyles()} transition-all duration-300 ease-in-out ${animationClasses}`}
      style={dynamicStyles}
    >
      <div className={`
        max-w-sm w-full shadow-lg rounded-xl border p-4 flex items-center
        ${getVariantStyles()}
      `}>
        {getIcon()}
        <div className="flex-1 flex items-center">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 rounded-full p-1 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current transition-colors flex items-center justify-center"
          aria-label="Close toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastOptions {
  variant?: ToastVariant;
  position?: ToastPosition;
  triggerRef?: RefObject<HTMLElement | null> | null;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, options?: ToastOptions) => string | number;
  removeToast: (id: string | number) => void;
}

const CustomToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const CustomToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Array<CustomToastProps & { id: string | number }>>([]);

  const addToast = (message: string, options: ToastOptions = {}) => {
    const id = Date.now() + Math.random();
    const newToast = { 
      id, 
      message, 
      variant: options.variant || 'info',
      position: options.position || 'top-center',
      triggerRef: options.triggerRef || null,
      duration: options.duration === undefined ? 4000 : options.duration,
      isVisible: true,
      onClose: () => removeToast(id) // Ensure onClose is properly handled
    };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string | number) => {
    setToasts(prevToasts => 
      prevToasts.map(toast => 
        toast.id === id ? { ...toast, isVisible: false } : toast
      )
    );
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 300); 
  };
  
  useEffect(() => {
    const timers = toasts.map(toast => {
      if (toast.isVisible && toast.duration && toast.duration > 0 && toast.duration !== Infinity) {
        return setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
      }
      return null;
    });
    return () => timers.forEach(timer => { if (timer) clearTimeout(timer); });
  }, [toasts]);

  return (
    <CustomToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="custom-toast-portal-container">
        {toasts.map(toast => (
          <CustomToast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            position={toast.position}
            triggerRef={toast.triggerRef}
            isVisible={toast.isVisible}
            duration={Infinity} 
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </CustomToastContext.Provider>
  );
};

export const useCustomToast = (): ToastContextType => {
  const context = React.useContext(CustomToastContext);
  if (context === undefined) {
    throw new Error('useCustomToast must be used within a CustomToastProvider');
  }
  return context;
};

export const CustomToastDemo = () => {
  const { addToast } = useCustomToast(); 
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const showToast = (message: string, variant: ToastVariant, position: ToastPosition) => {
    const options: ToastOptions = { 
      variant,
      position,
      triggerRef: position === 'trigger' ? buttonRef : null
    };
    addToast(message, options);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Toast Component Demo</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Toast Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => showToast('Success! Operation completed.', 'success', 'top-center')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Success Toast
            </button>
             {/* Add other demo buttons here */}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Toast Positions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
                 <button
                 key={pos}
                 onClick={() => showToast(`Toast at ${pos}!`, 'info', pos as ToastPosition)}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors capitalize"
               >
                 {pos.replace('-', ' ')}
               </button>
            ))}
            <button
              ref={buttonRef}
              onClick={() => showToast('Toast above this button!', 'info', 'trigger')}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              Above Trigger
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Usage Example</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`// 1. Wrap your app (or relevant part) with CustomToastProvider in your layout file:
// import { CustomToastProvider } from '@/components/ui/CustomToast';
// <CustomToastProvider>
//   <YourApp />
// </CustomToastProvider>

// 2. Use the useCustomToast hook in your component:
// import { useCustomToast } from '@/components/ui/CustomToast';
// const { addToast } = useCustomToast();
// addToast('Your message', { variant: 'success', position: 'top-center' });

// Available options for addToast(message, options):
// options.variant: 'success', 'error', 'warning', 'info' (default: 'info')
// options.position: 'top-center', 'top-left', 'top-right', 'bottom-center', 'bottom-left', 'bottom-right', 'trigger' (default: 'top-center')
// options.duration: milliseconds (default: 4000), use Infinity for no auto-hide
// options.triggerRef: React ref to an element (for 'trigger' position)
`}
          </pre>
        </div>
      </div>
    </div>
  );
}; 