# Codex Context

This file preserves repo context across Codex tasks.

## Source Of Truth

- Product and feature intent lives in `docs/features/<feature>.md`.
- Web controls, spacing, alignment, and disclosure rules live in `docs/features/design-system.md`. Read it before UI work; reuse web `Button`/`ButtonLink`, native `Button`, `Dropdown`, and existing compositions. `docs/features/app-wide-design-audit.md` tracks all route/platform adoption and verification.
- Web `AppNavigation` owns the Admin group and account footer/header/menu. Its account-session hook is display state; membership RPCs and RLS own admin authorization. `e2e:linkedin` tests editorial and account navigation with synthetic Supabase requests.

- Approved app identity lives in `assets/brand/source/`; `npm run brand:assets` regenerates web/native copies. Preserve the selected Patch design; see `docs/features/brand-identity.md`.
- Repo-level architecture lives in `docs/engineering-overview.md`.
- Canonical knowledge content lives in `content/knowledge/`.
- Canonical Mermaid diagrams live in `content/diagrams/`.
- Canonical learning paths live in `content/learning-paths/`.
- Canonical practice prompts and questionnaires live in `content/exercises/`.
- Canonical external primary-source metadata lives in `content/sources/`.
- Canonical passive flashcard feeds live in `content/flashcard-feeds/`.
- Canonical interview coding catalog content lives in `content/interviews/`.
- Canonical human-language character and vocabulary catalogs live in `content/languages/`.
- Published kana stroke geometry uses pinned KanjiVG sources with CC BY-SA 3.0 attribution recorded per character and in `THIRD_PARTY_NOTICES.md`; preserve it when modifying the canonical points. Web/native share curved rendering and beginner stroke scoring from core.
- Canonical Japanese audio metadata and curated resource metadata live beside the language catalogs in `content/languages/japanese/`; generated platform audio registries are artifacts, not authoring surfaces.
- Canonical home discovery curation lives in `content/discovery/home.json`.
- Generated content search data lives in `packages/core/src/generated/content-index.json` and must be regenerated, not edited by hand.

## Current Product Shape

The interface uses persistent phone bottom navigation and desktop/iPad sidebars. `AppNavigation` in the web root and `NativeNavigation` around the Expo Stack own the shell; existing screen components retain feature behavior. See `docs/features/adaptive-ui.md` for visual rules and outstanding native verification.

Codematica V1 is a mobile-first learning app with a Next.js web app and an Expo Router Android/iOS app. The home route is the Restore the Signal campaign. `/learn` contains the discovery hub with Keep reading, local global search, and curated rows for paths, lessons, interviews, practice, and languages. Complete catalogs live at `/paths`, `/browse`, `/interviews`, `/practice`, and `/languages`. The app renders plain Markdown articles, diagrams, flashcard, cloze, questionnaire, writing, guided-lab, passive flashcard, interview, and Japanese study surfaces. Japanese Foundations and ML Systems share the generic stage/progression contract. The ML Systems Engineer path maps Harvard CS249r with primary-source links and published companions through Volume I Data Engineering. React/TypeScript web exercises run through Sandpack on web and remain read-only on native.

Supabase provides optional Auth and saved progress when public runtime env vars are configured. The app still browses and renders local content without Supabase credentials; signed-out progress is buffered locally.

The first hosted web target is Vercel Hobby on the Vercel-provided URL. Vercel runs `npm ci` and `npm run build`; Supabase sync remains manual and server-side only until a feature explicitly adds runtime Supabase reads. Native targets are Expo/EAS internal builds first, with production build and EAS Submit profiles ready for Play Console and App Store Connect once account-side setup is complete.

## Repo Map

