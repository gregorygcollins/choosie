# Production Deployment Checklist

## Completed ✅

### Security & Authentication
- ✅ NextAuth v5 OAuth configured (Google + GitHub)
- ✅ Database persistence enabled (Neon PostgreSQL)
- ✅ Debug endpoints secured (require auth in production)
- ✅ Environment variables verified
- ✅ Canonical domain redirect configured
- ✅ CORS, CSP, HSTS headers configured

### SEO & Metadata
- ✅ Page metadata with title, description, keywords
- ✅ Open Graph tags configured
- ✅ Twitter Card tags configured
- ✅ Robots.txt created
- ✅ Sitemap.xml implemented
- ✅ Favicon and manifest references added

### Legal & Compliance
- ✅ Privacy Policy page created
- ✅ Terms of Service page created
- ✅ Footer with legal links added
- ✅ Contact email updated (hello@choosie.app)

### Code Quality
- ✅ Debug logging removed from auth callbacks
- ✅ Error boundary component added
- ✅ Placeholder content updated

## Pending 🔶

### Before Launch

#### Custom Domain (CRITICAL)
- [ ] Purchase/configure custom domain
- [ ] Update NEXT_PUBLIC_SITE_URL to custom domain
- [ ] Update all references to choosie-seven.vercel.app
- [ ] Configure DNS records
- [ ] Update OAuth redirect URIs in Google/GitHub console

#### Stripe Setup (CRITICAL)
- [ ] Switch from test mode to live mode
- [ ] Create live mode products and prices
- [ ] Configure live mode webhook endpoint
- [ ] Update webhook secret (STRIPE_WEBHOOK_SECRET)
- [ ] Test subscription flow with real card
- [ ] Verify cancellation flow works

#### Security Hardening
- [ ] Review all API endpoints for auth requirements
- [x] Implement proper rate limiting (replace in-memory with Redis/Upstash)
- [ ] Add input validation to all user-facing forms
- [ ] Review CORS allowed origins
- [ ] Add security headers audit
- [x] Configure Content Security Policy stricter rules

#### Assets
- [x] Create and add favicon.ico to /public
- [x] Create and add apple-touch-icon.png to /public
- [x] Create and add og-image.png to /public (1200x630)
- [x] Create and add site.webmanifest to /public

### Nice to Have

#### Monitoring & Analytics
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Add analytics (Vercel Analytics, Google Analytics, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up logging infrastructure
- [ ] Create performance budgets

#### Performance
- [ ] Audit bundle size
- [ ] Add loading skeletons for async content
- [ ] Optimize images (use Next.js Image component)
- [ ] Test on slow 3G connection
- [ ] Run Lighthouse audit

#### Testing
- [ ] Test all user flows end-to-end
- [ ] Test on mobile devices
- [ ] Test in different browsers (Chrome, Safari, Firefox)
- [ ] Test sign-in with both Google and GitHub
- [ ] Test free → Pro upgrade flow
- [ ] Test Pro → canceled flow

#### Documentation
- [x] Update README with production setup instructions
- [x] Document API rate limits
- [x] Document environment variables
- [ ] Create troubleshooting guide
- [x] Document deployment process

#### Marketing
- [ ] Create social media preview images
- [ ] Set up email service (for transactional emails)
- [ ] Create welcome email template
- [ ] Create subscription confirmation email
- [ ] Add meta pixel if planning paid ads

## Environment Variables to Review

### Required for Production
- `DATABASE_URL` - Neon PostgreSQL (configured ✅)
- `NEXTAUTH_SECRET` - Random secret (configured ✅)
- `NEXTAUTH_URL` - Update to custom domain when ready
- `NEXT_PUBLIC_SITE_URL` - Update to custom domain when ready
- `GOOGLE_CLIENT_ID` - Update redirect URIs when domain changes
- `GOOGLE_CLIENT_SECRET` - Configured ✅

### Stripe (Need Live Mode Keys)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Currently test key
- `STRIPE_SECRET_KEY` - Currently test key
- `STRIPE_WEBHOOK_SECRET` - Currently test key
- `STRIPE_PRICE_ID` - Need to create in live mode

### API Keys (Review Usage)
- `TMDB_API_KEY` - Movies (configured ✅)
- `SPOTIFY_CLIENT_ID` - Music (configured ✅)
- `SPOTIFY_CLIENT_SECRET` - Music (configured ✅)
- `GOOGLE_BOOKS_API_KEY` - Books (configured ✅)
- `SPOONACULAR_API_KEY` - Food (configured ✅)

## Post-Launch

- [ ] Monitor error rates
- [ ] Watch sign-up conversion
- [ ] Track API usage/costs
- [ ] Collect user feedback
- [ ] Plan feature roadmap
- [ ] Set up customer support channel

## Notes

- Database migrations are run explicitly with `npm run prisma:deploy`; Vercel builds only run `next build` to avoid Prisma advisory-lock timeouts.
- Authentication currently works on https://choosie-seven.vercel.app
- Preview deployments redirect to canonical domain to prevent auth issues
- Free tier users get basic features, Pro users get unlimited lists + advanced features
