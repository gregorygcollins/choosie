"use client";

import { useState } from "react";
import auth, { signInDemo, getSession } from "../../../lib/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [pro, setPro] = useState(false);
  const router = useRouter();

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    signInDemo(name || "Demo User", pro);
    // quick client-side navigation back to home (or previous page)
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-md p-6 rounded-xl bg-white/80 mt-6">
      <h2 className="text-2xl font-bold mb-3">Sign in (demo)</h2>
      <p className="text-sm text-zinc-600 mb-4">Use Google (NextAuth) or try the local demo sign-in. The demo stores a local session in your browser.</p>
      <form onSubmit={handleSignIn} className="flex flex-col gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="rounded-lg border px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
          Sign in as Pro (demo)
        </label>
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors">Sign in</button>
          <button type="button" onClick={() => { signInDemo("Demo User", false); router.push('/'); }} className="text-sm text-zinc-500">Quick demo</button>
        </div>
      </form>
      <div className="mt-6 border-t pt-4">
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full rounded-full bg-black text-white px-4 py-2 hover:opacity-90 transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