- `.agents/skills/technical-edit/`: reusable technical editing instructions and Codex UI metadata; usage and validation live in `docs/README.md#technical-editing-skill`
- `apps/web/src/app/page.tsx`: game campaign home
- `apps/web/src/app/learn/page.tsx`: discovery and Keep reading
- `apps/web/src/app/play/[campaign]/[level]/page.tsx`: playable game levels
- `content/game/`: canonical game campaigns; index schema version 12
- `packages/core/src/game/`: deterministic evaluators, local execution contracts, sessions, rewards, and sync
- `assets/game/`: editable original artwork, rigs, timelines, generated atlases
- `assets/game/source/characters/` and `source/portraits/`: refined character identity references, exact generation prompts and four thumbnail masters; `generated/thumbnails/` contains reproducible size variants and their manifest
- `packages/ui/src/game/`: native map, controls, and Skia scenes
- `apps/web/src/app/paths/page.tsx`: complete web learning-path catalog
- `apps/web/src/app/practice/page.tsx`: complete web practice/review catalog
- `apps/web/src/app/languages/page.tsx`: web language directory
- `apps/web/src/app/browse/page.tsx`: web content library route
- `apps/web/src/app/paths/[slug]/page.tsx`: web learning path detail route
- `apps/web/src/app/paths/[slug]/flashcards/page.tsx`: web passive flashcard feed route
- `apps/web/src/app/practice/[...slug]/page.tsx`: web flashcard, cloze, and questionnaire practice route
- `apps/web/src/app/languages/japanese/**`: web Japanese language hub and detail routes
- `apps/web/src/app/languages/japanese/review/page.tsx`: web Japanese due-review and all-skill-card route
- `apps/web/src/app/api/progress/skills/route.ts`: authenticated Japanese mastery read/batch-sync API
- `apps/web/src/app/interviews/**/page.tsx`: web interview collection and question routes
- `apps/web/src/components/WebPlayground.tsx`: reusable isolated React/TS, vanilla TS, and static project editor/preview
- `apps/web/src/app/docs/[...slug]/page.tsx`: web Markdown article route
- `apps/web/src/app/diagrams/[...slug]/page.tsx`: web external Mermaid route
- `apps/web/src/app/login/page.tsx`: web Supabase Auth login route
- `apps/web/src/app/auth/**/route.ts`: web OAuth callback and sign-out routes
- `apps/web/src/app/api/progress/**/route.ts`: web authenticated progress summary/upsert/sync endpoints
- `apps/web/src/app/api/subscription/**/route.ts`: proposed subscription status, protected content, and RevenueCat webhook endpoints
- `apps/web/src/components/`: legacy web/Tailwind components and client wrappers
- `apps/web/src/lib/supabase/`: web Supabase SSR/browser/proxy helpers
- `apps/web/e2e/`: Playwright full mobile-Chromium regression plus desktop-Chromium/mobile-WebKit smoke
- `apps/mobile/app/`: Expo Router routes mirroring the web route contract
- `apps/mobile/src/lib/`: native navigation, Supabase Auth, secure session storage, and local progress adapters
- `apps/mobile/src/lib/skill-progress.ts`: native Japanese mastery read, validation, and bounded sync
- `apps/mobile/src/__tests__/`: mobile Jest and React Native Testing Library screen tests
- `apps/mobile/e2e/`: agent-device phone/tablet simulator and emulator regressions for code scrolling, notebook layout and handwriting gestures, with retained screenshot/tree evidence
- `apps/mobile/.maestro/`: installed-app Android/iOS regression flows
- `apps/mobile/.eas/workflows/`: native smoke and `v*` release E2E orchestration
- `packages/core/src/content/`: content schema, parser, index builder, and generated index access
- `packages/core/src/search.ts`: fuzzy search
- `packages/core/src/discovery.ts`: cross-section search and curated-home resolution
- `packages/core/src/practice/`: questionnaire attempt and answer checking helpers
- `packages/core/src/languages/`: human-language lookup helpers
- `packages/core/src/language-writing/`: shared handwriting scoring helpers
- `packages/core/src/flashcards/`: passive feed shuffling/window helpers
- `packages/core/src/progress/`: progress validation, display mapping, and Supabase data helpers
- `packages/core/src/progress/mastery.ts`: deterministic six-box review and local/remote merge
- `packages/core/src/progress/progression.ts`: stage completion and stamp-eligibility rules
- `packages/ui/src/`: React Native-compatible shared screens and design tokens
- `scripts/content/`: index generation and optional Supabase sync
- `scripts/content/build-japanese-audio.ts`: validated Japanese audio preparation and platform registry generation
- `supabase/migrations/`: optional Supabase schema
- `supabase/tests/`: local-only transactional pgTAP schema, search, trigger, and RLS tests
- `.github/workflows/`: fast PR checks, nightly regression, and `v*` release-candidate gates
- `vercel.json`: Vercel import/build defaults for the first hosted deployment
- `.env.example`: web/native Supabase Auth/progress and local sync environment variable template

