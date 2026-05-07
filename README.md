# Choosie

**Do only what you love, together.**

Choosie helps groups decide what to do next. Make a list of what you are excited to watch, read, sing, or try, hand the phone around or share a link, and let the group narrow it down until one winner remains.

No scrolling. No bickering. No compromise.

## Product

Choosie supports a free movie-list flow plus Pro features for saved unlimited movie, book, music, food, and anything lists.

## Core Features

| Feature | Description |
| --- | --- |
| Create and save lists | Build and save lists with local fallback and server persistence when signed in. |
| Automatic narrowing | Choosie computes the narrowing plan and guides the group to a winner. |
| In-person and virtual flows | Pass a device around or generate role links for remote narrowing. |
| Auth and accounts | NextAuth credentials/OAuth with Prisma-backed users and sessions. |
| Billing | Stripe Checkout, webhook sync, and customer portal routes. |
| Content search | Optional integrations for movies, books, food, and music. |
| Celebration screen | Joyful final reveal with confetti. |
| Responsive layout | Works on phones, tablets, and desktops. |

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the app.

## Auth, DB, and Billing

This repo includes authentication, Prisma persistence, and Stripe billing routes.

- Prisma schema: `prisma/schema.prisma`
- NextAuth route: `app/api/auth/[...nextauth]/route.ts` via `lib/auth.server.ts`
- Stripe helpers and routes: `lib/stripe.ts`, `lib/stripeCheckout.ts`, `app/api/stripe/*`
- Session probe endpoint: `GET /api/me`

Setup:

1. Copy `.env.example` to `.env` and fill in values. Local development can use SQLite.
2. Generate Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

3. Create OAuth apps and set the relevant Google/GitHub client variables.
4. Start the dev server and hit `/api/me` to verify auth wiring.
5. For Stripe, set `STRIPE_SECRET_KEY`, a price variable, and `STRIPE_WEBHOOK_SECRET`.

When deploying to Postgres, set `DATABASE_URL` to the production Postgres connection string and run `npm run prisma:deploy`.

## Deployment Checklist

Set these in Vercel for Production and Preview as appropriate.

**Authentication and App**

- `NEXTAUTH_URL`: canonical public origin, for example `https://your-domain.com`
- `NEXT_PUBLIC_SITE_URL`: same canonical public origin used for redirects and metadata
- `NEXTAUTH_SECRET`: generate with `openssl rand -base64 32`
- `ALLOWED_ORIGINS`: comma-separated allowed request origins
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: required if Google sign-in is enabled
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: required if GitHub sign-in is enabled

**Database**

- `DATABASE_URL`: production Postgres connection string

**Stripe**

- `STRIPE_SECRET_KEY`: live-mode secret key for production
- `STRIPE_WEBHOOK_SECRET`: webhook signing secret for `/api/stripe/webhook`
- `STRIPE_PRICE_ID` or `STRIPE_PRICE_LOOKUP_KEY` or `STRIPE_PRODUCT_ID`: recurring Pro price configuration

**Content APIs**

- `TMDB_API_KEY`
- `GOOGLE_BOOKS_API_KEY`
- `SPOONACULAR_API_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

**Rate Limits and Guards**

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: Redis-backed rate limiting in production
- `MAX_BODY_BYTES`: API request body cap; defaults to 1 MB

## Post-Deployment Steps

1. Configure the Stripe webhook endpoint at `https://your-domain.com/api/stripe/webhook`.
2. Subscribe the webhook to `checkout.session.completed` and `customer.subscription.*`.
3. Run database migrations with `npm run prisma:deploy`.
4. Visit `/api/health` to check server status.
5. Visit `/api/me` to verify auth wiring.
6. Test sign-in, list creation, narrowing, Stripe Checkout success/cancel, webhook delivery, and portal access.

## Quality Gates

Run these before deploying:

```bash
npm run lint
npm run test
npm run build
```

`next build` runs ESLint and TypeScript validation. Existing legacy type-safety cleanup items are warnings, but lint errors should block release.

## Credits and Voice

Built with Next.js and Tailwind CSS. Designed to turn small choices into shared decisions.
