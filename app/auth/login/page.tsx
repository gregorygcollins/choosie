"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = "force-dynamic";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const callbackBilling = callbackUrl.includes("billing=annual") ? "annual" : "monthly";
  const signupHref = callbackUrl.startsWith("/api/stripe/checkout")
    ? `/signup?plan=pro&billing=${callbackBilling}`
    : "/signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (result?.error) throw new Error("Email or password was incorrect.");
      window.location.href = result?.url || callbackUrl;
    } catch (err: any) {
      setError(err?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-light ring-1 ring-brand/10">
          <img src="/choosie-logo-badge.png" alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </div>
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-bold text-brand">Welcome to Choosie</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to save lists, share links, and keep narrowing across devices.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_.9fr]">
          <form onSubmit={handleEmailSignIn} className="rounded-2xl border border-zinc-200 bg-brand-light/50 p-5">
            <h2 className="text-lg font-bold text-brand">Sign in with email</h2>
            <label className="mt-4 block text-sm font-semibold text-brand" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
            />
            <label className="mt-3 block text-sm font-semibold text-brand" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
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
              className="mt-5 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand/15 transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-zinc-200" />
              or
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand/15 transition-colors hover:bg-brand-dark"
            >
              Continue with Google
            </button>
          </form>

          <div className="rounded-2xl border border-brand/10 bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
              Pro
            </div>
            <h2 className="text-xl font-bold text-brand">Save every list</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Free gets you started with a movie list. Pro lets you save unlimited lists across movies, books, music, food, and anything.
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Pro is $2.99/mo or $29.99/yr for groups who keep choosing together.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>Save unlimited lists</li>
              <li>Create lists for movies, books, music, food, and more</li>
              <li>Share virtual narrowing links with your group</li>
              <li>Try newer modules and early features</li>
            </ul>
            <Link
              href="/pricing"
              className="mt-5 inline-flex w-full justify-center rounded-full bg-consensus px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-lg shadow-consensus/20 transition-colors hover:bg-consensus-dark"
            >
              Explore Pro
            </Link>
          </div>
        </div>

        <Link href={signupHref} className="mt-6 inline-flex text-sm font-semibold text-brand hover:text-brand-dark">
          Need an account? Sign up
        </Link>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-6 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
