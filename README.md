# Codematica

Codematica is a mobile-first, gamified app for learning software engineering and beginner Japanese. V1 lets learners browse, render, search, and practice repo-authored Markdown and structured content. It includes an open JF/CEFR Pre-A1/A1 roadmap, embedded and external Mermaid diagrams, handwriting, review, and optional cross-device progress.

## Brand assets

Patch is the app's approved identity. The [brand guide](assets/brand/README.md) contains the selected logo, favicon and launcher artwork. Run `npm run brand:assets` to regenerate all web/native exports, `npm run brand:check` to verify them, and `npm run brand:preview` to inspect the small-size and mask checks.

## Stack

- Next.js App Router
- Expo Router for Android/iOS
- React and TypeScript
- Tailwind CSS
- React Native primitives with shared design tokens
- plain Markdown content under `content/knowledge/`
- Mermaid diagram files under `content/diagrams/`
- schema-v8 Japanese language, stage, audio-manifest, and resource catalogs under `content/languages/`
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

Run the Next/Vercel web app:

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

Anonymous browsing needs no Supabase environment variables. To enable login and cross-device progress sync, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; set `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true` only after Apple OAuth is configured.

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

Full account setup and publishing steps live in `docs/runbooks/native-store-publishing.md`. Google Play Console requires a one-time developer registration fee. App Store distribution requires Apple Developer Program membership unless Apple grants a fee waiver.

## Useful Commands

```bash
npm run web:dev
npm run web:build
npm run content:index
npm run content:check
npm run content:audio
npm run typecheck
npm run lint
npm test
npm run test:mobile
npm run mobile:e2e:code-layout -- --session snippets-ios
npm run e2e:smoke
npm run mobile:doctor
npm run mobile:build:preview
```

For native code scrolling checks, open a simulator session first; see [the native layout regression guide](apps/mobile/e2e/README.md).

## Content

Markdown is canonical.

- Add articles to `content/knowledge/` using the frontmatter contract in `packages/core/src/content/schema.ts`.
- Add external Mermaid diagrams to `content/diagrams/`, then reference them in article frontmatter with `diagramRefs`.
- Add human-language characters, vocabulary, audio metadata, and resources with rights metadata to `content/languages/`. Writing exercises in `content/exercises/` reference those character slugs.

Run `npm run content:audio` after adding released Japanese audio files and manifest entries.

Markdown is canonical. Add articles to `content/knowledge/` with the frontmatter contract defined in `packages/core/src/content/schema.ts`. Add external Mermaid diagrams to `content/diagrams/`, then reference them from article frontmatter with `diagramRefs`. Add human-language character, vocabulary, audio metadata, and rights-aware resources to `content/languages/`; writing exercises reference those character slugs from `content/exercises/`. Published kana guides use attributed KanjiVG geometry; preserve the source and CC BY-SA 3.0 notices when editing them. Run `npm run content:audio` after adding released Japanese audio files and manifest entries.

Supabase is optional for browsing. Apply the migrations in `supabase/migrations/` before enabling Auth/progress. To sync indexed content manually, copy `.env.example` to `.env`, configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and run:

```bash
npm run content:sync:supabase
```

Keep the service role key server-side only. Do not add it to browser code or Vercel runtime environment variables.

## Workspace Layout

- `.agents/skills`: repo-local Codex skills; see [technical editing](docs/README.md#technical-editing-skill) for concise documentation rewrites.
- `apps/web`: existing Next/Vercel web app.
- `apps/mobile`: Expo Router Android/iOS app with EAS internal, production, and submit profiles.
- `packages/core`: shared content, search, practice, and progress contracts.
- `packages/ui`: shared React Native-compatible screens and design tokens.

Start documentation work at `docs/README.md`. See `docs/CHANGELOG.md` for dated delivery summaries and the linked feature documents for authoritative behavior.

## Restore the Signal

The home is the Restore the Signal campaign; discovery and Keep reading are at `/learn`. See `docs/features/restore-the-signal.md`. Run `npm run game:runtime` and `npm run game:assets` when local runner or art sources change; `npm run build` includes both exports. Native bundles consume their committed offline outputs.

The [character kit](assets/game/previews/character-kit-v2.png) defines Patch and the three zombie identities. `game:assets` also exports their thumbnails; `npm run game:character-preview` rebuilds the visual review sheet. See the [asset guide](assets/game/README.md) for editable sources, portrait sizes and generation prompts.

The [in-level miniature kit](assets/game/previews/miniatures-v3.png) shows the actual chibi game figures. Run `npm run game:miniature-preview -- http://127.0.0.1:3128` against a completed production preview to recapture it.

## Private LinkedIn editorial workflow

Admin web/native manual creation, Unicode text formatting and review at `/admin/linkedin` uses optional Supabase persistence, opt-in local writer/OpenJev preparation, and a manually invoked Codex verification worker. Drafts are private; a human must approve the exact revision before Buffer scheduling. See [feature contract](docs/features/linkedin-editorial.md) and [operations runbook](docs/runbooks/linkedin-editorial.md). Local models: `npm run linkedin:models -- status`; manual batches: `npm run linkedin -- prepare 5`. Commands: `npm run linkedin -- status`, `npm run e2e:linkedin`, `npm run test:linkedin:local`, and `npm run test:production:smoke` (after build).

## Frontend interview practice

Open `/paths/frontend-interview-practice` for seven lessons, guided TS/Python solutions, checkpoints, and continuous review. Canonical code is in `content/interviews/frontend-practice.json`. After editing it, run `npm run content:index`, `npm run test:interview:python` (CI uses Python 3.13), and the authored-project Vitest checks. The Python gate also executes the original neural-gradient, temporary-SQLite retry and evidence-bound handoff labs with isolated inputs. See [the feature contract](docs/features/frontend-interview-practice.md) for the complete verification workflow and native release gaps.

The supplementary lesson `/docs/frontend/react-state-async-callbacks` covers stale state in timers and promises, functional updates, cleanup, and a six-question checkpoint. Its complete examples live in Markdown and are typechecked and executed by `ReactAsyncStateLesson.test.tsx`.

Japanese writing notebooks use 24 whole-prompt repetitions per sheet and support curated/custom text of 1–5 published characters. Ink stays on the device; coarse completion/unlocks optionally sync. See `docs/features/japanese-writing-notebooks.md` for the implementation, persistence and validation contract.

The optional [knowledge graph and local content evaluator](docs/features/knowledge-evaluator.md) maps canonical content, supplies evidence to OpenJev and local LinkedIn preparation, and offers an admin graph/table explorer. See [operating instructions](docs/runbooks/knowledge-evaluator.md). Anonymous learning stays independent.

## Private interview preparation

Admin → Interview preparation tracks companies, roles and rounds on web/native. The `prepare-interview` Codex skill uses your private resume/project context, researches current evidence and always applies technical-edit. Supabase stores immutable briefs; Markdown export and private knowledge links support reuse. See [feature](docs/features/interview-preparation.md) and [operations](docs/runbooks/interview-preparation.md).

## Event-log interview practice

Open `/paths/partitioned-event-log` to review a candidate attempt and compare indexed arrays, linked chains with sparse anchors, and segmented logs. Each has complete TypeScript/Python code, followed by an eight-question quiz and fourteen scrolling review cards. `npm run test:interview:python` includes the new verifier; use `python3 scripts/content/verify-event-log.py --scale 1000003` for a local million-event check. See [the feature contract](docs/features/partitioned-event-log-interview.md).
