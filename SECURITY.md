# Security Improvements

This document outlines the security hardening measures implemented in Choosie.

## Implemented Security Measures

### 1. Security Headers (via next.config.ts)
- ✅ **Content Security Policy (CSP)**: Restricts resource loading to trusted sources
  - Whitelists only required third-party domains (Stripe, TMDB, Spotify, Google, Spoonacular, Vercel Insights)
  - Blocks inline script attributes (`script-src-attr 'none'`) and disallows object embeds
  - Adds `worker-src`, `font-src`, and `media-src` restrictions plus `upgrade-insecure-requests`
- ✅ **HSTS** (production only): Forces HTTPS connections (max-age: 2 years)
- ✅ **X-Frame-Options: DENY**: Prevents clickjacking attacks
- ✅ **X-Content-Type-Options: nosniff**: Prevents MIME sniffing
- ✅ **Referrer-Policy**: Controls referrer information leakage
- ✅ **Permissions-Policy**: Disables unnecessary browser features (camera, mic, etc.)

### 2. CORS Improvements (lib/cors.ts)
- ✅ **No wildcard origins**: Only echoes back validated origins
- ✅ **Origin allowlist**: Checks against `ALLOWED_ORIGINS`, `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL`, and localhost
- ✅ **URL validation**: Parses and validates origin strings before allowing

### 3. Input Validation (lib/validation.ts)
- ✅ **Zod schemas** for all API inputs:
  - `createListSchema`: Title (1-200 chars), items array (max 100), notes (max 1000 chars)
  - `addMovieSchema`: List ID, title, optional notes
  - `getListSchema`: List ID validation
  - `finalizeWatchlistSchema`: List ID, winner ID, history
- ✅ **Request size limits**: Prevents memory exhaustion attacks
- ✅ **Type-safe validation**: Runtime validation with TypeScript inference

### 4. Authentication & Authorization (lib/security.ts)
- ✅ **Origin validation**: Checks Origin/Referer headers to prevent CSRF
- ✅ **Authentication checks**: `requireAuth()` helper enforces user login
- ✅ **Ownership validation**: Ensures users can only modify their own lists
- ✅ **Safe error responses**: Logs full errors server-side, returns generic messages to clients

### 5. Rate Limiting (lib/rateLimit.ts)
- ✅ **Redis-backed per-endpoint limits** (Upstash Redis REST API)
  - Durable across serverless invocations with automatic fallback to in-memory if Redis is unavailable
- ✅ **Per-endpoint thresholds**:
  - `createList`: 30 requests/minute
  - `addMovie`: 60 requests/minute
  - `getList`: 120 requests/minute
  - `finalizeWatchlist`: 30 requests/minute
  - `bookSearch`: 60 requests/minute
  - `spotifySearch`: 60 requests/minute
- ✅ **Automatic Retry-After headers**: Clients receive RFC-compliant rate limit metadata

### 6. Auth Configuration (lib/auth.server.ts)
- ✅ **Removed dangerous account linking**: Disabled `allowDangerousEmailAccountLinking`
- ✅ **Database sessions**: Using Prisma adapter with session table
- ✅ **Secure session strategy**: Server-side session validation

### 7. Stripe Webhook Security (app/api/stripe/webhook/route.ts)
- ✅ **Signature verification**: Validates webhook authenticity using `STRIPE_WEBHOOK_SECRET`
- ✅ **Raw body parsing**: Correctly handles webhook payload for signature check
- ✅ **Enhanced error logging**: Logs event type, ID, and stack traces for debugging
- ✅ **Idempotent handling**: Returns 200 on data errors to prevent infinite retries

### 8. Environment Auditing
- ✅ **Centralized env checker (`lib/env.ts`)**: Validates required variables on boot (throws in production if missing)
- ✅ **Debug endpoint (`/api/debug/env`)**: Surfaces masked env status, allowed origins, and missing keys
- ✅ **Shared origin helper**: All origin validation now uses a single source of truth

### 9. API Route Hardening
All `/api/choosie/*` routes now include:
- Origin validation (CSRF protection)
- Input validation with zod
- Authentication/ownership checks
- Rate limiting
- Safe error handling (no internal details leaked)

### 10. Request Size Limits
- ✅ **Global 1MB cap** enforced in `middleware.ts` for all non-GET `/api/*` requests (configurable via `MAX_BODY_BYTES`)
- ✅ **413 handler** returns structured JSON so clients can gracefully retry with smaller payloads

## Environment Variables Required

Add to your `.env` file and Vercel dashboard:

```bash
# Optional: Comma-separated list of allowed origins for CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Your primary site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Vercel automatically sets `VERCEL_URL` for preview deployments.

## Testing Security

### Test CORS Protection
```bash
# Should fail with 403 (invalid origin)
curl -X POST https://yoursite.com/api/choosie/createList \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

### Test Rate Limiting
```bash
# Repeatedly hit an endpoint - should get 429 after limit
for i in {1..70}; do
  curl https://yoursite.com/api/books/search?query=test
done
```

### Test Input Validation
```bash
# Should fail with validation error (title too long)
curl -X POST https://yoursite.com/api/choosie/createList \
  -H "Content-Type: application/json" \
  -d '{"title":"'$(python3 -c "print('A'*300))'"}' 
```

## Known Limitations & Future Improvements

### High Priority
- [ ] **CSRF tokens for authenticated users**: Add token-based CSRF protection for logged-in state changes

### Medium Priority
- [ ] **API versioning**: Add `/api/v1/` prefix for future-proofing
- [ ] **Webhook event deduplication**: Track processed Stripe event IDs to handle retries
- [ ] **Subscription status monitoring**: Alert on failed payments or cancelations
- [ ] **Content Security Policy reporting**: Add `report-uri` to monitor CSP violations

### Low Priority
- [ ] **Session timeout configuration**: Make session expiry configurable
- [ ] **Audit logging**: Log security-relevant events (failed auth, suspicious activity)
- [ ] **Image domain restrictions**: If using `next/image`, restrict `remotePatterns`

## Security Checklist for Deployment

Before deploying to production:

- [ ] Set `ALLOWED_ORIGINS` in Vercel env vars
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel env vars
- [ ] Verify `STRIPE_WEBHOOK_SECRET` matches production webhook endpoint
- [ ] Confirm `NEXTAUTH_SECRET` is a strong random value (>= 32 chars)
- [ ] Enable Vercel's firewall/DDoS protection if available
- [ ] Review CSP violations in browser console
- [ ] Test authentication flow end-to-end
- [ ] Test payment flow with Stripe test mode first

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourdomain.com instead of opening a public issue.
