// Lightweight auth & billing scaffolding
// This file provides types and simple client-side helpers to represent
// a session, user, and premium access. It's intentionally minimal so
// real auth (NextAuth, Clerk, Supabase, etc.) and billing (Stripe)
// can be wired in later without changing the rest of the app.

export type User = {
  id: string;
  name?: string;
  email?: string;
  isPro?: boolean;
};

export type Session = {
  user: User | null;
  token?: string;
};

const STORAGE_KEY = "choosie_session_v1";

// Client-side helpers -----------------------------------------------------
// Note: these are synchronous/local-only placeholders. Replace with
// real server-backed auth flows when ready.

export function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    // ignore
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

export function getSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null };
    return JSON.parse(raw) as Session;
  } catch (e) {
    return { user: null };
  }
}

export function signInDemo(name = "Demo User", isPro = false) {
  const user: User = {
    id: `local_${Date.now()}`,
    name,
    email: `${name.replace(/\s+/g, "").toLowerCase()}@local`,
    isPro,
  };
  const session: Session = { user };
  saveSession(session);
  return session;
}

export function signOut() {
  clearSession();
}

export function isPremium(session: Session | null | undefined) {
  return !!(session && session.user && session.user.isPro);
}

// Helper for protecting pages/components. With server-side auth,
// this would redirect/throw if missing. For now it returns boolean and
// documents the intended behavior.
export function requirePremium(session: Session | null | undefined) {
  if (!isPremium(session)) {
    return {
      ok: false,
      message: "Premium access required",
    } as const;
  }
  return { ok: true } as const;
}

// Billing placeholder: a small interface that real billing code can
// implement (e.g., Stripe customer/subscription state). Currently
// we only expose a type and a simple stub to be replaced.
export type BillingInfo = {
  customerId?: string;
  subscriptionActive?: boolean;
  plan?: string;
};

export function getBillingInfoForUser(_userId: string): BillingInfo {
  // stub: in a real app, call your billing service here
  return { subscriptionActive: false };
}

export default {
  getSession,
  saveSession,
  clearSession,
  signInDemo,
  signOut,
  isPremium,
  requirePremium,
  getBillingInfoForUser,
};
