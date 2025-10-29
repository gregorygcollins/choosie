"use client";

import { useEffect, useState } from "react";
import { getSession, signInDemo, signOut, isPremium, getBillingInfoForUser } from "../../lib/auth";

export default function AccountPage() {
  const [session, setSession] = useState(getSession());
  const [billing, setBilling] = useState(() => (session.user ? getBillingInfoForUser(session.user.id) : undefined));

  useEffect(() => {
    setSession(getSession());
  }, []);

  function handleUpgrade() {
    // demo: create a new pro session
    signInDemo(session.user?.name || "Pro Demo", true);
    setSession(getSession());
    setBilling(getBillingInfoForUser(session.user?.id || ""));
  }

  function handleSignOut() {
    signOut();
    setSession(getSession());
  }

  return (
    <div className="mx-auto max-w-2xl p-6 rounded-xl bg-white/80 mt-6">
      <h2 className="text-2xl font-bold">Account</h2>
      {session.user ? (
        <div className="mt-4 space-y-3">
          <div className="text-sm">Name: <strong>{session.user.name}</strong></div>
          <div className="text-sm">Email: <strong>{session.user.email}</strong></div>
          <div className="text-sm">Plan: <strong>{session.user.isPro ? 'Pro' : 'Free'}</strong></div>

          <div className="mt-4">
            {session.user.isPro ? (
              <div className="text-sm text-green-700">Your Pro subscription is active (demo).</div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleUpgrade} className="rounded-full bg-amber-300 px-3 py-2 text-black">Upgrade to Pro (demo)</button>
                <div className="text-sm text-zinc-600">Upgrading here is a client-side demo. Wire real billing in lib/auth or server APIs.</div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button onClick={handleSignOut} className="text-sm text-rose-500">Sign out</button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-600">Not signed in. <a href="/auth/login" className="text-brand">Sign in</a></div>
      )}
    </div>
  );
}