## Working Rules

- Preserve Markdown as the authoring source of truth.
- Preserve learning path and exercise JSON as the local source of truth for study structure.
- Preserve `content/sources/` as source metadata truth; upstream material remains authoritative for source-linked companions.
- Preserve passive flashcard feed JSON as the local source of truth for scroll-only review.
- Preserve interview catalog JSON as the local source of truth for company preparation and anonymous real-world prompts, rubrics, and runnable project files.
- Preserve language catalog JSON as the local source of truth for human-language character and vocabulary data.
- Preserve Japanese audio manifests and external-resource catalogs as metadata source-of-truth files. Never present missing/unreleased recordings as published listening coverage or copy public third-party media without redistribution rights.
- Preserve discovery JSON as the editorial source of truth for curated home rows.
- Keep questionnaire answers transient; progress may store current position, completion, and aggregate overall/per-skill scores only.
- Keep guided-lab predictions, evidence details, and reflections transient; progress may store only coarse prediction/checklist completion.
- Notebook vector ink persists locally only (IndexedDB/AsyncStorage); remote progress stores bounded counts and unlocks, never ink. See docs/features/japanese-writing-notebooks.md.
- Keep Japanese mastery separate from completion history. Local/remote merge may retain only best score, attempt count, review box, mastery state, last practice time, and next review time.
- Passive flashcards must not collect answers; progress may store only the latest feed/card position.
- Keep Supabase optional for local browsing. Auth/progress sync may require public Supabase runtime env vars, but content rendering must keep working without them.
- Keep Vercel hosting static-first and free-tier oriented until traffic, commercial use, or runtime backend requirements justify paid services.
- Keep Expo native builds on EAS internal distribution until store credentials, metadata, screenshots, privacy forms, and review readiness are explicitly prepared.
- Never expose Supabase service role keys to browser code. Browser-visible Supabase variables are only for anon-safe Auth/progress clients.
- Update feature docs and architecture docs with behavior changes.
- Add tests with behavior changes; start with the narrowest failing regression, preserve non-decreasing coverage gates, and add browser/device coverage for important journeys.
- Keep UI mobile-first and dense enough for repeated study workflows.
- Reuse and extend existing web components in `apps/web/src/components/` and shared native screens in `packages/ui/src/` before creating new UI from scratch. New reusable components should be added to the inventory in `AGENTS.md`.

## Feature Index

