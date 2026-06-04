"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import auth, { getSession, signOut } from "../lib/auth";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import ChoosieLogo from "./ChoosieLogo";

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export default function Nav() {
  const { data: nextSession } = useSession();
  const [localSession, setLocalSession] = useState(auth.getSession());
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function handleSignOut() {
    if (nextSession?.user) {
      nextAuthSignOut();
    } else {
      signOut();
      setLocalSession(getSession());
    }
    setMenuOpen(false);
  }

  const activeUser = nextSession?.user || localSession?.user;
  const isPro = Boolean(activeUser && "isPro" in (activeUser as any) && (activeUser as any).isPro);
  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(pathname || '/')}`;

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2">
      <div className="flex min-w-0 items-center">
        <Link href="/" className="flex shrink-0 items-center">
          <ChoosieLogo size="nav" />
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <nav className="flex items-center gap-2 sm:gap-3 md:hidden">
          <Link href="/lists" className="text-sm text-zinc-700 hover:text-brand">
            Lists
          </Link>
          <Link href="/new" className="text-sm text-zinc-700 hover:text-brand">
            Create
          </Link>
        </nav>

        <nav className="hidden md:flex items-center gap-4">
          <Link href="/lists" className="text-sm text-zinc-700 hover:text-brand">
            Lists
          </Link>
          <Link href="/new" className="text-sm text-zinc-700 hover:text-brand">
            Create
          </Link>
        </nav>

        {!mounted ? (
          // Prevent hydration mismatch by showing nothing until client-side
          <div className="h-9 w-9" />
        ) : (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand/10 bg-white text-brand shadow-sm transition hover:border-consensus/40 hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-consensus/35"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              title="Account menu"
            >
              <UserIcon />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full z-[1000] mt-2 w-44 overflow-hidden rounded-xl border border-brand/10 bg-white py-1 text-sm shadow-xl shadow-slate-900/10"
                role="menu"
              >
                {activeUser ? (
                  <>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-zinc-700 hover:bg-brand-light hover:text-brand"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      My account
                    </Link>
                    {!isPro && (
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-zinc-700 hover:bg-brand-light hover:text-brand"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Try Pro
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={loginHref}
                      className="block px-4 py-2 text-zinc-700 hover:bg-brand-light hover:text-brand"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/pricing"
                      className="block px-4 py-2 text-zinc-700 hover:bg-brand-light hover:text-brand"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Try Pro
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
