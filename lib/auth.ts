// Client compatibility helpers for code paths that predate NextAuth.
// Real authentication now comes from next-auth/react on the client and
// lib/auth.server on API routes.

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

export function saveSession(session: Session) {
  void session;
}

export function clearSession() {
}

export function getSession(): Session {
  return { user: null };
}

export function signInDemo(name = "Demo User", isPro = false) {
  void name;
  void isPro;
  return getSession();
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
