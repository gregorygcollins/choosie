"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInDemo } from "@/lib/auth";
import { toast } from "@/components/Toast";
import Link from "next/link";

export const dynamic = "force-dynamic";

function DemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/new";
  const highlightedPlan = searchParams.get("plan");

  function startDemo(isPro: boolean) {
    signInDemo(isPro ? "Pro Demo" : "Demo User", isPro);
    toast(isPro ? "Pro demo enabled" : "Demo mode enabled", "success");
    router.push(callbackUrl);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-light ring-1 ring-brand/10">
          <img src="/choosie-logo-badge.png" alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Demo</p>
        <h1 className="mt-3 text-3xl font-bold text-brand sm:text-4xl">Try Choosie before signing in</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Demo mode lets you explore Choosie on this device. Create lists, test narrowing, and upgrade the demo when you want to try Pro modules.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-brand">Try Choosie</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Build movie lists and try the basic in-person narrowing flow without creating an account.
          </p>
          <button
            type="button"
            onClick={() => startDemo(false)}
            className="mt-5 w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Start Demo
          </button>
        </article>

        <article className={`rounded-2xl border bg-white p-6 shadow-soft ${highlightedPlan === "pro" ? "border-consensus ring-2 ring-consensus/30" : "border-zinc-200"}`}>
          <div className="mb-3 inline-flex rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
            Pro
          </div>
          <h2 className="text-xl font-bold text-brand">Try Choosie Pro</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Unlock virtual narrowing plus book lists, food lists, music lists, and anything lists for the demo session.
          </p>
          <button
            type="button"
            onClick={() => startDemo(true)}
            className="mt-5 w-full rounded-full bg-consensus px-4 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-consensus-dark"
          >
            Start Pro Demo
          </button>
        </article>
      </section>

      <p className="mt-6 text-center text-sm text-slate-500">
        Ready to keep your lists?{" "}
        <Link href="/auth/login" className="font-semibold text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </main>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-6 text-center">Loading...</div>}>
      <DemoContent />
    </Suspense>
  );
}
