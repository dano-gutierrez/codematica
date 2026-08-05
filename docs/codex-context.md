# Codex Context

This file carries durable repo context across Codex threads.

## Source Of Truth

- Product and feature intent lives in `docs/features/<feature>.md`.
- Repo-level architecture lives in `docs/engineering-overview.md`.
- Canonical knowledge content lives in `content/knowledge/`.
- Canonical Mermaid diagrams live in `content/diagrams/`.
- Canonical learning paths live in `content/learning-paths/`.
- Canonical practice prompts and questionnaires live in `content/exercises/`.
- Canonical passive flashcard feeds live in `content/flashcard-feeds/`.
- Canonical interview coding catalog content lives in `content/interviews/`.
- Canonical human-language character and vocabulary catalogs live in `content/languages/`.
- Canonical Japanese audio metadata and curated resource metadata live beside the language catalogs in `content/languages/japanese/`; generated platform audio registries are artifacts, not authoring surfaces.
- Canonical home discovery curation lives in `content/discovery/home.json`.
- Generated content search data lives in `packages/core/src/generated/content-index.json` and must be regenerated, not edited by hand.

## Current Product Shape

Codematica V1 is a mobile-first learning app with a Next.js web app and an Expo Router Android/iOS app. The home route is a cross-section discovery hub with Keep reading, local global search, and curated rows for paths, lessons, interviews, practice, and languages. Complete catalogs live at `/paths`, `/browse`, `/interviews`, `/practice`, and `/languages`. The app renders plain Markdown articles, embedded and external Mermaid diagrams, flashcard, cloze, questionnaire, writing, passive flashcard, guided interview coding practice, anonymous real-world web interviews, and Japanese language lookup/practice. Japanese Foundations now has an open JF/CEFR Pre-A1/A1 roadmap, deterministic review, rights-aware resources, and responsive handwriting across web and Expo. React/TypeScript web exercises run through Sandpack on web and remain read-only on native.

Supabase is used optionally for Auth and saved progress when public runtime env vars are configured. The app still browses and renders local content without Supabase credentials; signed-out progress is buffered locally.

The first hosted web target is Vercel Hobby on the Vercel-provided URL. Vercel runs `npm ci` and `npm run build`; Supabase sync remains manual and server-side only until a feature explicitly adds runtime Supabase reads. Native targets are Expo/EAS internal builds first, with production build and EAS Submit profiles ready for Play Console and App Store Connect once account-side setup is complete.

## Repo Map

- `apps/web/src/app/page.tsx`: web discovery home route
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
- `apps/web/e2e/specs/`: Playwright web mobile workflows
- `apps/mobile/app/`: Expo Router routes mirroring the web route contract
- `apps/mobile/src/lib/`: native navigation, Supabase Auth, secure session storage, and local progress adapters
- `apps/mobile/src/lib/skill-progress.ts`: native Japanese mastery read, validation, and bounded sync
- `apps/mobile/src/__tests__/`: mobile Jest and React Native Testing Library screen tests
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
- `vercel.json`: Vercel import/build defaults for the first hosted deployment
- `.env.example`: web/native Supabase Auth/progress and local sync environment variable template

## Working Rules

