"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";

type BillingInterval = "monthly" | "annual";

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12" strokeLinecap="round" />
      <path d="M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function PricingClient() {
  const { status } = useSession();
  const [selectedBilling, setSelectedBilling] = useState<BillingInterval | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const checkoutPath = selectedBilling ? `/api/stripe/checkout?billing=${selectedBilling}` : "/pricing";

  function choosePlan(billing: BillingInterval) {
    if (status === "authenticated") {
      window.location.href = `/api/stripe/checkout?billing=${billing}`;
      return;
    }
    setSelectedBilling(billing);
    setEmailOpen(false);
    setError("");
  }

  async function handleEmailSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: checkoutPath,
        redirect: false,
      });
      if (!result || result.error || !result.url) throw new Error("Email or password was incorrect.");
      window.location.href = result.url;
    } catch (err: any) {
      setError(err?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-light ring-1 ring-brand/10">
          <img src="/choosie-logo-badge.png" alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Pro</p>
        <h1 className="mt-3 text-3xl font-bold text-brand sm:text-4xl">Upgrade to Choosie Pro</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Free is perfect for making and using a movie list. Pro lets you make and save different lists for different activities and occasions.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-brand/10 bg-white p-6 text-center shadow-soft">
        <h2 className="text-lg font-bold text-brand">Pro features</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
          <li>Make and save unlimited lists</li>
          <li>Create lists for movies, books, music, food, and more</li>
          <li>Share and narrow lists virtually</li>
          <li>Look back at winners, dinners, places, and who narrowed last time</li>
        </ul>
      </section>

      <section className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-2">
        <article className="flex h-full flex-col rounded-2xl border border-consensus bg-white p-6 shadow-soft ring-2 ring-consensus/30">
          <div>
            <div className="mb-4 inline-flex rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
              Monthly
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-brand">$2.99</span>
              <span className="pb-1 text-sm font-semibold text-slate-500">/mo</span>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => choosePlan("monthly")}
              className="inline-flex w-full justify-center rounded-full bg-consensus px-4 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-consensus-dark"
            >
              Monthly
            </button>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-brand/10 bg-white p-6 shadow-soft">
          <div>
            <div className="mb-4 inline-flex rounded-full bg-brand-light px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
              Annual
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-brand">$29.99</span>
              <span className="pb-1 text-sm font-semibold text-slate-500">/yr</span>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => choosePlan("annual")}
              className="inline-flex w-full justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Annual
            </button>
          </div>
        </article>
      </section>

      {selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-dark/35 p-4 sm:items-center">
          <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                  {selectedBilling === "annual" ? "Annual Pro" : "Monthly Pro"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-brand">Sign in to continue</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBilling(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
                title="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: checkoutPath })}
              className="mt-5 w-full rounded-full bg-consensus px-5 py-3 text-sm font-bold text-brand-dark shadow-lg shadow-consensus/20 transition-colors hover:bg-consensus-dark"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => setEmailOpen((value) => !value)}
              className="mt-3 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Sign in with email
            </button>

            {emailOpen && (
              <form onSubmit={handleEmailSignIn} className="mt-4 rounded-2xl border border-zinc-200 bg-brand-light/40 p-4">
                <label className="block text-sm font-semibold text-brand" htmlFor="pricing-email">
                  Email
                </label>
                <input
                  id="pricing-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
                />
                <label className="mt-3 block text-sm font-semibold text-brand" htmlFor="pricing-password">
                  Password
                </label>
                <input
                  id="pricing-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
                />
                {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                >
                  {busy ? "Signing in..." : "Continue to checkout"}
                </button>
              </form>
            )}
            <a
              href={`/signup?callbackUrl=${encodeURIComponent(checkoutPath)}`}
              className="mt-4 inline-flex w-full justify-center text-sm font-semibold text-brand hover:text-brand-dark"
            >
              New to Choosie? Create account
            </a>
          </section>
        </div>
      )}
    </main>
  );
}
