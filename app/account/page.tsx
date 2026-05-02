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
  const [upgradeIntent, setUpgradeIntent] = useState(false);

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
      if (params.get("intent") === "upgrade") {
        setUpgradeIntent(true);
      }
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

  async function startCheckout(billing: "monthly" | "annual" = "monthly") {
    setBusy(true);
    setError(null);
    try {
      window.location.href = `/api/stripe/checkout?billing=${billing}`;
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
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl bg-white p-8 text-center shadow-soft">
          <p className="text-sm font-semibold text-brand">Loading account...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl bg-white p-8 text-center shadow-soft">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-light ring-1 ring-brand/10">
            <img src="/choosie-logo-badge.png" alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Account</p>
          <h1 className="mt-3 text-3xl font-bold text-brand">Sign in to manage Choosie</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Save your movie list, manage Pro, and keep narrowing across devices.
          </p>
          <button
            onClick={() => signIn("google")}
            className="mt-6 rounded-full bg-consensus px-5 py-3 text-sm font-bold text-brand-dark shadow-lg shadow-consensus/20 transition-colors hover:bg-consensus-dark"
          >
            Continue with Google
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Account</p>
            <h1 className="mt-2 text-3xl font-bold text-brand">Your Choosie account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage your plan, billing, and sign-in details.
            </p>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            user.isPro ? "bg-consensus/15 text-brand" : "bg-zinc-100 text-slate-600"
          }`}>
            {user.isPro ? "Pro" : "Free"}
          </span>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_.9fr]">
          <div className="rounded-2xl border border-zinc-200 bg-brand-light/50 p-5">
            <h2 className="text-lg font-bold text-brand">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Name</dt>
                <dd className="mt-1 text-brand">{user.name || "Choosie user"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Email</dt>
                <dd className="mt-1 break-all text-brand">{user.email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Plan</dt>
                <dd className="mt-1 text-brand">{user.isPro ? "Choosie Pro" : "Free"}</dd>
              </div>
            </dl>

            <button onClick={() => nextAuthSignOut()} className="mt-5 text-sm font-semibold text-rose-500 hover:text-rose-600">
              Sign out
            </button>
          </div>

          <div className="rounded-2xl border border-brand/10 bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
              {user.isPro ? "Active" : "$2.99/mo"}
            </div>
            <h2 className="text-lg font-bold text-brand">
              {user.isPro ? "Choosie Pro is active" : "Upgrade to Choosie Pro"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {user.isPro
                ? "Manage your subscription and billing details through Stripe."
                : "Save unlimited lists and look back at winners, dinners, places, and who narrowed last time."}
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {showSuccessBanner && user.isPro && (
              <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                You’re Pro. Enjoy premium features.
              </div>
            )}

            {upgradeIntent && !user.isPro && (
              <div className="mt-4 rounded-lg border border-consensus/40 bg-consensus/10 p-3 text-sm text-brand">
                You’re signed in. Complete your Pro upgrade to save unlimited lists across every module.
              </div>
            )}

            <div className="mt-5">
              {user.isPro ? (
                <button
                  disabled={busy}
                  onClick={openPortal}
                  className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                >
                  Manage subscription
                </button>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    disabled={busy}
                    onClick={() => startCheckout("monthly")}
                    className="rounded-full bg-consensus px-4 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-consensus-dark disabled:opacity-50"
                  >
                    {upgradeIntent ? "Monthly" : "Monthly Pro"}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => startCheckout("annual")}
                    className="rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                  >
                    {upgradeIntent ? "Annual" : "Annual Pro"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