- `docs/features/product-engineering-interview-preparation.md`: company-neutral interview research, original JavaScript/architecture exercises, and a guided mock using existing study components.
- `docs/CHANGELOG.md`: dated cross-feature delivery summaries; feature documents remain authoritative.
- `docs/features/home-discovery.md`: Learn discovery hub, global local search, curated rows, stable themes, and full catalog routes.
- `docs/features/markdown-knowledge-browser.md`: V1 Markdown browser, search, diagrams, content indexing, and Supabase scaffold.
- `docs/features/learning-paths-and-practice.md`: path catalog and detail maps, schema-v12 career/language progression, source nodes, flashcards, open answers, listening choices, guided labs, and local path/exercise content.
- `docs/features/ml-systems-career-path.md`: Harvard CS249r source-linked roadmap, published prerequisites/Volume I Foundations companions, guided labs, and planned career stages.
- `docs/features/programming-language-refresh.md`: reusable language refresh paths and the Python-for-TS/JS module.
- `docs/features/llm-application-engineering.md`: Langfuse and LangChain AI engineering path, including LLM app architecture, tracing, evals, RAG, agents, risk governance, and non-executable coding challenge sections.
- `docs/features/database-indexes-learning-path.md`: database indexes, PostgreSQL HOT updates, PostgreSQL search, and connection-pooling path, including index fundamentals, MVCC update mechanics, full text search, trigram fuzzy matching, hybrid SQL search, quizzes, passive flashcards, and SQL editor roadmap boundaries.
- `docs/features/bfs-dfs-learning-path.md`: Programming skill path for BFS and DFS fundamentals, side-by-side Python/TypeScript examples, questionnaires, passive review, and graph interview variants.
- `docs/features/mermaid-diagram-authoring.md`: Mermaid authoring skill path for flowcharts, software diagrams, planning/data diagrams, debugging, choice-only quizzes, and source-first review.
- `docs/features/advanced-nextjs-16-learning-path.md`: advanced Front-End Development skill path for Next.js 16 rendering, caching, `force-dynamic`, invalidation, production pitfalls, performance, migration, quizzes, and one-minute brief cards.
- `docs/features/interview-coding-catalog.md`: company and anonymous real-world interview collections, guided algorithm walkthroughs, and frontend solution sessions.
- `docs/features/react-typescript-playground.md`: reusable WebExerciseProject schema, Sandpack isolation, editing behavior, and native fallback.
- `docs/features/auth-and-progress.md`: Supabase Auth, minimal profiles, saved progress, local progress buffering, and Keep reading UI.
- `docs/features/subscriptions-and-content-gating.md`: proposed RevenueCat/Stripe/Apple/Google subscription model, strict paid content gating, entitlement cache, and paywall implementation plan.
- `docs/features/future-roadmap.md`: planned AI, flashcard, blueprint, code challenge, deeper gamification, and native app directions.
- `docs/features/hosting-and-deployment.md`: Vercel free-tier deployment, static-first hosting behavior, EAS build/submission workflows, and manual Supabase sync boundaries.
- `docs/features/native-mobile-deployment.md`: Expo Router Android/iOS app, shared workspace packages, native auth/progress, offline index bundling, and EAS build/submit workflows.
- `docs/features/automated-testing-and-release-regression.md`: coverage policy, Vitest/Jest/pgTAP/Playwright/Maestro lanes, CI artifacts, and release promotion gates.
- `docs/features/japanese-language-learning.md`: open JF/CEFR Japanese roadmap, complete basic kana, 100-kanji target, romaji/IME input, deterministic review, resource/audio contracts, iPad accessibility, dictionary profiles, and assisted/free handwriting practice.

- `docs/features/rtk-query-interview-preparation.md`: Front-End Development RTK Query mechanics, incident recovery, modern APIs, production architecture, and interview practice.

## Campaign design principle

Rails for Zombies remains the teaching reference: present a concrete problem, let the player build a solution, show its consequences, and explain the result. Read `docs/features/restore-the-signal.md` and the supplied visual references before extending the chapter. Game attempts stay transient; only account-scoped awards, activity dates, and preferences sync. Graphics and animation callbacks never grade a solution.

Game miniatures: `packages/core/src/game/miniatures.ts` owns renderer-independent layout and poses; the actual animated characters use `assets/game/source/*.svg` and rig v3. `assets/game/generated/miniatures/` contains transparent full-body exports, distinct from portrait icons in `generated/thumbnails/`.

## Private editorial domain

LinkedIn posts are a separate optional Supabase-backed admin feature, documented in `docs/features/linkedin-editorial.md`. Learning Markdown remains canonical; private posts/revisions/jobs/publications never enter the generated content index. `prompts/linkedin/` contains the fixed analysis and manual operating prompts; `scripts/linkedin/` is the local-only privileged CLI. The web/native clients share `packages/core/src/linkedin.ts` and `linkedin-store.ts`. Local `.local/linkedin/` files are ignored private artifacts. Read `docs/runbooks/linkedin-editorial.md` before privileged operations. Human approval alone authorizes each exact post revision for Buffer.

## Frontend interview curriculum

Read `docs/features/frontend-system-design-interviews.md` for six candidate-reported whiteboard topics. The `frontend-system-design-interviews` path uses existing Markdown and guided labs; attribution is unverified, and practice additions are labeled. This is separate from the coding curriculum below.

Read `docs/features/frontend-interview-practice.md` for the seven-topic path. Index v11 adds interview path nodes, optional final-feed navigation, web-track Python companions, and review snippet languages. Complete solution code is canonical in interview JSON; concepts live in Markdown. `npm run test:interview:python` requires Python and executes authored snippets.

