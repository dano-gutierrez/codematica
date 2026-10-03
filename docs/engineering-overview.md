# Codematica Engineering Overview

Last updated: 2026-09-27

Codematica is a mobile-first learning app for system design, coding, programming, software engineering, ML systems, and beginner human-language study. V1 stays local-first: Markdown and structured JSON remain canonical, including a validated external-source catalog for source-linked companions.

## Current Stack

- Next.js App Router
- Expo Router for Android/iOS
- React and TypeScript
- Tailwind CSS
- React Native primitives and shared design tokens in `@codematica/ui`
- plain Markdown rendered with `react-markdown`
- native Markdown rendered with React Native Markdown components
- language-aware code highlighting with `highlight.js`
- editable React/TypeScript web projects with Sandpack's cross-origin browser runtime
- Mermaid rendered client-side on web and through a native WebView/source fallback on mobile
- React Native SVG rendering for native handwriting/stroke surfaces
- Fuse.js-style fuzzy search
- local JSON learning paths, practice prompts, flashcard feeds, and interview catalogs
- local JSON human-language character and vocabulary catalogs
- Vercel Hobby deployment config for first hosted web delivery
- EAS internal preview, production build, and submit config for native delivery
- optional Supabase Auth and progress persistence with `@supabase/ssr`
- optional native Supabase Auth and progress persistence with secure Expo session storage
- Vitest with V8 aggregate and per-file coverage gates for unit/integration tests
- Playwright for desktop Chromium, mobile Chromium, and mobile WebKit browser regression
- Jest + React Native Testing Library with coverage gates for mobile adapters and shared screens
- pgTAP against a disposable local Supabase stack for migrations, RLS, triggers, and search
- Maestro 2.8.0 through credential-free EAS Android/iOS test builds for installed-app journeys
- local agent-device geometry/gesture checks for native code scrolling, with screenshot and accessibility-tree evidence (`apps/mobile/e2e/`)
- optional Supabase Postgres scaffold for hosted search and saved progress

## Content Flow

The approved Patch identity has a separate static asset flow. The existing build-only Sharp dependency exports PNG/ICO files; no brand processing runs in the app or server. See `docs/features/brand-identity.md`.

```mermaid
flowchart LR
  Brand["assets/brand/source: approved alpha artwork"] --> Export["npm run brand:assets"]
  Export --> WebBrand["Web public assets + Next metadata icons"]
  Export --> NativeBrand["Expo launcher/splash + shared UI PNGs"]
  Brand --> Freshness["brand:check: reproducibility + platform constraints"]
  WebBrand --> Artifact["Production-only HTTP asset smoke"]
```

```mermaid
flowchart TD
  MD["content/knowledge/**/*.md"] --> Parser["content parser + Zod validation"]
  MMD["content/diagrams/**/*.{mmd,mermaid}"] --> Parser
  PATHS["content/learning-paths/*.json"] --> Parser
  EX["content/exercises/**/*.json"] --> Parser
  SRC["content/sources/*.json"] --> Parser
  FEEDS["content/flashcard-feeds/*.json"] --> Parser
  IV["content/interviews/*.json"] --> Parser
  LANG["content/languages/**/*.json"] --> Parser
  AUDIO["Japanese TTS draft queue + approved local files"] --> Parser
  GRAMMAR["Structured Japanese grammar + N5 vocabulary"] --> Parser
  IME["Pinned compact JMdict candidate asset"] --> Core
  RES["Japanese external resource catalog"] --> Parser
  DISC["content/discovery/home.json"] --> Parser
  Parser --> Index["packages/core/src/generated/content-index.json"]
  Index --> Core["@codematica/core"]
  Core --> SharedUI["@codematica/ui"]
  Core --> Paths["Path and next-node helpers"]
  Core --> Practice["Flashcard, cloze, questionnaire, writing + guided labs"]
  Core --> Passive["Passive flashcard feed"]
  Core --> Interviews["Interview coding catalog"]
  Core --> Languages["Japanese language lookup + handwriting"]
  Core --> Review["Generic career/language stages + six-box mastery"]
  Core --> Search["Library fuzzy search"]
  Core --> Discovery["Cross-section search + curated home"]
  SharedUI --> Native["Expo Router + adaptive native shell"]
  Core --> Web["Next.js + adaptive web shell"]
  Web --> ProgressUI["Progress trackers + Keep reading"]
  Web --> Vercel["Vercel build"]
  Vercel --> CDN["Static/SSG web delivery"]
  Native --> EAS["EAS internal + store builds"]
  AUDIO --> HumanQA["Human Japanese approval"]
  HumanQA --> AudioPrep["npm run content:audio"]
  AudioPrep --> WebAudio["Web asset URL registry"]
  AudioPrep --> NativeAudio["Expo static require registry"]
  WebAudio --> Web
  NativeAudio --> Native
  Core --> Sync["Optional Supabase sync script"]
  Sync --> DB[("Supabase Postgres")]
  ProgressUI --> Auth["Supabase Auth"]
  Native --> NativeAuth["Native Supabase Auth"]
  Auth --> UserDB[("Supabase user progress")]
  NativeAuth --> UserDB
  Review --> SkillAPI["Authenticated skill-progress API / native adapter"]
  SkillAPI --> SkillDB[("RLS user_skill_progress")]
```

