"use client";

import { Suspense, useState } from "react";
import { signInDemo } from "../../../lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "@/components/Toast";

// Force dynamic rendering
export const dynamic = "force-dynamic";

function LoginForm() {
  const [name, setName] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  function startDemo(isPro = false) {
    signInDemo(name || (isPro ? "Pro Demo" : "Demo User"), isPro);
    toast(isPro ? "Pro demo enabled" : "Demo mode enabled", "success");
    router.push(callbackUrl);
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
          <div className="rounded-2xl border border-zinc-200 bg-brand-light/50 p-5">
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full rounded-full bg-consensus px-5 py-3 text-sm font-bold text-brand-dark shadow-lg shadow-consensus/20 transition-colors hover:bg-consensus-dark"
            >
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-zinc-200" />
              or try it first
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <label className="block text-sm font-semibold text-brand" htmlFor="demo-name">
              Demo name
            </label>
            <input
              id="demo-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name optional"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
            />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Demo mode lets you try Choosie on this device without creating an account. Demo lists may not sync across devices.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => startDemo(false)}
                className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Try Choosie Demo
              </button>
              <button
                type="button"
                onClick={() => startDemo(true)}
                className="rounded-full border border-brand/20 bg-white px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-zinc-50"
              >
                Try Pro Demo
              </button>
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
