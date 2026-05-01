"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = "force-dynamic";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

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
          <div className="rounded-2xl border border-zinc-200 bg-brand-light/50 p-5">
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full rounded-full bg-consensus px-5 py-3 text-sm font-bold text-brand-dark shadow-lg shadow-consensus/20 transition-colors hover:bg-consensus-dark"
            >
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-zinc-200" />
              or upgrade
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Pro is $2.99/mo and unlocks virtual narrowing plus premium list types.
            </p>

            <div className="mt-5">
              <Link
                href="/signup?plan=pro"
                className="inline-flex w-full justify-center rounded-full bg-consensus px-4 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-consensus-dark"
              >
                Upgrade
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-brand/10 bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
              Pro
            </div>
            <h2 className="text-xl font-bold text-brand">More ways to choosie</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pro unlocks virtual narrowing, book lists, food lists, music lists, and anything lists.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>Share virtual narrowing links with your group</li>
              <li>Create lists beyond movies</li>
              <li>Try newer modules and early features</li>
            </ul>
            <Link
              href="/pricing"
              className="mt-5 inline-flex w-full justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Explore Pro
            </Link>
          </div>
        </div>
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
