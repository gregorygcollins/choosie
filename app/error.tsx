'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-brand-light p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900">Something went wrong</h1>
          <p className="text-lg text-zinc-600">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white text-black border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors font-medium"
          >
            Go home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="text-left mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <summary className="cursor-pointer font-medium text-red-900">
              Error details (dev only)
            </summary>
            <pre className="mt-2 text-xs text-red-800 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
