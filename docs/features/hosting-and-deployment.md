# Hosting And Deployment

## Snapshot

- Status: `shipped`
- Last updated: `2026-07-11`
- Owner thread: `n/a`
- Current state: The web app is configured for Vercel Hobby deployment from `main` with static-first content routes, optional Supabase Auth/progress, and manual Supabase content sync. The native app has Expo/EAS internal build, production build, and store submission profiles.
- Target outcome: Codematica can be hosted on a free Vercel-provided URL without making anonymous browsing depend on Supabase credentials or paid add-ons.
- Code touchpoints:
  - `vercel.json`
  - `package.json`
  - `packages/core/src/content/index.ts`
  - `apps/web/src/components/PathScopedNextLink.tsx`
  - `apps/web/src/components/PathScopedPracticeCard.tsx`
  - `apps/mobile/eas.json`
- Primary tests:
  - `packages/core/src/content/index.test.ts`
  - `apps/web/e2e/specs/knowledge-browser.smoke.spec.ts`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`

## One-Minute Brief

Codematica deploys the web app as a Next.js app on Vercel. The first production web target is the free Vercel-provided URL, not a custom domain. The runtime remains local-index first: Vercel runs `npm run build`, which regenerates `packages/core/src/generated/content-index.json` before building `apps/web`, and the app serves the generated content without requiring Supabase runtime credentials.

Supabase remains the backend scaffold and manual sync destination for content search. Auth and saved progress are optional runtime features controlled by public anon-safe Supabase env vars.

The native Android/iOS app is configured for Expo/EAS internal builds, production builds, and EAS Submit from `apps/mobile`. It bundles the same generated content index through `@codematica/core` and uses the same optional Supabase progress tables through a native anon-safe client.

Detailed Play Console, Apple Developer Program, App Store Connect, EAS credential, metadata, and first-release steps live in `docs/runbooks/native-store-publishing.md`.

## Outcome / Contract

- Vercel imports `dano-gutierrez/codematica` and deploys the `main` branch as production.
- `vercel.json` owns the deployment defaults: Next.js framework, `npm ci`, and `npm run build`.
- `package.json` pins Node to `22.x` so local and hosted builds do not silently drift with Vercel defaults.
- npm workspaces own app/package boundaries: `apps/web`, `apps/mobile`, `packages/core`, and `packages/ui`.
- The hosted V1 app does not require Supabase env vars for anonymous browsing.
- Auth/progress require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; Apple login also requires `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true`.
- Native Auth/progress require `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; Apple login also requires `EXPO_PUBLIC_AUTH_APPLE_ENABLED=true`.
- `SUPABASE_SERVICE_ROLE_KEY` is for local/server-side sync only and must never be exposed to browser code.
- Article, diagram, and practice pages stay static/SSG for normal content traffic. Path-scoped `?path=` next-node links are selected by small client wrappers from build-time route maps.
- EAS internal and production builds use `apps/mobile/eas.json` profiles. Store submission can start through EAS Submit after Play Console/App Store Connect app records, credentials, metadata, screenshots, and review forms are configured outside the repo.
- Do not add Vercel paid storage, databases, analytics add-ons, custom domains, or automated Supabase branching in this milestone.

## Current State

The app builds locally with `npm run build`. Content pages have been refactored so the server pages no longer read `searchParams` for next-node navigation. Vercel deployment config and `.env.example` are committed. `apps/mobile/eas.json` defines development, preview, production, e2e-test, and submit profiles. The first live web deploy, first EAS internal build, first production native builds, and first EAS submissions still need to be created in their respective dashboard/CLI flows.

## Scope

### In Scope

- Vercel Hobby import and production deploy from `main`
- Vercel-provided production URL
- static-first route behavior for generated content pages
- Expo internal preview builds for Android/iOS
- Expo production builds and EAS Submit command/profile wiring
- manual Supabase migration/content sync guidance
- cost posture and upgrade triggers

### Out Of Scope

- custom domain and DNS setup
- Vercel Pro, paid analytics, Blob, Edge Config, or database products
- automated Supabase migrations or content sync in CI
- runtime Supabase search or storage reads beyond the optional Auth/progress contract
- public App Store / Play Store release decisions, review submission, and track promotion

### Assumptions

- The first hosted app is personal/non-commercial while using Vercel Hobby.
- Supabase Free is acceptable for early optional Auth/progress and manual content sync.
- Once Supabase stores irreplaceable user, progress, or authored data, backups and plan level must be reviewed before relying on Free for production durability.

## Detailed Behavior

### Deployment

- Import the GitHub repo into Vercel from `dano-gutierrez/codematica`.
- Keep the project root as `/`.
- Use the repo config: framework `nextjs`, install command `npm ci`, build command `npm run build`.
- Keep production branch as `main`.
- Configure Vercel Supabase runtime env vars only when enabling Auth/progress.
- After deployment, smoke-check `/`, `/browse`, one `/docs/...` route, one `/diagrams/...` route, and one `/practice/...` route.

### Data Model And Persistence

- Repo content remains canonical.
- `packages/core/src/generated/content-index.json` is regenerated during the Vercel build and remains the hosted web and bundled native runtime data source.
- `scripts/content/sync-supabase.ts` remains the manual Supabase upsert path using local `.env` values.
- `.env.example` documents web public Auth/progress variables, Expo public Auth/progress variables, and server-only sync variables without committing secrets.

