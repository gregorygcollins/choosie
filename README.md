# 🎬 Choosie

**Turn your passions into shared experiences.**

Choosie is a playful, future-oriented app that helps groups decide what to do next—together.  
Make a list of what you’re excited to watch, read, sing, or try, hand the phone around (or share a link), and let the group narrow it down until one perfect winner remains.  
No scrolling. No bickering. No compromise.

---

## 🚀 v1 Purpose

This version is designed to be **lean, simple, and complete**—a joyful loop from idea to shared decision.

**One clean experience:**
1. **Create a list** – Add titles and optional notes.  
2. **Narrow together** – Each round reduces the list automatically.  
3. **Celebrate** – End with confetti and a clear choice.

That’s the whole story.  
When this flow works smoothly and intuitively, Choosie v1 is *done.*

---

## 🧩 Core Features

| Feature | Description |
|----------|-------------|
| **Create & Save Lists** | Build lists locally (movies, songs, recipes, etc.) and keep them in `localStorage`. |
| **Automatic Narrowing** | Choosie decides how many rounds it takes to reach one winner. |
| **Resume Anytime** | Saved progress means you can pause and continue later. |
| **Celebration Screen** | Joyful final reveal with confetti. |
| **Responsive Layout** | Works on phones, tablets, and desktops. |

---

## 🗑️ Deferred for v2+

- Scheduling or virtual events  
- Narrowing-parameter sliders or “advanced” tuning  
- Authentication and billing  
- Countdown or calendar integrations  
- Premium route protection  

These live in the **v2 backlog**; they don’t belong in v1.

---

## 🧠 Design Principles

1. **Playful first.**  It should feel like a game, not an app.  
2. **Future-oriented.**  Focus on what people *want to do next*, not what they already liked.  
3. **Shared discovery.**  The magic moment is finding overlap, not winning an argument.  
4. **Minimal controls.**  No settings—just start, narrow, celebrate.  
5. **One emotion per screen.**  Each step should feel calm, clear, and purposeful.

---

## 🧭 v1 Completion Checklist

- [ ] A user can create, narrow, and finish a list in under two minutes.  
- [ ] No dead ends or broken links.  
- [ ] App feels coherent, light, and social.  
- [ ] Codebase compiles cleanly—no unused routes or dependencies.  
- [ ] This README describes the product accurately.

When these boxes are checked, **freeze development** and polish visuals and copy only.

---

## 🪄 Local Development

```bash
npm install
npm run dev
```

Visit **http://localhost:3000** to view the app.

---

## � Auth, DB, and Billing (Scaffolded)

This repo now includes scaffolding for authentication (NextAuth with Google), a database (Prisma with SQLite for local dev), and Stripe billing (initializer only).

- Prisma schema: `prisma/schema.prisma` (SQLite by default; switch to Postgres in production)
- NextAuth route: `app/api/auth/[...nextauth]/route.ts` via `lib/auth.server.ts`
- Stripe initializer: `lib/stripe.ts`
- Session probe endpoint: `GET /api/me`

Setup:

1. Copy `.env.example` to `.env` and fill in values. For local dev, SQLite defaults are set.
2. Generate Prisma client and apply migrations:
	- `npx prisma generate`
	- `npx prisma migrate dev --name init`
3. Create a Google OAuth app and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Start the dev server and hit `/api/me` to verify auth wiring.
5. For Stripe, set `STRIPE_SECRET_KEY` now; Checkout and webhooks will be added next.

When deploying to Postgres, change the Prisma datasource provider to `postgresql` and set `DATABASE_URL`. Then run `prisma migrate deploy`.

---

## 🚢 Deployment Checklist (Vercel)

### Required Environment Variables

Set these in your Vercel project (Settings → Environment Variables) for **Production** and **Preview**:

**Authentication & App**
- `NEXTAUTH_URL` = `https://your-vercel-domain.vercel.app` (or custom domain)
- `NEXTAUTH_SECRET` = (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` = (from Google Cloud Console OAuth app)
- `GOOGLE_CLIENT_SECRET` = (from Google Cloud Console OAuth app)

**Database**
- `DATABASE_URL` = (PostgreSQL connection string, e.g., from Vercel Postgres or Supabase)

**Stripe**
- `STRIPE_SECRET_KEY` = (from Stripe Dashboard → Developers → API keys)
- `STRIPE_WEBHOOK_SECRET` = (from Stripe Dashboard → Developers → Webhooks; set endpoint to `https://your-domain.vercel.app/api/stripe/webhook`)

**API Keys**
- `GOOGLE_BOOKS_API_KEY` = (from Google Cloud Console)
- `SPOONACULAR_API_KEY` = (from Spoonacular API Dashboard)
- `SPOTIFY_CLIENT_ID` = (from Spotify Developer Dashboard)
- `SPOTIFY_CLIENT_SECRET` = (from Spotify Developer Dashboard)

### Post-Deployment Steps

1. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`
   - Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET` in Vercel

2. **Run Database Migrations**
   ```bash
   # After first deploy with DATABASE_URL set
   npx prisma migrate deploy
   ```

3. **Verify Deployment**
   - Visit `/api/health` to check server status
   - Visit `/api/me` to verify auth flow
   - Test sign-in with Google OAuth
   - Test creating a list and narrowing flow

### Local Development vs. Production

- **Local**: Uses SQLite (`prisma/dev.db`) and `.env` file
- **Production**: Uses PostgreSQL and Vercel environment variables
- Both require same env vars (except `DATABASE_URL` format differs)

---

## 💛 Credits & Voice

Built with **Next.js 16 + Tailwind CSS**.  
Designed to turn small choices into shared magic.  
Playful on the surface, quietly profound underneath.

---

## 📍 Future Vision

Choosie will grow toward asynchronous and virtual sessions—planning nights, trips, or book clubs weeks ahead.  
But the heart of Choosie will always stay the same:  
**helping people discover what they’ll love—together.**