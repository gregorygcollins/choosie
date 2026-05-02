"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/components/Toast";

export const dynamic = "force-dynamic";

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");
  const billing = searchParams.get("billing") === "annual" ? "annual" : "monthly";
  const isPro = plan === "pro";
  const callbackUrl = isPro ? `/api/stripe/checkout?billing=${billing}` : "/new";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSignup(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Could not create account.");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Account created, but sign-in failed. Please sign in.");

      toast("Account created", "success");
      router.push(callbackUrl);
    } catch (err: any) {
      setError(err?.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-2xl bg-white p-6 text-center shadow-soft sm:p-8">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-light ring-1 ring-brand/10">
          <img src="/choosie-logo-badge.png" alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {isPro ? "Choosie Pro" : "Choosie"}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-brand sm:text-4xl">
          {isPro ? "Create your account to upgrade" : "Create your Choosie account"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {isPro
            ? `Sign up, then complete your ${billing === "annual" ? "$29.99/yr" : "$2.99/mo"} Pro upgrade to save unlimited lists across every module.`
            : "Sign up to save your movie list, share links, and keep narrowing across devices."}
        </p>

        <div className="mx-auto mt-8 grid max-w-2xl gap-6 md:grid-cols-2">
          <form onSubmit={handleEmailSignup} className="rounded-2xl border border-zinc-200 bg-brand-light/50 p-5 text-left">
            <h2 className="text-lg font-bold text-brand">Sign up with email</h2>
            <label className="mt-4 block text-sm font-semibold text-brand" htmlFor="signup-name">
              Name
            </label>
            <input
              id="signup-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name optional"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
            />
            <label className="mt-3 block text-sm font-semibold text-brand" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
            />
            <label className="mt-3 block text-sm font-semibold text-brand" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">Use at least 8 characters.</p>
            {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-full bg-consensus px-5 py-3 text-sm font-bold text-brand-dark shadow-lg shadow-consensus/20 transition-colors hover:bg-consensus-dark disabled:opacity-50"
            >
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="rounded-2xl border border-brand/10 bg-white p-5 text-left shadow-sm">
            <h2 className="text-lg font-bold text-brand">Sign up with Google</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use Google to create your account without a password.
            </p>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="mt-5 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand/15 transition-colors hover:bg-brand-dark"
          >
            Continue with Google
          </button>
          </div>
        </div>

        <Link href="/auth/login" className="mt-6 inline-flex text-sm font-semibold text-brand hover:text-brand-dark">
          Already have an account? Sign in
        </Link>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-6 text-center">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