### Native Builds

- `npm run mobile:dev` starts the Expo dev server.
- `npm run mobile:android` runs Android locally.
- `npm run mobile:ios` runs iOS locally and performs prebuild/CocoaPods automatically.
- `npm run mobile:prebuild:ios` and `npm run mobile:pods` refresh generated iOS pods manually.
- `npm run mobile:doctor` runs Expo health checks.
- `npm run mobile:build:preview` is the first intended internal distribution command once EAS credentials are configured.
- `npm run mobile:build:android` and `npm run mobile:build:ios` create store-ready production artifacts.
- `npm run mobile:submit:android` and `npm run mobile:submit:ios` submit the latest production builds through EAS Submit.
- The native app uses Expo Router routes that mirror web URLs and read `@codematica/core` directly.
- The native app must not use `SUPABASE_SERVICE_ROLE_KEY`; it uses anon-safe `EXPO_PUBLIC_*` variables only.
- Android submission defaults to the Play internal track. iOS submission uploads to App Store Connect/TestFlight; public App Store release still happens in App Store Connect after review submission.

### Cost And Upgrade Posture

- Vercel Hobby is the first deploy target. As of 2026-06-21, Vercel describes Hobby as free and usage-capped, while Pro starts at `$20/month`; Hobby cannot buy additional usage beyond included caps. Source: [Vercel Pricing](https://vercel.com/pricing).
- Supabase Free is acceptable for the early auth/progress scaffold. As of 2026-06-21, Supabase lists Free with 50,000 monthly active users, 500 MB database size, and 5 GB egress. Source: [Supabase Pricing](https://supabase.com/pricing).
- Upgrade review is required before heavy traffic, commercial usage, broader durable user progress, public auth launch, or any backend data that cannot be rebuilt from repo content.
- Supabase production readiness must be reviewed before durable user data. Supabase notes Free projects may pause after inactivity and Free database backups are not available for download. Source: [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod).

### Failure And Edge Handling

- If Vercel build fails, reproduce locally with `npm run build` before changing deployment settings.
- If a path-scoped content page is opened without `?path=`, it renders normally and hides the next-node link.
- If a Supabase sync fails, the hosted V1 app remains available because runtime browsing does not depend on Supabase.
- If EAS credentials are missing, local Expo development and tests still run; internal build creation waits for EAS account setup.

## Code Touchpoints

- `vercel.json`: Vercel project build defaults.
- `package.json`: Node engine pin and build command.
- `.env.example`: public auth/progress variables and server-only Supabase sync variable names.
- `packages/core/src/content/index.ts`: generated index access and path-node route helpers.
- `apps/web/src/components/PathScopedNextLink.tsx`: query-param-aware document and diagram next link.
- `apps/web/src/components/PathScopedPracticeCard.tsx`: query-param-aware practice card adapter.
- `apps/mobile/eas.json`: native internal, production, e2e, and submit profiles.
- `apps/mobile/app.config.ts`: native store identifiers, version counters, icon/splash assets, and EAS project linkage.
- `apps/mobile/assets/`: native icon, adaptive icon, and splash assets.
- `docs/runbooks/native-store-publishing.md`: operational native store account and first-release runbook.

## Test Plan

- Unit/integration: generated index helpers resolve single next routes and static route maps.
- Build: `npm run build` shows content routes as static/SSG where expected.
- E2E: mobile user follows a path, opens a document, reveals practice, uses next-node navigation, searches, and opens a diagram.
- Native: `npm run test -w @codematica/mobile` covers shared React Native search and practice screens; `npm run mobile:doctor` validates Expo project health.

## Open Questions

- When should Codematica add a custom domain?
- When should Supabase migrations and content sync move from manual local commands to CI?
- When should Auth/progress be enabled in production Vercel env vars?
- What final store identifier should replace or confirm `com.codematica.app` before the first public store record?
- When should native app metadata, screenshots, privacy forms, signing ownership, and public release channels be finalized?

## Decision Log

- `2026-06-21`: Use Vercel Hobby and the Vercel-provided URL for the first hosted deployment.
- `2026-06-21`: Keep content sync manual and server-side; add runtime Supabase env vars only for the optional Auth/progress feature.
- `2026-06-21`: Move path-scoped next-node selection from server `searchParams` to client wrappers so content pages remain static-first.
- `2026-07-11`: Add npm workspaces, shared core/UI packages, and Expo/EAS internal native build configuration while preserving Vercel as the web production target.
- `2026-07-11`: Add native app identity, store assets, production EAS build profiles, submit profiles, and root scripts for Play Console/App Store Connect publishing prep.

## Documentation Updates

- `docs/README.md`: Adds this feature doc to the reading map.
- `apps/mobile/README.md`: Points to the native store publishing runbook.
- `docs/engineering-overview.md`: Adds the hosting model, Vercel build boundary, and static-first route behavior.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/hosting-and-deployment.md first. Compare the documented deployment contract against vercel.json, package.json, packages/core/src/content/index.ts, apps/web/src/app/docs/[...slug]/page.tsx, apps/web/src/app/diagrams/[...slug]/page.tsx, apps/web/src/app/practice/[...slug]/page.tsx, apps/mobile/app.config.ts, apps/mobile/eas.json, and Vercel/EAS build output, then update tests and docs with any behavior changes.`