The supplementary `frontend/react-state-async-callbacks` lesson and its six-question checkpoint use the existing reader and questionnaire. Its standalone broken/fixed examples are canonical Markdown fences, typechecked and executed by `ReactAsyncStateLesson.test.tsx`; they are not duplicated in interview JSON.

### Editorial accessibility and adaptive composition

`docs/features/design-system.md` owns the platform matrix. Web editorial panes use content-width container queries; narrow/touch screens reveal button labels and 48 px targets. Native `LinkedInAdminScreen` keeps labeled 48 dp actions and opts into the existing `AppScreen` keyboard-aware composition. Both preserve unsaved drafts until save/discard. Data/store/worker boundaries and authorization are unchanged. Browser emulation and Jest do not certify native screen-reader or software-keyboard behavior.

### Japanese notebooks

Japanese planas share the core notebook engine and React-only `@codematica/ui/notebook-session` hook. Each sheet requires 24 whole-prompt repetitions. Web uses Pointer Events, installed iOS uses the local PencilKit module, and Android uses SVG. Local ink and maximum earned progress are distinct; restart preserves unlocks. Vocabulary `writing-starter` tags own starter-word curation.

Native handwriting routes disable swipe-back through `apps/mobile/src/lib/handwriting-navigation.ts`. The paper blocks automatic one-finger ScrollView interception; explicit two-finger and accessibility scrolling remain available. Device regressions run against disposable notebooks. Expo Go validates the SVG fallback; the physical iPad/PencilKit checklist remains a separate installed-build gate in the notebook feature doc.

Native OAuth handoff and duplicate-current-code exchange live in `apps/mobile/src/lib/supabase.ts` and `auth-code.ts`; UI recovery lives in `app/auth/callback.tsx` and shared LoginScreen. Read the auth feature contract before changing these boundaries.

### Native local search

`packages/ui/src/LocalSearch.tsx` owns Learn/Browse request lifecycle and feedback. Pure transport and matching live in `packages/core/src/native-search*.ts`; the fixed generated native script is produced by `scripts/content/build-search-runtime.mjs`. Run `search:runtime`/`search:check` after runtime changes. Public canonical content stays in the host/index; the runtime has no credentials, hosted SDK, network or persistent writes. See the owning home-discovery contract before extending it.

The opt-in LinkedIn local preparation stage (`202610030002`) uses `scripts/linkedin/models.py` for manual loopback model lifecycle, `preparation.ts` for bounded decisions, and `prepare.md` / `verify.md` for separate writer and Codex contracts. Supabase holds reports/voice versions, never model weights or inference. Prepared jobs use compact handoffs and sparse verification; originals, adoption and exact approval stay separate. Clients poll `linkedin_overview` and load selected `linkedin_detail`. Read the runbook for controlled activation/backfill and v2 backup compatibility.

The optional knowledge evaluator indexes validated canonical content, excluding human-language curriculum. `scripts/knowledge/` owns catalogs and sync; `services/knowledge/` owns the isolated Graphiti/Neo4j/local-model runtime. `packages/core/src/knowledge.ts` contains shared contracts. Supabase is an admin-only projection/queue, never the canonical curriculum. Read `docs/features/knowledge-evaluator.md` and its runbook before graph or LinkedIn integration work. Model-resolved concepts cannot rename authored resource IDs; approvals bind source and graph hashes.

Private interview preparation lives at `/admin/interview-preparation` on web/native. Supabase stores company/role/round context, candidate profile revisions and immutable briefs; none enters the public generated index. `.agents/skills/prepare-interview` always applies repository technical-edit before output. The local CLI lives in `scripts/interview-preparation`; private artifacts stay in `.local/interview-preparation`. Knowledge PR #16 catalogs private briefs and reviewed learning links; design PR #15 owns shared Button/control rules. Read the feature and runbook before changing this boundary.
### Campaign scenery

Campaign scenery: `assets/game/source/map/` contains four original connected paintings and overlay sources. `scripts/game/build-map-art.ts` assembles and blends before cutting shared-guard tiles into `generated/map/`. `packages/core/src/game/map-art.ts` reserves fifty art positions independently of the twelve authored levels and owns bounded parallax offsets. Web and native keep terrain stationary beneath three moving overlay families. See the [map art review](../assets/game/previews/continuous-map/review.md).
