"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import auth, { getSession, signInDemo, signOut } from "../lib/auth";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Nav() {
  const { data: nextSession } = useSession();
  const [localSession, setLocalSession] = useState(auth.getSession());
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true);
    // sync session on mount
    setLocalSession(getSession());
    // basic storage listener so multiple tabs update UI
    function onStorage() {
      setLocalSession(getSession());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleDemoSignIn(pro = false) {
    signInDemo(pro ? "Pro Demo" : "Demo User", pro);
    setLocalSession(getSession());
  }

  function handleSignOut() {
    if (nextSession?.user) {
      nextAuthSignOut();
    } else {
      signOut();
      setLocalSession(getSession());
    }
  }

  const activeUser = nextSession?.user || localSession?.user;

  return (
    <div className="flex items-center w-full justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className={`${pacifico.className} text-lg font-semibold text-brand`}>
          Choosie
        </Link>

        {/* Mobile quick nav */}
        <nav className="flex md:hidden items-center gap-2">
          <Link href="/lists" className="text-sm text-zinc-700 hover:text-brand">
            Lists
          </Link>
        </nav>

        <nav className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-700 hover:text-brand">
            Home
          </Link>
          <Link href="/lists" className="text-sm text-zinc-700 hover:text-brand">
            Lists
          </Link>
          <Link href="/new" className="text-sm text-zinc-700 hover:text-brand">
            Create
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {!mounted ? (
          // Prevent hydration mismatch by showing nothing until client-side
          <div className="h-6 w-24" />
        ) : activeUser ? (
          <>
            {('isPro' in (activeUser as any) && (activeUser as any).isPro) && (
              <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-semibold text-black">
                Pro
              </span>
            )}
            <Link href="/account" className="text-sm text-zinc-700 hover:text-brand">
              {activeUser.name || (activeUser as any).email}
            </Link>
            <button onClick={handleSignOut} className="text-sm text-rose-500">
              Sign out
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href={`/auth/login?callbackUrl=${encodeURIComponent(pathname || '/')}`} className="text-sm text-zinc-700 hover:text-brand">
              Sign in
            </Link>
            <button onClick={() => handleDemoSignIn(false)} className="text-sm text-zinc-500">
              Demo
            </button>
            <button onClick={() => handleDemoSignIn(true)} className="rounded-full bg-amber-300 px-2 py-1 text-xs font-semibold text-black">
              Try Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
