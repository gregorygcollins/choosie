"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut as nextAuthSignOut } from "next-auth/react";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollInterval: NodeJS.Timeout | undefined;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // Read checkout status from the URL on mount to avoid Suspense requirement
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        setShowSuccessBanner(true);
        // Poll for user.isPro update for up to 10 seconds after checkout success
        let attempts = 0;
        pollInterval = setInterval(async () => {
          attempts++;
          if (cancelled || attempts > 20) {
            clearInterval(pollInterval);
            return;
          }
          try {
            const res = await fetch("/api/me", { credentials: "include" });
            const data = await res.json();
            if (!cancelled) {
              setUser(data.user);
              // Stop polling once isPro is true
              if (data.user?.isPro) {
                clearInterval(pollInterval);
              }
            }
          } catch {}
        }, 500); // Poll every 500ms
      }
      const err = params.get("error");
      if (err) {
        const map: Record<string, string> = {
          stripe_price_missing: "Billing is not configured. Please set a Stripe price.",
          stripe_not_configured: "Stripe is not configured. Set STRIPE_SECRET_KEY (and a price).",
          checkout_failed: "We couldn’t start checkout. Please try again.",
          no_stripe_customer: "No Stripe customer found. Start a subscription first.",
          portal_failed: "We couldn’t open the billing portal. Please try again.",
        };
        const reason = params.get("reason");
        const msg = map[err] || "An unknown billing error occurred.";
        setError(reason ? `${msg} (${reason})` : msg);
      }
    } catch {}
    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [status]);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      // Prefer server-side redirect flow (avoids JSON parsing/CORS edge-cases)
      window.location.href = "/api/stripe/checkout";
    } catch (err: any) {
      setError(err?.message || "Navigation error");
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      window.location.href = "/api/stripe/portal";
    } catch (err: any) {
      setError(err?.message || "Navigation error");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6 rounded-xl bg-white/80 mt-6">Loading…</div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl p-6 rounded-xl bg-white/80 mt-6">
        <h2 className="text-2xl font-bold">Account</h2>
        <div className="text-sm text-zinc-600 mt-4">Not signed in. <button onClick={() => signIn("google")} className="text-brand">Sign in</button></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 rounded-xl bg-white/80 mt-6">
      <h2 className="text-2xl font-bold">Account</h2>
      <div className="mt-4 space-y-3">
        <div className="text-sm">Name: <strong>{user.name}</strong></div>
        <div className="text-sm">Email: <strong>{user.email}</strong></div>
        <div className="text-sm">Plan: <strong>{user.isPro ? 'Pro' : 'Free'}</strong></div>

        {error && (
          <div className="mt-4 p-3 rounded bg-rose-100 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {showSuccessBanner && user.isPro && (
          <div className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
            🎉 You’re Pro! Enjoy premium features.
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          {user.isPro ? (
            <button disabled={busy} onClick={openPortal} className="rounded-full bg-zinc-900 text-white px-3 py-2 disabled:opacity-50">Manage subscription</button>
          ) : (
            <button disabled={busy} onClick={startCheckout} className="rounded-full bg-amber-300 px-3 py-2 text-black disabled:opacity-50">Upgrade to Pro</button>
          )}
        </div>

        <div className="mt-4">
          <button onClick={() => nextAuthSignOut()} className="text-sm text-rose-500">Sign out</button>
        </div>
      </div>
    </div>
  );
}
