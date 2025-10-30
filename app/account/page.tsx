"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut as nextAuthSignOut } from "next-auth/react";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
    return () => { cancelled = true; };
  }, [status]);

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
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error || "Failed to open portal");
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
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
