"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import auth, { getSession, signOut } from "../lib/auth";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import ChoosieLogo from "./ChoosieLogo";
import { InstallChoosieButton } from "./InstallChoosiePrompt";

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
    <div className="flex w-full min-w-0 items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <ChoosieLogo size="nav" />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3 md:hidden">
          <Link href="/lists" className="text-sm text-zinc-700 hover:text-brand">
            My lists
          </Link>
          <Link href="/new" className="hidden text-sm text-zinc-700 hover:text-brand sm:inline">
            Create
          </Link>
        </nav>

        <nav className="hidden md:flex items-center gap-4">
          <Link href="/lists" className="text-sm text-zinc-700 hover:text-brand">
            My lists
          </Link>
          <Link href="/new" className="text-sm text-zinc-700 hover:text-brand">
            Create
          </Link>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {!mounted ? (
          // Prevent hydration mismatch by showing nothing until client-side
          <div className="h-6 w-24" />
        ) : activeUser ? (
          <>
            <InstallChoosieButton />
            {('isPro' in (activeUser as any) && (activeUser as any).isPro) && (
              <span className="rounded-full bg-brand px-2 py-1 text-xs font-semibold text-white">
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
            <InstallChoosieButton />
            <Link href={`/auth/login?callbackUrl=${encodeURIComponent(pathname || '/')}`} className="text-sm text-zinc-700 hover:text-brand">
              Sign in
            </Link>
            <Link href="/pricing" className="rounded-full bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand-dark">
              Try Pro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
