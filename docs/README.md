# Docs Hub

This folder is the durable context layer for Codex threads working in this repo.

Start here:

1. Read `docs/codex-context.md` for the repo map, working rules, and handoff pattern.
2. Read `docs/engineering-overview.md` for the current architecture, stack, content flow, Supabase direction, and Mermaid diagrams.
3. Read the relevant file in `docs/features/` for the feature you are touching.
4. If the feature is `proposed` or `in_progress`, verify the named touchpoints in code before editing.
5. After changing behavior, adding a workflow, or making a product decision, update the matching feature doc in the same branch.

Conventions:

- `docs/codex-context.md` is the repo-wide orientation file.
- `docs/engineering-overview.md` is the repo-level architecture and system-flow document.
- `docs/features/<feature>.md` is the durable product and implementation contract for one feature.
- `docs/features/_template.md` is the format new feature docs should follow.
- `docs/features/README.md` explains how threads should consume and maintain feature docs.
- `docs/features/learning-paths-and-practice.md` owns the path-first home, local path JSON, local exercise JSON, and practice routes.
- `docs/features/programming-language-refresh.md` owns reusable programming-language refresh paths, starting with Python for TypeScript and JavaScript engineers.
- `docs/features/llm-application-engineering.md` owns the Langfuse and LangChain AI engineering path, including local lessons, diagrams, quizzes, passive flashcards, and non-executable coding challenge sections.
- `docs/features/database-indexes-learning-path.md` owns the database indexes and PostgreSQL search path, including local lessons, quizzes, passive flashcards, and future SQL editor roadmap boundaries.
- `docs/features/advanced-nextjs-16-learning-path.md` owns the hard Front-End Development skill path for Next.js 16 rendering, caching, `force-dynamic`, invalidation, performance, migration, quizzes, and one-minute brief cards.
- `docs/features/bfs-dfs-learning-path.md` owns the Programming skill path for BFS/DFS fundamentals, Python and TypeScript examples, questionnaires, scrolling review, and guided graph interview comparisons.
- `docs/features/mermaid-diagram-authoring.md` owns the Mermaid reading/writing skill path, progressive rendered examples, choice-only questionnaires, scrolling review, and diagram-selection guidance.
- `docs/features/interview-coding-catalog.md` owns the reported-public company interview coding catalog and guided solution walkthroughs.
- `docs/features/auth-and-progress.md` owns Supabase Auth, user profile minimalism, saved progress, anonymous progress buffering, and Keep reading behavior.
- `docs/features/subscriptions-and-content-gating.md` owns the proposed RevenueCat/Stripe/Apple/Google subscription model, strict paid content gating, entitlement cache, and paywall implementation plan.
- `docs/features/hosting-and-deployment.md` owns the Vercel free-tier deployment contract, static-first hosting posture, Expo build/submit posture, and manual Supabase sync boundary.
- `docs/features/native-mobile-deployment.md` owns the Expo Router Android/iOS app, workspace sharing model, native auth/progress behavior, and mobile test/build lanes.
- `docs/features/japanese-language-learning.md` owns the Japanese human-language path, local language catalogs, IPA display, and assisted/free handwriting practice.
- `docs/runbooks/native-store-publishing.md` owns the operational checklist for Play Console, Apple Developer Program, App Store Connect, RevenueCat store/provider setup, EAS credentials, first native builds, and first submissions.
- `docs/plans/<feature>/...` is the repo-local home for durable implementation plans when a plan needs to outlive one thread.

Content authoring surfaces:

- `content/knowledge/`: canonical Markdown documents.
- `content/diagrams/`: canonical Mermaid diagrams.
- `content/learning-paths/`: role and skill path JSON.
- `content/exercises/`: flashcard, cloze, questionnaire, and writing practice JSON.
- `content/flashcard-feeds/`: path-scoped passive flashcard feed JSON.
- `content/interviews/`: company-scoped interview coding catalog JSON.
- `content/languages/`: human-language character and vocabulary catalogs.

Workspace surfaces:

- `apps/web/`: Next.js App Router web app and Playwright specs.
- `apps/mobile/`: Expo Router native app, EAS profiles, and mobile Jest tests.
- `packages/core/`: shared content index, schemas, search, practice, interview, and progress logic.
- `packages/ui/`: React Native-compatible shared screens and design tokens.

AI engineering lesson content under `content/knowledge/ai-engineering/` must stay aligned with primary or standards-oriented sources such as official Langfuse docs, official LangChain and LangGraph docs, OpenTelemetry, OWASP, and NIST. Coding challenge sections in those lessons are authored as non-executable prompts until a future code editor feature adds an executable challenge contract.

Database index lesson content under `content/knowledge/databases/` must stay aligned with primary or official sources such as PostgreSQL documentation and Drizzle documentation. SQL query practice remains non-executable roadmap work until a future SQL editor feature adds a validated demo-data contract.

Front-End Development lesson content under `content/knowledge/frontend/` must stay aligned with official framework documentation and release notes. The Advanced Next.js 16 path uses official Next.js docs, official Next.js release posts, and npm registry package metadata as source anchors.

Maintenance rules:

- Update this file when a new docs section, plan convention, feature-doc convention, or recommended reading order is added.
- Update the closest existing README when adding a durable folder, workflow, command, integration, test lane, or content convention.
- If no README owns a new durable area and the area is not self-explanatory, add one.
- Do not let README files become historical sketches. If implementation changes the actual contract, update the README in the same branch.
