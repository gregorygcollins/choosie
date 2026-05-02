"use client";

import { useState } from "react";

export default function UpsellModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function startCheckout() {
    setBusy(true);
    setError(null);
    window.location.href = "/api/stripe/checkout?billing=monthly";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose()} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Go Pro</h3>
          <button disabled={busy} onClick={onClose} className="text-zinc-500 hover:text-black disabled:opacity-40">✕</button>
        </div>
        <p className="mt-2 text-sm text-zinc-700">
          Free lets you make and use a movie list. Pro lets you keep building and saving every list your group needs.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-zinc-700 list-disc list-inside">
          <li>Unlimited saved lists</li>
          <li>Movie, book, food, music, and anything lists</li>
          <li>Virtual narrowing (remote invites via email or text)</li>
          <li>List Log remembers past winners, dinners, places, and who narrowed last time</li>
        </ul>
        {error && (
          <div className="mt-3 rounded-md bg-rose-100 p-2 text-sm text-rose-700">{error}</div>
        )}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button disabled={busy} onClick={onClose} className="text-sm text-zinc-600 hover:text-zinc-800 disabled:opacity-50">Not now</button>
          <button
            disabled={busy}
            onClick={startCheckout}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "Starting…" : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