## Interface Shell

Web `AppNavigation` lives in the Next root layout; existing `AppHeader` callers supply only context labels. Native `NativeNavigation` wraps the Expo Stack inside safe-area layout. Phones use a bottom bar and modal More menu, while desktop and iPad use a sidebar. Both use existing routes and preserve content/progress adapters. See `docs/features/adaptive-ui.md`.

## Runtime Boundaries

V1 runtime reads `packages/core/src/generated/content-index.json` through `@codematica/core`. It does not require Supabase credentials to discover, browse, search, read, practice, or render diagrams. The generated index is bundled into the Expo app, so native discovery, anonymous browsing, and practice work offline until the next app or update release.

The repo is an npm workspace:

- `apps/web`: Next.js App Router web app, web-specific Supabase SSR helpers, and Playwright specs.
- `apps/mobile`: Expo Router Android/iOS app, native Supabase/auth/progress adapters, and mobile Jest tests.
- `packages/core`: shared content schemas, generated index access, content parsing/indexing helpers, search, practice, interview, and progress contracts.
- `packages/ui`: React Native-compatible shared screens and design tokens.

Vercel is the first hosted web target. The project deploys from `main` with `npm ci` and `npm run build`, which regenerates the core content index before building `apps/web`. Article, diagram, and practice routes stay static-first; path-scoped `?path=` next-node links are selected by small client wrappers from build-time route maps so normal content traffic can be served as static/SSG output.

EAS internal preview builds are the first native target. `apps/mobile/eas.json` defines development, preview, production, e2e-test, and submit profiles. Production builds produce store-ready Android app bundles and iOS archives; EAS Submit can send the latest builds to Play Console internal testing and App Store Connect/TestFlight after account-side credentials and store records are configured. Native routes mirror the web route contract and read the same generated index through `@codematica/core`.

Supabase is optional at runtime:

- `kb_documents` stores Markdown metadata, body, extracted text, headings, and Mermaid blocks.
- `kb_diagrams` stores external diagram metadata and source.
- `search_kb` provides a future SQL search entrypoint.
- Supabase Auth supports Google, email/password, and Apple-ready login on web and native when public runtime env vars are configured.
- `user_profiles` stores only user ids and timestamps.
- `user_progress_items` stores resume/completion milestones for documents, diagrams, practice, passive feeds, and interviews.
- `user_skill_progress` stores the additive Japanese review snapshot: best score, attempt count, review box, mastery state, last practice time, and next review time.
- RLS is enabled from the start.

## Content Model

### Articles And Diagrams

Every article has frontmatter with title, slug, summary, track, topic, difficulty, tags, prerequisites, diagram references, primary-source references, and status. The parser validates this contract before generating the index. `content/sources/*.json` centralizes authoritative URLs, attribution, license when verified, version/commit, maturity, and verification date.

External diagrams are stored separately and referenced by slug from article frontmatter. Embedded Mermaid blocks inside Markdown are also rendered. Fenced code blocks and app-authored solution snippets use the shared highlighted code block theme with language labels for Python, TypeScript, Java, JSON, shell, Markdown, and related aliases.

