"use client";

import { useState } from "react";

export default function UpsellModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error || "Failed to start checkout");
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
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
          Unlock virtual narrowing, premium modules, smarter suggestions, and priority features.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-zinc-700 list-disc list-inside">
          <li>Virtual narrowing (remote invites via email or text)</li>
          <li>Premium modules: Books, Recipes, Anything</li>
          <li>Advanced suggestions and filtering</li>
          <li>Priority improvements</li>
        </ul>
        {error && (
          <div className="mt-3 rounded-md bg-rose-100 p-2 text-sm text-rose-700">{error}</div>
        )}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button disabled={busy} onClick={onClose} className="text-sm text-zinc-600 hover:text-zinc-800 disabled:opacity-50">Not now</button>
          <button
            disabled={busy}
            onClick={startCheckout}
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {busy ? "Starting…" : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
