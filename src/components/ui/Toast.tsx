import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
      }}
    >
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-medium transition-all transform duration-300 animate-slide-up ${
              t.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-white text-charcoal-900 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-olive-600 shrink-0" />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