### Paths And Practice

Learning paths live in `content/learning-paths/*.json` and contain ordered units of document, diagram, exercise, and primary-source nodes. A source node resolves to its published local companion or the authoritative external URL. Exercises support `flashcard`, `cloze`, `questionnaire`, `writing`, and `guided-lab`. Questionnaires calculate aggregate overall/per-skill scores while answers stay transient. Guided labs enforce prediction and evidence-checklist completion while reflection text stays transient. Writing exercises reference language character slugs and use shared stroke-count, order/direction, and shape checks.

Passive flashcard feeds live in `content/flashcard-feeds/*.json` and attach short review cards to learning paths.

### Interviews

Interview collections live in `content/interviews/*.json` and are discriminated as `company` or `real-world`. Company algorithm questions retain reported-public links and guided Python, TypeScript, and Java tracks. Anonymous real-world questions require provenance notes and may provide structured evaluation rubrics plus at least three `WebExerciseProject` solutions. Web projects are authored locally, validated into the index, and executed only in Sandpack's cross-origin iframe; Expo shows the same files read-only. Revealing a web solution starts one runtime shared with its console. Run/Retry replace the connection with the current draft; Reset starts from authored files. The connection lifecycle and recovery diagram live in `docs/features/react-typescript-playground.md`.

### Languages And Discovery

Human-language catalogs live in `content/languages/**/*.json`. Schema v10 adds structured grammar, N5 study metadata, Japanese open-answer/listening question kinds, and synthetic-audio provenance while retaining generic progression and resource-rights metadata. Japanese indexes complete kana, an exact 100-kanji target, 650 N5-aligned words, 60 grammar patterns, learner romaji, IPA, study order, and normalized paths for published handwriting profiles. A compact pinned JMdict asset supplies local IME candidates. Only human-approved audio enters generated web/Expo registries; external resources remain link-only unless redistribution rights are explicit.

Home discovery curation lives in `content/discovery/home.json`. It references canonical published content by kind and slug; index generation validates every reference and serializes the ordered sections into content index schema version 12. `packages/core/src/discovery.ts` resolves those references and provides cross-section local search to web and native.

### Course Catalog

The ML Systems Engineer path is the first source-linked career curriculum. It maps the complete Harvard CS249r student surface—both books, labs, TinyTorch, MLSys·im, optional hardware, and StaffML—while locally publishing prerequisites and Volume I companions through Data Engineering. Later stages remain explicitly planned but open their primary sources now.

The Python language refresh path is the first reusable language-refresh slice. It pairs searchable Markdown docs with senior-level questionnaires and passive flashcards for TypeScript and JavaScript engineers.

The Langfuse and LangChain AI engineering path is the first AI engineering slice. It pairs searchable Markdown lessons, Mermaid diagrams, questionnaires, and passive flashcards for LLM application architecture, LangChain tools/RAG/agents, LangGraph operations, Langfuse tracing/evaluation workflows, and OWASP/NIST-aligned production risk governance. Coding challenge sections in these lessons are non-executable until the future code editor feature adds an executable challenge contract.

The database indexes and search path teaches index selection for production, PostgreSQL Heap-Only Tuple update behavior, full text search, trigram fuzzy matching, hybrid SQL search query design, and resilient connection management. Its pooling unit covers application and proxy budgets, transaction sharing, shutdown, spot interruptions, and compatibility through diagrams, calculated examples, and interactive questions. It adds no live database connection or new runtime component. Its HOT unit connects MVCC row versions, same-page space, regular and BRIN index effects, fillfactor, pruning, vacuuming, and statistics monitoring. The path pairs searchable Markdown lessons with senior-level questionnaires and passive flashcards, while keeping executable SQL query practice as future roadmap work.

The Advanced Next.js 16 path is the first Front-End Development skill slice. It pairs advanced searchable Markdown lessons, senior/principal questionnaires, and one-minute passive brief cards for App Router rendering, `force-dynamic`, Cache Components, data fetching, invalidation, production failure modes, performance architecture, and migration review. Next.js content must stay anchored to official Next.js documentation, official release notes, and npm registry version metadata.

