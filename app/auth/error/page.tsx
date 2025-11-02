"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-brand-light p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-700 mb-4">
          There was a problem signing you in.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-sm font-mono text-red-800">Error: {error}</p>
          </div>
        )}
        <div className="space-y-2 text-sm text-gray-600">
          <p>Possible issues:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Database connection failed</li>
            <li>Missing environment variables</li>
            <li>Database migrations not run</li>
          </ul>
        </div>
        <a
          href="/"
          className="mt-6 block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
