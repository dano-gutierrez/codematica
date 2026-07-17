# Subscriptions And Content Gating

## Snapshot

- Status: `proposed`
- Last updated: `2026-07-17`
- Owner thread: `n/a`
- Current state: Codematica has optional Supabase Auth/progress, native EAS publishing prep, and a local generated content index that currently includes full paid-candidate content in web and native bundles.
- Target outcome: Codematica sells one all-access subscription on web, iOS, and Android while enforcing paid access server-side so unsubscribed clients cannot inspect private learning payloads from shipped bundles.
- Code touchpoints:
  - `packages/core/src/content/`
  - `scripts/content/build-index.ts`
  - `apps/web/src/app/api/`
  - `apps/web/src/app/docs/[...slug]/page.tsx`
  - `apps/web/src/components/KnowledgeBrowser.tsx`
  - `apps/mobile/src/lib/`
  - `packages/ui/src/screens.tsx`
  - `supabase/migrations/`
- Primary tests:
  - `packages/core/src/content/*.test.ts`
  - `apps/web/src/lib/subscription/*.test.ts`
  - `apps/web/e2e/specs/subscriptions.regression.spec.ts`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`

## One-Minute Brief

Subscriptions turn Codematica from anonymous local browsing into a paid learning product. Users can preview the catalog, create or sign into a Supabase account, subscribe on web with Stripe-backed RevenueCat Web, subscribe on native with Apple/Google in-app purchases through RevenueCat, and unlock the same `all_access` entitlement everywhere.

The major implementation constraint is content security. A visual paywall is not enough because the current generated index includes full Markdown, diagram source, exercise answers, interview solutions, and language drill data. Paid production clients must receive only public metadata until an authenticated, entitled request fetches a private content payload from server code.

## Outcome / Contract

- Supabase Auth is required before checkout or native purchase so every purchase maps to a stable `auth.users.id`.
- RevenueCat is the subscription source of truth across Apple App Store, Google Play, and Stripe Billing.
- The RevenueCat App User ID is the Supabase user id.
- The single entitlement is `all_access`.
- V1 products are monthly and annual all-access subscriptions:
  - Monthly base price: `$9.99/month`
  - Annual base price: `$79.99/year`
  - Introductory offer: first monthly period for `$0.99`
  - Launch availability: United States only
- Web checkout uses RevenueCat Web backed by Stripe Billing. Web subscribers can sign into native apps and unlock content.
- Native paywalls use Apple and Google purchase flows. V1 native apps must not link to web Stripe checkout from in-app paywalls.
- Unsubscribed users can view home, browse/search metadata, login, subscribe, account, support, privacy, and locked-content explanations.
- Unsubscribed users cannot view full documents, standalone diagrams, practice payloads, passive flashcard card bodies, interview solutions, Japanese detail/drill payloads, or full-text search snippets.
- Local Markdown and JSON remain canonical authoring sources. Supabase/RevenueCat store entitlements and user state, not authored content ownership.

## Current State

- Supabase Auth exists for web and native, but it is optional and tied only to progress.
- `packages/core/src/generated/content-index.json` is bundled into current web/native runtime code and includes private payloads.
- Store publishing docs in `docs/runbooks/native-store-publishing.md` now include RevenueCat product ids, provider setup, webhook checks, and Apple/Google/Stripe subscription setup notes.
- No subscription schema, webhook handler, paywall, checkout, RevenueCat SDK, Stripe setup, entitlement cache, protected content API, or bundle-sanitization test exists yet.

## Scope

### In Scope

- RevenueCat + Stripe + Apple + Google account setup instructions.
- Strict content payload split between public metadata and protected private content.
- Supabase entitlement cache written only by server-side webhook/admin code.
- Web subscribe/account/paywall flows.
- Native RevenueCat SDK purchase, restore, entitlement refresh, and paywall flows.
- Protected content APIs for web and native.
- Tests that prove unsubscribed bundles and API responses do not expose private content.

### Out Of Scope

- Multiple subscription tiers.
- Family sharing, teams, coupons beyond the first-month intro price, gifted subscriptions, or student discounts.
- Native external purchase links.
- Offline access to full paid content in v1.
- Replacing Markdown/JSON as the canonical content source.
- A custom tax/compliance engine beyond Stripe/store/provider setup guidance.

### Assumptions

- `com.codematica.app` remains the final bundle/package identifier.
- `EXPO_PUBLIC_WEB_BASE_URL` points native builds at the production web/API origin.
- RevenueCat webhooks are available for the chosen RevenueCat plan before production launch.
- Paid production may intentionally change the earlier anonymous-local-browsing product contract; docs must call out the mode switch clearly.

## Detailed Behavior

### Setup And Provider Configuration

- Stripe:
  - Create and activate the Stripe account before web checkout launch.
  - Complete identity, business, bank, and tax onboarding.
  - Configure Stripe Tax review for a US digital subscription and assign the closest digital-learning/product tax code.
  - Create the product `Codematica All Access` with recurring monthly and annual prices.
  - Configure Customer Portal so web subscribers can manage payment method, invoices, cancellation, and subscription changes.
  - Connect Stripe to RevenueCat and import the Stripe products/prices into RevenueCat.
- Apple:
  - Enroll in Apple Developer Program before TestFlight/subscription testing.
  - Create the App Store Connect app for `com.codematica.app`.
  - Accept paid-app agreements and complete banking/tax forms.
  - Create subscription group `Codematica All Access`.
  - Create monthly and annual auto-renewable subscriptions using stable product ids.
  - Configure the `$0.99` first-month introductory offer for the monthly subscription in the US territory.
  - Create/upload RevenueCat-required Apple credentials: app shared secret, in-app purchase key, and App Store Connect API key where applicable.
- Google:
  - Create the Play Console account and app record for `com.codematica.app`.
  - Upload an internal AAB before subscription products if Play Console requires an artifact first.
  - Create subscription `codematica_all_access` with monthly and annual base plans.
  - Configure a `$0.99` first-month offer for the monthly base plan in the US.
  - Create RevenueCat-compatible Google Play service credentials and real-time developer notification setup.
- RevenueCat:
  - Create one project with iOS, Android, and Web apps.
  - Connect Apple App Store, Google Play Store, and Stripe Billing.
  - Create entitlement `all_access`, offering `default`, packages `monthly` and `annual`, and map all platform products to that entitlement.
  - Configure API keys separately for development/test store and production store builds.
  - Configure a signed webhook to the web app endpoint and treat RevenueCat webhook state as the backend entitlement update path.

### Content Security

- Generate a public content index for client bundles that contains only metadata needed for catalog, routes, filters, titles, summaries, tags, track, difficulty, source paths when safe, and locked-state UI.
- Generate or load a private content payload for server code that includes Markdown, plain text, Mermaid source, exercise answers/explanations, interview solutions, language drill details, passive cards, and full-text search bodies.
- Client bundles must not contain known private fixture phrases from article bodies, exercise explanations, or interview solutions.
- Protected API responses must return private payloads only after authenticated entitlement verification.
- Native does not bundle full paid content for v1. Full paid screens fetch from the protected web API and show a retry/offline state when unavailable.

### Data Model And Persistence

- Add additive Supabase migrations for:
  - `user_entitlements`: `user_id`, `entitlement`, `status`, `expires_at`, `source`, `revenuecat_app_user_id`, `updated_at`, and raw event metadata needed for audit/debugging.
  - `subscription_events`: idempotent event log keyed by provider event id with payload, received timestamp, processed timestamp, and processing result.
- RLS lets authenticated users read only their own entitlement rows.
- Browser/native clients never write entitlement rows.
- Server-only code processes RevenueCat webhooks and updates entitlement cache with a service-role key or a Supabase privileged execution path.
- Entitlement status should consider active, trial/intro-active, grace/billing-retry, expired, canceled-at-period-end, refunded/revoked, and unknown/error states.

### Web UX

- Add `/subscribe` for signed-in purchase start, package comparison, and RevenueCat Web checkout.
- Add `/account/subscription` for entitlement status, manage subscription, restore/refresh status, and provider-specific management links.
- Existing locked routes render a paywall page or locked panel instead of private content when the user is signed out or lacks `all_access`.
- Browse/search remains useful as a preview catalog but does not expose body snippets from private content.
- Login redirects should preserve the intended protected route and return users to subscribe or the original content after entitlement is active.

### Native UX

- Add RevenueCat SDK setup in native app startup after Supabase session resolution.
- Native adapters expose subscription status, purchase package, restore purchases, and manage subscription actions to `@codematica/ui`.
- Native paywall shows monthly/annual packages from RevenueCat offerings and uses platform purchase flows.
- Native users can restore purchases and refresh entitlement state.
- Existing web subscribers can sign in on native and unlock through the same RevenueCat App User ID/Supabase user id link.
- Protected native routes show loading, locked, error, and subscribed content states without leaking private payloads in props.

### APIs

- `/api/subscription/status`: returns signed-in entitlement state from the Supabase cache and may refresh from RevenueCat server API if the cache is stale.
- `/api/subscription/revenuecat/webhook`: verifies webhook authorization/signature, logs idempotently, normalizes entitlement state, and updates `user_entitlements`.
- `/api/content/document/[...slug]`, `/api/content/diagram/[...slug]`, `/api/content/practice/[...slug]`, and equivalent interview/language endpoints return private payload only for `all_access`.
- Native calls protected APIs with Supabase access tokens; web server routes can use Supabase SSR cookies.

## Code Touchpoints

- `scripts/content/build-index.ts`: split public bundle and private server payload generation.
- `packages/core/src/content/`: public/private content schemas and lookup helpers.
- `packages/core/src/search.ts`: preview search over public metadata and subscribed search over private bodies if server-side search is added.
- `apps/web/src/app/api/`: subscription, webhook, and protected content endpoints.
- `apps/web/src/app/docs/[...slug]/page.tsx`: entitlement gate and private document fetch.
- `apps/web/src/app/diagrams/[...slug]/page.tsx`: entitlement gate and private Mermaid fetch.
- `apps/web/src/app/practice/[...slug]/page.tsx`: entitlement gate and private exercise fetch.
- `apps/web/src/components/KnowledgeBrowser.tsx`: preview metadata, locked affordances, and subscribe CTA.
- `apps/mobile/src/lib/adapters.tsx`: subscription adapter and authenticated content fetch adapter.
- `packages/ui/src/adapters.ts`: shared subscription/content adapter types.
- `packages/ui/src/screens.tsx`: paywall, subscription account, locked-state, and async private-content screens.
- `supabase/migrations/`: entitlement cache and event log tables with RLS.
- `.env.example`: RevenueCat, Stripe/public checkout, server webhook, and native API base variables.
- `docs/runbooks/native-store-publishing.md`: account-side RevenueCat/store setup checklist.

## Test Plan

- Unit:
  - Public index excludes Markdown bodies, plain text, diagram source, answer keys, explanations, and interview solution code.
  - Private payload lookup still resolves all current content by slug.
  - Entitlement normalization maps RevenueCat active/expired/refunded/grace states correctly.
  - Webhook idempotency ignores duplicate provider event ids.
- Integration:
  - Protected content APIs reject anonymous and unsubscribed users.
  - Protected content APIs return private payloads to entitled users.
  - Supabase entitlement RLS allows users to read only their own rows.
  - RevenueCat webhook handler verifies auth, persists event logs, and updates entitlements.
- Web E2E:
  - Anonymous user opens a document route and sees paywall, not `document-page`.
  - Signed-in unsubscribed user can browse metadata and reach `/subscribe`.
  - Mock-entitled user can open one document, one diagram, and one practice route.
  - Production/client JS response does not contain a known private fixture phrase.
- Mobile:
  - Signed-out protected route renders native locked state.
  - Signed-in unsubscribed user sees RevenueCat offering packages.
  - Mock-entitled user fetches and renders protected content.
  - Restore purchase action refreshes entitlement.
- Required local commands before implementation completion:
  - `npm run content:check`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run test:mobile`
  - targeted Playwright subscription regression
  - `npm run e2e:smoke`
  - `npm run mobile:doctor` before native purchase builds

