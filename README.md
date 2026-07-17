# Codematica

Codematica is a mobile-first, gamified learning app. V1 browses, renders, searches, and practices repo-authored Markdown and structured study content for software engineering and beginner Japanese, including embedded and external Mermaid diagrams.

## Stack

- Next.js App Router
- Expo Router for Android/iOS
- React and TypeScript
- Tailwind CSS
- React Native primitives with shared design tokens
- plain Markdown content under `content/knowledge/`
- Mermaid diagram files under `content/diagrams/`
- local Japanese language catalogs under `content/languages/`
- generated local search index at `packages/core/src/generated/content-index.json`
- optional Supabase Auth and saved progress
- optional Supabase sync scaffold
- Vercel deployment config for free-tier hosting

## Getting Started

Install once from the repo root:

```bash
npm install
npm run content:index
```

Run the unchanged Next/Vercel web app:

```bash
npm run dev
```

Open `http://127.0.0.1:3100`.

Run the Expo native app:

```bash
npm run mobile:dev
npm run mobile:android
npm run mobile:ios
```

`npm run mobile:ios` runs Expo prebuild and CocoaPods automatically. If you need to inspect or refresh generated pods manually, run `npm run mobile:prebuild:ios` and `npm run mobile:pods`.

## Deployment

The first hosted target is Vercel Hobby on the Vercel-provided URL. Import `dano-gutierrez/codematica`, keep `main` as the production branch, and use the checked-in `vercel.json` defaults:

```text
Install command: npm ci
Build command: npm run build
Framework: Next.js
```

No Supabase environment variables are required for anonymous browsing. To enable login and cross-device progress sync, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; set `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true` only after Apple OAuth is configured.

Native Android/iOS builds use EAS from `apps/mobile`. Configure the final app identity in `.env` before creating store records:

```bash
EXPO_APP_IDENTIFIER=com.codematica.app
EXPO_IOS_BUILD_NUMBER=1
EXPO_ANDROID_VERSION_CODE=1
EXPO_OWNER=your-expo-account
EAS_PROJECT_ID=your-eas-project-id
```

Then login, link the EAS project, configure credentials, and build:

```bash
npm run mobile:eas:login
npm run mobile:eas:init
npm run mobile:credentials:android
npm run mobile:credentials:ios
npm run mobile:build:preview
npm run mobile:build:android
npm run mobile:build:ios
```

Submit the latest production builds after Play Console and App Store Connect app records, metadata, screenshots, privacy forms, and signing credentials are ready:

```bash
npm run mobile:submit:android
npm run mobile:submit:ios
```

Android submission defaults to the Play internal track. iOS submission uploads to App Store Connect/TestFlight; public App Store release still requires selecting the build and submitting it for review in App Store Connect. Detailed native instructions live in `apps/mobile/README.md`.

Full account setup and publishing steps live in `docs/runbooks/native-store-publishing.md`. Public app-store publishing is not fully free: Google Play Console requires a one-time developer registration fee, and App Store distribution requires Apple Developer Program membership unless Apple grants a fee waiver.

## Useful Commands

```bash
npm run web:dev
npm run web:build
npm run content:index
npm run content:check
npm run typecheck
npm run lint
npm test
npm run test:mobile
npm run e2e:smoke
npm run mobile:doctor
npm run mobile:build:preview
```

## Content

Markdown is canonical. Add articles to `content/knowledge/` with the frontmatter contract defined in `packages/core/src/content/schema.ts`. Add external Mermaid diagrams to `content/diagrams/`, then reference them from article frontmatter with `diagramRefs`. Add human-language character and vocabulary data to `content/languages/`; writing exercises reference those character slugs from `content/exercises/`.

Supabase is optional for browsing. Apply the migrations in `supabase/migrations/` before enabling Auth/progress. To sync indexed content manually, copy `.env.example` to `.env`, configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and run:

```bash
npm run content:sync:supabase
```

Keep the service role key server-side only. Do not add it to browser code or Vercel runtime environment variables.

## Workspace Layout

- `apps/web`: existing Next/Vercel web app.
- `apps/mobile`: Expo Router Android/iOS app with EAS internal, production, and submit profiles.
- `packages/core`: shared content, search, practice, and progress contracts.
- `packages/ui`: shared React Native-compatible screens and design tokens.
