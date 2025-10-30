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