## Open Questions

- Should there be a tiny permanent free sample set, or only preview metadata until subscribing?
- Should `/browse` search body text only after sign-in/subscription, or should all body search move server-side immediately?
- Which public privacy policy/support URLs will be used for provider setup and store review?
- Which RevenueCat plan is required for the desired webhook and web billing production usage?
- Who owns production tax/legal review for US digital subscriptions?

## Decision Log

- `2026-07-17`: Use RevenueCat as cross-platform entitlement authority and Stripe Billing as the web payment backend.
- `2026-07-17`: Use a single account-level `all_access` entitlement across web, iOS, and Android.
- `2026-07-17`: Require Supabase sign-in before checkout or native purchase.
- `2026-07-17`: Use one all-access monthly/annual subscription with US-only launch, `$9.99/month`, `$79.99/year`, and first monthly period at `$0.99`.
- `2026-07-17`: Keep native paywalls on Apple/Google purchase flows and avoid in-app links to web Stripe checkout for v1.
- `2026-07-17`: Treat strict server-gated content as a requirement; UX-only paywalls are not acceptable for paid production.

## References

- RevenueCat Expo SDK: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat Stripe Billing: https://www.revenuecat.com/docs/web/integrations/stripe
- RevenueCat Web SDK: https://www.revenuecat.com/docs/web/web-billing/web-sdk
- RevenueCat webhooks: https://www.revenuecat.com/docs/integrations/webhooks
- RevenueCat store connections: https://www.revenuecat.com/docs/projects/connect-a-store
- Stripe Billing quickstart: https://docs.stripe.com/billing/quickstart
- Stripe Customer Portal: https://docs.stripe.com/customer-management
- Stripe Tax digital products: https://docs.stripe.com/tax/digital-products
- Apple auto-renewable subscriptions: https://developer.apple.com/app-store/subscriptions/
- App Store Connect subscription setup: https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/
- Google Play Billing subscriptions: https://developer.android.com/google/play/billing/subscriptions
- Google Play payments policy: https://support.google.com/googleplay/android-developer/answer/10281818
- Expo in-app purchases guide: https://docs.expo.dev/guides/in-app-purchases/

## Documentation Updates

- `docs/README.md`: Add this feature doc to the docs hub and route subscription setup to the native publishing runbook.
- Nested READMEs: Update app/package READMEs when subscription implementation adds new commands, env vars, or runtime requirements.
- `docs/engineering-overview.md`: Update when implementation changes the runtime content flow from local-index-only to public-index plus protected content APIs.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/features/subscriptions-and-content-gating.md, docs/features/auth-and-progress.md, docs/features/native-mobile-deployment.md, and docs/runbooks/native-store-publishing.md first. Confirm the current branch is based on the intended integration branch, then implement the subscription plan with TDD: start with public/private content split tests, add entitlement schema/API tests, wire web and native paywalls, update docs, and verify that unsubscribed client bundles cannot expose private content.`