The RTK Query Interview Preparation path extends Front-End Development using seven source-required lessons and checkpoints plus 21 passive briefs. It covers cache/request ownership, mutations, a generalized persisted-pending incident, modern RTK 2.12.0 APIs, architecture, and a mock interview. It reuses the content pipeline and study components without adding Redux or RTK as an application runtime dependency. See `docs/features/rtk-query-interview-preparation.md`.

The Product Engineering Interview path adds an evidence-aware research brief, a plain JavaScript preview coordinator, a durable export design, and a 75-minute guided mock. Four lessons, eighteen checkpoint questions, and twelve passive briefs reuse the same local content flow. Code/design are self-assessed; authored reference code is checked with inert promises in content tests. No runtime or topology change is introduced. See `docs/features/product-engineering-interview-preparation.md`.

The Breadth-First Search And Depth-First Search path is the graph-traversal Programming slice. It pairs searchable Markdown lessons and readable Python/TypeScript code with questionnaires, a passive scrolling review feed, and guided Google interview prompts for connected components, unweighted shortest paths, and dependency cycles. Number Of Islands deliberately includes both BFS and DFS tracks so learners can compare equivalent asymptotic performance with different readability and memory risks.

The Reading And Writing Mermaid Diagrams path is the source-first technical documentation slice. It uses the existing embedded Mermaid renderer to pair 13 inspectable source blocks with browser-rendered output across flowchart, sequence, class, state, ER, Gantt, journey, pie, mindmap, timeline, and Git graph families. Three choice-only questionnaires enforce one correct option and explain every distractor; a passive feed reinforces selection, syntax, debugging, and readability.

The Japanese Foundations path is the first human-language slice. Its open progression spans Kana Explorer followed by Core Connections, Everyday Japanese, Reading and Listening, and N5 Readiness. Ten progressive A1 units combine original lessons, mixed quizzes, open-answer IME composition, cumulative flashcards, and approval-gated listening across web and Expo. Pencil Scribble writes into the same transient native text input; no raw ink or answer history is persisted.

### Progress

Progress is user state, separate from authored content. Existing completion remains in `user_progress_items`. Japanese mastery is additive: anonymous review state persists locally, while `user_skill_progress` provides an RLS-protected signed-in target for best score, attempt count, review box, mastery state, and review times. Web and Expo load the remote snapshot when authenticated, validate it, merge it deterministically with retained local state, save the merged snapshot locally, and upload it in batches of at most 20. Neither path stores answers, raw handwriting, recordings, or full attempt history.

## Route Model

- `/`: Restore the Signal campaign map.
- `/learn`: cross-section discovery with Keep reading, curated rows, and global local search.
- `/play/[campaign]/[level]`: game briefing, editor, simulation, hints, and results.
- `/paths`: complete learning-path catalog grouped by category.
- `/browse`: fuzzy content library.
- `/paths/[slug]`: one role or skill path.
- `/paths/[slug]/flashcards`: one passive flashcard feed for a path.
- `/practice`: complete exercise and passive-review catalog.
- `/practice/[...slug]`: one flashcard, cloze prompt, questionnaire, or writing session.
- `/languages`: available language hubs.
- `/languages/japanese`: Japanese lookup and study hub.
- `/languages/japanese/review`: due-skill recommendations and manually browseable skill cards.
- `/languages/japanese/characters/[...slug]`: one Japanese character detail route.
- `/languages/japanese/vocabulary/[...slug]`: one Japanese vocabulary detail route.
- `/interviews`: real-world and company interview collections.
- `/interviews/[collection]`: one anonymous or company question list; existing company URL segments are unchanged.
- `/interviews/[collection]/[question]`: a guided algorithm walkthrough or runnable web exercise.
- `/docs/[...slug]`: one Markdown article.
- `/diagrams/[...slug]`: one standalone Mermaid diagram.
- `/login`: optional Supabase Auth sign-in and sign-up.
- `/auth/callback`: OAuth/PKCE callback and local progress sync handoff.
- `/api/progress/**`: authenticated completion summary/upsert, anonymous-buffer sync, and Japanese skill-progress read/batch-sync.

