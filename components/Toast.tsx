'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'info') {
  if (addToastFn) {
    addToastFn(message, type)
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    addToastFn = (message: string, type: ToastType) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }
    return () => {
      addToastFn = null
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto px-4 py-3 rounded-lg shadow-lg
            animate-in slide-in-from-top-2 fade-in duration-300
            ${
              t.type === 'success'
                ? 'bg-green-600 text-white'
                : t.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-white'
            }
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
