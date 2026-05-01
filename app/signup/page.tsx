"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function SignupContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const isPro = plan === "pro";
  const callbackUrl = isPro ? "/account?intent=upgrade" : "/new";

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
            ? "Sign up to save your lists, then complete your $2.99/mo Pro subscription from your account."
            : "Sign up to save lists, share links, and keep narrowing across devices."}
        </p>

        <div className="mx-auto mt-8 max-w-sm">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full rounded-full bg-consensus px-5 py-3 text-sm font-bold text-brand-dark shadow-lg shadow-consensus/20 transition-colors hover:bg-consensus-dark"
          >
            Continue with Google
          </button>
          <Link href="/auth/login" className="mt-4 inline-flex text-sm font-semibold text-brand hover:text-brand-dark">
            Already have an account? Sign in
          </Link>
        </div>
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