## Testing Model

Unit tests cover schema validation, parser behavior, library and cross-section search, discovery curation, snippets, questionnaire shuffling/checking, handwriting scoring, interview solution selection, path/exercise/language/interview validation, stage percentage/stamp eligibility, six-box mastery transitions, due ordering, local/remote mastery merge, progress payload validation, lossless batching, file walking, route mapping, audio-registry generation, Supabase sync mapping, and diagram indexing. Integration tests cover generated-index relationships, renderers, web/API/Auth boundaries, and native screen/adaptor behavior.

Coverage is enforced by scope and per file. Core requires 90% lines/statements/functions and 85% branches; web services/API/content scripts require 85% and 80% branches; web components require 75% and 70% branches; mobile libraries require 80% and 70% branches; shared native UI requires 70% and 60% branches. Every instrumented file also requires 60% lines/statements/functions and 50% branches. Exclusions are limited to generated output, type-only barrels/tokens, and thin route or CLI composition and are annotated where configured.

Playwright runs the complete suite in mobile Chromium and repeats smoke journeys in desktop Chromium and mobile WebKit. It covers discovery, catalogs, path routing, reading, standalone and embedded Mermaid, every practice renderer, passive feeds, algorithm and runnable web interviews, Japanese lookup/detail/review/writing, local progress, login/Auth-disabled behavior, 404 recovery, responsive layout, and representative accessibility. Mobile Jest covers platform adapters, configured/unconfigured Supabase, offline/partial-failure progress behavior, app configuration, and the complete shared-screen matrix. Maestro covers installed-app offline discovery, path-to-practice, browse-to-diagram, Japanese study/review, interviews, and unconfigured login on Android and iOS release candidates.

Transactional pgTAP tests replay migrations in a disposable local Supabase stack and assert tables, indexes, constraints, RLS, anonymous denial, per-user isolation, completion/mastery preservation, published-only search, ranking, and limits.

```mermaid
flowchart TD
  Change["Behavior or regression"] --> Narrow["Lowest-layer failing test"]
  Narrow --> Unit["Vitest or mobile Jest coverage"]
  Narrow --> DB["pgTAP when DB contract changes"]
  Unit --> Browser["Playwright for important web journeys"]
  Unit --> Native["Maestro for critical installed-app journeys"]
  DB --> PR["Five parallel PR checks"]
  Browser --> PR
  Native --> Release["v* EAS Android + iOS jobs"]
  PR --> Nightly["03:00 UTC regression"]
  Nightly --> Release
  Release --> Promote["Manual promotion only after all gates pass"]
```

The stable command and workflow contract is documented in `docs/features/automated-testing-and-release-regression.md`.

## Future Architecture Direction

The likely next step combines canonical Markdown and local structured content with expanded Supabase-backed search, AI summaries, scoring, streaks, and study features. Keep `@codematica/core` as the shared contract and define each new feature explicitly.

Before relying on Supabase for production user progress at scale, revisit plan level, backups, RLS policy coverage, and operational ownership. The service role key remains server-only.

## Game runtime and progression

The [game feature contract](features/restore-the-signal.md) owns the chapter. `content/game/` passes the shared Zod/index pipeline; all 36 scenarios ship in schema version 12. Game rules import no graphics libraries. Web loads PixiJS on the client, while native Skia/Reanimated consume the same atlas and keyframes. CSS uses actual local layout; sql.js and WASM are bundled into a terminable local worker. Native hosts the same sandbox document in a local WebView.

