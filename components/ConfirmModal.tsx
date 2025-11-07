'use client'

import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when modal opens
      setTimeout(() => confirmButtonRef.current?.focus(), 100)

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel()
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">{title}</h2>
        <p className="text-zinc-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                variant === 'danger'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-brand text-white hover:opacity-90'
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
