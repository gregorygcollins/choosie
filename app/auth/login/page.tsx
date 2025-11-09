"use client";

import { useState, Suspense } from "react";
import auth, { signInDemo, getSession } from "../../../lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function LoginForm() {
  const [name, setName] = useState("");
  const [pro, setPro] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    signInDemo(name || "Demo User", pro);
    // quick client-side navigation back to home (or previous page)
    router.push(callbackUrl);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 rounded-xl bg-white/80 mt-6">
      <h2 className="text-2xl font-bold mb-3">Sign in</h2>
      <p className="text-sm text-zinc-600 mb-4">Use Google (NextAuth) or try the local demo sign-in. The demo stores a local session in your browser.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="rounded-lg border px-3 py-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
              Sign in as Pro (demo)
            </label>
            <div className="flex items-center gap-2">
              <button className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors">Sign in</button>
              <button type="button" onClick={() => { signInDemo("Demo User", false); router.push(callbackUrl); }} className="text-sm text-zinc-500">Quick demo</button>
            </div>
          </form>
          <div className="mt-6 border-t pt-4">
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full rounded-full bg-black text-white px-4 py-2 hover:opacity-90 transition-colors"
            >
              Continue with Google
            </button>
          </div>
        </div>
        <div className="rounded-xl border p-4 bg-white/60">
          <h3 className="font-semibold mb-2">Choosie Pro includes</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-700 space-y-1">
            <li>Virtual narrowing: invite friends by email or text, no account needed</li>
            <li>Premium modules: Booklists, Musiclists, Foodlists, and Anythinglists</li>
            <li>Smarter suggestions and overlap tools</li>
            <li>Priority features and early access</li>
          </ul>
          <div className="mt-3 text-sm">
            <a href="/account" className="text-brand hover:underline">Try Pro</a>
          </div>
        </div>
      </div>
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