```mermaid
flowchart TD
    Campaign["content/game JSON + local lessons"] --> Validate["Core schema + reference validation"]
    Validate --> Index["Generated content index v12"]
    Artwork["Editable SVG parts + painted layers + portraits + rig timelines"] --> Export["game:assets"]
    Export --> Atlas["Shared atlas + district textures"]
    Export --> Thumbnails["Sized PNG/WebP portraits + identity manifest"]
    Export --> Miniatures["Transparent full-body miniature PNGs"]
    Thumbnails --> Static["Web static assets / native-ready PNG files"]
    Miniatures --> Static
    Index --> Session["GameSession: transient input + logical clock"]
    Session --> Core["Pipes + workload evaluators"]
    Session --> Sandbox["Local CSS layout / SQLite worker"]
    Core --> Result["Reasons, events, metrics"]
    Sandbox --> Result
    Result --> Awards["Unique awards + successful activity dates"]
    Result --> Scene["Shared poses and simulation outcomes"]
    Atlas --> Scene
    Geometry["Measured container + shared miniature transforms"] --> Scene
    Geometry --> Export
    Scene --> Pixi["Web PixiJS"]
    Scene --> Skia["Native Skia + Reanimated"]
    Awards --> Local["Account-scoped local game progress"]
    Local <--> Merge["Optional authenticated union-merge RPC"]
    Merge --> RLS["Awards / activity days / preferences with owner RLS"]
```

Game awards are separate from learning-path progress. Locks only constrain campaign levels. The anonymous buffer can be claimed by one account, and stale in-flight writes carry an expected account ID. SQL/CSS answers and full attempt history never enter the RPC. Additive migrations, clean replay, and transactional pgTAP test the merge and RLS. Final web artifacts and installed native bundles must include worker/WASM/texture assets; source-only tests cannot certify those packages.

Android prebuild also registers shared package sources and game assets as Gradle bundle inputs. This keeps incremental production APKs aligned with Metro’s workspace watch folders. The artifact check compares decoded textures because Android resource shrinking renames packed files.

Portrait masters are separate from the animation atlas. `game:assets` emits 64/128/256/512px thumbnails and a manifest with names and alt text; it copies all variants into the web public directory. Native screens can statically import a chosen PNG size when needed. `game:check` recursively verifies generated subfolders, and the pruned web artifact smoke check validates every served thumbnail.

The game renderers share `packages/core/src/game/miniatures.ts` for layer ordering, animation transforms, success opacity and fitting the figures to the measured container. The asset build samples this same pose to export transparent full-body miniatures; portrait icons remain separate. No renderer library enters core.

## Private LinkedIn editorial workflow

Anonymous learning remains local-index first. The optional `/admin/linkedin` web/native surface reads private drafts through Supabase Auth, RLS and admin-only RPCs. `private.app_admins` is operator provisioned. Post revisions are immutable; approval binds the exact text. Manual creation atomically inserts a draft and a preparation job when enabled, or a legacy refinement job. Manual drafts require an analyzed proposal to be adopted before approval, and text edits invalidate analysis. Shared schemas/store live in `packages/core/src/linkedin*.ts`. The HTTP/mobile graphs never import the local service-role worker.

```mermaid
flowchart LR
  Sources[Canonical learning Markdown] --> Drafts[Private Supabase drafts and revisions]
  Human[Verified personal admin] --> Review[Web or native review]
  Review -->|Create manual draft| Create[Atomic draft and analysis request]
  Create --> Drafts
  Create --> Jobs[Durable Postgres jobs]
  Review -->|Refine| Jobs
  Review -->|Approve exact revision| Jobs
  Jobs -->|prepare, manual batch| Local[Local writer and OpenJev]
  Local --> Reports[Immutable local preparation reports]
  Reports -->|ready, or reasoned human override| Verify[Compact verification queue]
  Verify --> Worker[Manual local Codex verify and patch]
  Jobs -->|approved schedule or cancel| Worker
  Prompt[Checked-in preparation and verification prompts] --> Local
  Prompt --> Worker
  Worker -->|Proposed revision only| Drafts
  Worker -->|Approved text and free capacity| Buffer[Buffer daily queue]
  Buffer --> LinkedIn[Personal LinkedIn profile]
  Worker -->|Confirmed identity and status| Publications[Supabase publications]
  Drafts --> Review
  Publications --> Review
```

The opt-in preparation migration keeps inference on the Mac and saves only immutable reports/voice versions in Supabase. Manual batches preserve originals and hold duplicates or integrity failures before Codex. A versioned overview and on-demand detail replace collection-wide history polling. The existing Codex account verifies selected prepared text when the user asks. Requests persist between manual runs. Buffer Free owns daily slots and holds at most ten scheduled posts; additional approvals remain durable in Supabase. First comments are manual. Scheduling attempts are recorded before external calls; unknown results are reconciled instead of retried. Private exports before each day’s first mutations and insert-only restore preserve history; restore always pauses publishing. See `features/linkedin-editorial.md` and `runbooks/linkedin-editorial.md` for account onboarding, failure recovery and validation boundaries.