- Preserve Markdown as the authoring source of truth.
- Preserve learning path and exercise JSON as the local source of truth for study structure.
- Preserve passive flashcard feed JSON as the local source of truth for scroll-only review.
- Preserve interview catalog JSON as the local source of truth for company preparation and anonymous real-world prompts, rubrics, and runnable project files.
- Preserve language catalog JSON as the local source of truth for human-language character and vocabulary data.
- Preserve Japanese audio manifests and external-resource catalogs as metadata source-of-truth files. Never present missing/unreleased recordings as published listening coverage or copy public third-party media without redistribution rights.
- Preserve discovery JSON as the editorial source of truth for curated home rows.
- Keep questionnaire answers transient; progress may store only current question index and completion.
- Keep writing strokes transient; progress may store only coarse practice state such as mode, character slug, and completion.
- Keep Japanese mastery separate from completion history. Local/remote merge may retain only best score, attempt count, review box, mastery state, last practice time, and next review time.
- Keep passive flashcard answers nonexistent; progress may store only latest feed/card position.
- Keep Supabase optional for local browsing. Auth/progress sync may require public Supabase runtime env vars, but content rendering must keep working without them.
- Keep Vercel hosting static-first and free-tier oriented until traffic, commercial use, or runtime backend requirements justify paid services.
- Keep Expo native builds on EAS internal distribution until store credentials, metadata, screenshots, privacy forms, and review readiness are explicitly prepared.
- Never expose Supabase service role keys to browser code. Browser-visible Supabase variables are only for anon-safe Auth/progress clients.
- Update feature docs and architecture docs with behavior changes.
- Add tests with behavior changes; prefer unit coverage before browser coverage.
- Keep UI mobile-first and dense enough for repeated study workflows.
- Reuse and extend existing web components in `apps/web/src/components/` and shared native screens in `packages/ui/src/` before creating new UI from scratch. New reusable components should be added to the inventory in `AGENTS.md`.

## Feature Index

- `docs/CHANGELOG.md`: dated cross-feature delivery summaries; feature documents remain authoritative.
- `docs/features/home-discovery.md`: cross-section home, global local search, curated rows, stable themes, and full catalog routes.
- `docs/features/markdown-knowledge-browser.md`: V1 Markdown browser, search, diagrams, content indexing, and Supabase scaffold.
- `docs/features/learning-paths-and-practice.md`: path catalog and detail maps, schema-v8 proficiency/stage metadata, flashcards, cloze prompts, and local path/exercise content.
- `docs/features/programming-language-refresh.md`: reusable language refresh paths and the Python-for-TS/JS module.
- `docs/features/llm-application-engineering.md`: Langfuse and LangChain AI engineering path, including LLM app architecture, tracing, evals, RAG, agents, risk governance, and non-executable coding challenge sections.
- `docs/features/database-indexes-learning-path.md`: database indexes, PostgreSQL HOT updates, and PostgreSQL search path, including index fundamentals, MVCC update mechanics, full text search, trigram fuzzy matching, hybrid SQL search, quizzes, passive flashcards, and SQL editor roadmap boundaries.
- `docs/features/bfs-dfs-learning-path.md`: Programming skill path for BFS and DFS fundamentals, side-by-side Python/TypeScript examples, questionnaires, passive review, and graph interview variants.
- `docs/features/mermaid-diagram-authoring.md`: Mermaid authoring skill path for flowcharts, software diagrams, planning/data diagrams, debugging, choice-only quizzes, and source-first review.
- `docs/features/advanced-nextjs-16-learning-path.md`: hard Front-End Development skill path for Next.js 16 rendering, caching, `force-dynamic`, invalidation, production pain points, performance, migration, quizzes, and one-minute brief cards.
- `docs/features/interview-coding-catalog.md`: company and anonymous real-world interview collections, guided algorithm walkthroughs, and frontend solution sessions.
- `docs/features/react-typescript-playground.md`: reusable WebExerciseProject schema, Sandpack isolation, editing behavior, and native fallback.
- `docs/features/auth-and-progress.md`: Supabase Auth, minimal profiles, saved progress, local progress buffering, and Keep reading UI.
- `docs/features/subscriptions-and-content-gating.md`: proposed RevenueCat/Stripe/Apple/Google subscription model, strict paid content gating, entitlement cache, and paywall implementation plan.
- `docs/features/future-roadmap.md`: planned AI, flashcard, blueprint, code challenge, deeper gamification, and native app directions.
- `docs/features/hosting-and-deployment.md`: Vercel free-tier deployment, static-first hosting behavior, EAS build/submit posture, and manual Supabase sync boundaries.
- `docs/features/native-mobile-deployment.md`: Expo Router Android/iOS app, shared workspace packages, native auth/progress, offline index bundling, and EAS build/submit workflows.
- `docs/features/japanese-language-learning.md`: open JF/CEFR Japanese roadmap, complete basic kana, 100-kanji target, romaji/IME input, deterministic review, resource/audio contracts, iPad accessibility, dictionary profiles, and assisted/free handwriting practice.
