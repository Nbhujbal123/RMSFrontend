import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
  hideToast: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, message, type }
    
    setToasts(prev => [...prev, newToast])

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const getToastStyles = (toastType: ToastType) => {
    switch (toastType) {
      case 'success':
        return { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '✓' }
      case 'error':
        return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '✕' }
      case 'warning':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠' }
      case 'info':
      default:
        return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: 'ℹ' }
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
      {/* Toast Container */}
      <div 
        className="toast-container position-fixed"
        style={{ 
          top: '20px', 
          right: '20px', 
          zIndex: 11000,
          maxWidth: '350px'
        }}
      >
        {toasts.map(toast => {
          const styles = getToastStyles(toast.type)
          return (
            <div
              key={toast.id}
              className="toast show"
              role="alert"
              style={{
                background: styles.bg,
                borderLeft: `4px solid ${styles.border}`,
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              <span 
                style={{
                  color: styles.text,
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                {styles.icon}
              </span>
              <p 
                className="mb-0" 
                style={{ 
                  color: styles.text, 
                  fontSize: '14px',
                  flex: 1
                }}
              >
                {toast.message}
              </p>
              <button
                type="button"
                className="btn-close"
                style={{ 
                  fontSize: '12px',
                  opacity: 0.5
                }}
                onClick={() => hideToast(toast.id)}
              >
              </button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

// Standalone toast function for easy access
let toastFunction: ((message: string, type?: ToastType) => void) | null = null

export const setToastFunction = (fn: (message: string, type?: ToastType) => void) => {
  toastFunction = fn
}

export const toast = {
  success: (message: string) => toastFunction?.(message, 'success'),
  error: (message: string) => toastFunction?.(message, 'error'),
  warning: (message: string) => toastFunction?.(message, 'warning'),
  info: (message: string) => toastFunction?.(message, 'info')
}

export default ToastProvider