## Frontend Interview Study Flow

Index v11 resolves interview path nodes alongside documents and exercises. Optional Python companions remain structured interview content; anonymous browsing and progress boundaries are unchanged. Exact authored code is verified before indexing/release. See `docs/features/frontend-interview-practice.md`.

```mermaid
flowchart LR
  Brief[Markdown concepts] --> Recipe[Interview recipe]
  Recipe --> TS[Web TypeScript playground]
  Recipe --> Python[Python companion source]
  TS --> Quiz[Eight-question checkpoint]
  Python --> Quiz
  Quiz --> Next[Next topic]
  Quiz --> Final[Final topic: continuous review]
  Path[Path overview] --> Final
  Final --> Brief
  Brief -. Supplement .-> State[React state snapshots lesson]
  State --> StateQuiz[Six-question state checkpoint]
```

Native follows the same nodes and code display, with execution available on web only. Review cards carry explicit code language and canonical lesson references. `npm run test:interview:python` complements TS/React execution tests and is required in CI.

Japanese notebook practice extends the existing local character/vocabulary catalogs with versioned sheets and 24 whole-prompt repetitions. Canonical kana geometry remains pinned and attributed to KanjiVG. The whole-shape grader ignores stroke order/direction and accepts extra lifts, while checking major-feature coverage with Easy/Balanced/Precise tolerances. Device snapshots retain learner ink and the per-notebook difficulty preference; optional progress synchronization stores counts and unlocks only. Both clients check accumulated ink automatically after a pen-up pause. The following flow describes the shared notebook engine and its client adapters.

## Writing notebook flow

The versioned notebook engine in core owns prompt validation, 24-repetition schedules, shape coverage, cell cursors and monotonic earned progress. The React-only `@codematica/ui/notebook-session` subpath coordinates both clients without importing React Native into the web entrypoint. Both clients detect contact types automatically and preserve completed pending strokes during two-finger paper scrolling. The iOS Expo view bridges UIKit pan phases/deltas to the RN viewport, keeping PencilKit ink aligned with the paper. `NotebookScrollContext` hands remaining pan distance to the native outer page at the paper bounds. Web keeps its viewport scrollable for wheel, trackpad, scrollbar and keyboard input. Web has a direct production dependency on `@codematica/ui`; the pruned-artifact smoke serves the notebook catalog and existing writing routes.

```mermaid
flowchart LR
  Content["Canonical writing JSON + published stroke models"] --> Engine["Core notebook definitions + shape grader"]
  Engine --> Web["Pointer Events / smooth SVG"]
  Engine --> Native["PencilKit iOS / SVG Android"]
  Web --> LocalWeb[("IndexedDB vectors + pages")]
  Native --> LocalNative[("AsyncStorage manifests + cells")]
  Web --> Merge["Bounded furthest-progress merge"]
  Native --> Merge
  Merge <--> Remote[("RLS notebook counts; no ink")]
```

See [Japanese writing notebooks](features/japanese-writing-notebooks.md) for failure recovery, native build limits and tests.

Native writing protects the SVG responder from ancestor ScrollView interception and drives paper scrolling explicitly through touch centroids or accessibility actions. `apps/mobile/src/lib/handwriting-navigation.ts` supplies the Expo Stack gesture policy for handwriting routes, preventing iPad swipe-back from consuming rightward strokes. The native catalog uses a compact selected-page header; `AppScreen` has an optional keyboard-tap policy for form buttons. `apps/mobile/e2e/notebook-{layout,gestures}.mjs` retain measured layout, real-contact results and screenshots; physical PencilKit validation remains a separate supported-build/device gate.

The notebook catalog derives Japanese previews and authored romaji readings from the shared engine. `useNotebookRomaji` shares the display preference between catalog implementations through optional storage methods. The preference is device-local (web localStorage/native AsyncStorage) and separate from notebook ink and synchronized progress.
