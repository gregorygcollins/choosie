import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that the request origin matches expected site origins.
 * Helps prevent CSRF attacks on state-changing operations.
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  
  // For same-origin requests (e.g., server-to-server), origin might be null
  // but referer should still match
  const requestOrigin = origin || (referer ? new URL(referer).origin : null);
  
  if (!requestOrigin) {
    // No origin/referer header - could be same-origin or malicious
    // For API routes called from the app, these should always be present
    return false;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(requestOrigin);
}

function getAllowedOrigins(): string[] {
  const envOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  const local = "http://localhost:3000";
  return [...envOrigins, siteUrl, vercelUrl, local].filter(Boolean) as string[];
}

/**
 * Creates a safe error response that doesn't leak internal details.
 * Logs the full error server-side for debugging.
 */
export function createErrorResponse(
  error: unknown,
  status: number = 400,
  publicMessage: string = "Request failed"
): NextResponse {
  // Log full error server-side
  console.error("API Error:", error);
  
  // Return sanitized message to client
  return NextResponse.json(
    { ok: false, error: publicMessage },
    { status }
  );
}

/**
 * Validates that a user session exists and optionally matches a resource owner.
 */
export function requireAuth(session: any, resourceUserId?: string): {
  ok: true;
  userId: string;
} | {
  ok: false;
  response: NextResponse;
} {
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // If checking ownership of a resource
  if (resourceUserId && session.user.id !== resourceUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Access denied" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: session.user.id };
}

// Participant token authorization for narrowing actions
export function requireParticipant(invitees: Array<any>, token: string): { ok: true; index: number; invitee: any } | { ok: false; response: NextResponse } {
  const idx = invitees.findIndex((i: any) => i && typeof i !== 'string' && i.token === token);
  if (idx < 0) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Invalid participant token' }, { status: 403 })
    };
  }
  // Validate token expiry
  const invitee = invitees[idx];
  const tokenValidation = validateParticipantToken(invitee.token);
  if (!tokenValidation.valid || tokenValidation.expired) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: tokenValidation.expired ? 'Token expired' : 'Invalid token' }, { status: 403 })
    };
  }
  return { ok: true, index: idx, invitee };
}

function validateParticipantToken(token: string): { valid: boolean; expired: boolean } {
  if (!token || typeof token !== 'string') return { valid: false, expired: false };
  const parts = token.split('.');
  if (parts.length !== 2) {
    // Legacy token without timestamp; allow for backwards compatibility
    return { valid: true, expired: false };
  }
  const [tokenPart, issuedAtStr] = parts;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return { valid: false, expired: false };
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const expired = (now - issuedAt) > sevenDays;
  return { valid: true, expired };
}
