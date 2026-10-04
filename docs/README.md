# Docs Hub

This folder preserves project context across Codex tasks.

Start here:

1. Read `docs/codex-context.md` for the repo map, working rules, and handoff pattern.
2. Read `docs/engineering-overview.md` for the current architecture, stack, content flow, Supabase direction, and Mermaid diagrams.
3. Read the relevant file in `docs/features/` for the feature you are touching.
4. If the feature is `proposed` or `in_progress`, verify the named touchpoints in code before editing.
5. After changing behavior, adding a workflow, or making a product decision, update the matching feature doc in the same branch.
6. Read `docs/CHANGELOG.md` when you need a chronological summary of recently shipped product and architecture changes.

Conventions:

- `docs/codex-context.md` is the repo-wide orientation file.
- `docs/engineering-overview.md` is the repo-level architecture and system-flow document.
- `docs/features/<feature>.md` is the durable product and implementation contract for one feature.
- `docs/CHANGELOG.md` records dated, cross-feature delivery summaries and links back to the authoritative feature contracts.
- `docs/features/_template.md` is the format new feature docs should follow.
- `docs/features/README.md` explains how threads should consume and maintain feature docs.
- `docs/features/adaptive-ui.md` owns the shared visual language, bottom navigation, desktop/tablet sidebars, responsive layout, and redesign validation gaps.
- `docs/features/markdown-knowledge-browser.md` owns article rendering, the web/native code-surface audit, the fixed dark code theme, native horizontal scroll containment, and rendered contrast/layout regressions. Theme selection is deferred.
- `docs/features/brand-identity.md` owns the approved Patch logo, favicons, native icons, splash artwork and reproducible exports under `assets/brand/`.
- `docs/features/home-discovery.md` owns the Learn discovery hub, global local search, curated rows, section themes, and full catalog routes.
- `docs/features/learning-paths-and-practice.md` owns local path JSON, path detail, local exercise JSON, and practice sessions, including Client Compatibility's layout and API evidence reviews.
- `docs/features/ml-systems-career-path.md` owns the Harvard CS249r source-linked career roadmap, authored prerequisites/Foundation companions, guided labs, and upstream refresh contract.
- `docs/features/programming-language-refresh.md` owns reusable programming-language refresh paths, starting with Python for TypeScript and JavaScript engineers.
- `docs/features/llm-application-engineering.md` owns the Langfuse and LangChain AI engineering path, including local lessons, diagrams, quizzes, passive flashcards, and non-executable coding challenge sections.
- `docs/features/database-indexes-learning-path.md` owns the database indexes, PostgreSQL HOT updates, PostgreSQL search, and connection-pooling path, including local lessons, quizzes, passive flashcards, and future SQL editor roadmap boundaries.
- `docs/features/advanced-nextjs-16-learning-path.md` owns the advanced Front-End Development skill path for Next.js 16 rendering, caching, `force-dynamic`, invalidation, performance, migration, quizzes, and one-minute brief cards.
- `docs/features/rtk-query-interview-preparation.md` owns the RTK Query interview path, seven sourced lessons, 42 scenario questions, 21 briefs, and versioned persistence case study.
- `docs/features/product-engineering-interview-preparation.md` owns the Product Engineering research brief, plain JavaScript/durable workflow drills, 75-minute guided mock, 18 checkpoint questions, and twelve review cards.
- `docs/features/interview-coding-catalog.md` owns company and anonymous real-world interview collections, guided algorithm walkthroughs, and frontend practice solutions.
- `docs/features/react-typescript-playground.md` owns the reusable web-project schema, Sandpack execution boundary, automatic startup, retry/reset lifecycle, and native fallback.
- `docs/features/frontend-interview-practice.md#supplementary-react-state-lesson` describes the stale-closure lesson, executable Markdown examples, cleanup rules, and six-question checkpoint.
- `docs/features/bfs-dfs-learning-path.md` owns the Programming skill path for BFS/DFS fundamentals, Python and TypeScript examples, questionnaires, scrolling review, and guided graph interview comparisons.
- `docs/features/mermaid-diagram-authoring.md` owns the Mermaid reading/writing skill path, progressive rendered examples, choice-only questionnaires, scrolling review, and diagram-selection guidance.
- `docs/features/auth-and-progress.md` owns Supabase Auth, user profile minimalism, saved progress, anonymous progress buffering, and Keep reading behavior.
- `docs/features/subscriptions-and-content-gating.md` owns the proposed RevenueCat/Stripe/Apple/Google subscription model, strict paid content gating, entitlement cache, and paywall implementation plan.
- `docs/features/hosting-and-deployment.md` owns the Vercel free-tier deployment contract, static-first hosting, Expo build/submission workflows, and manual Supabase sync boundary.
- `docs/features/native-mobile-deployment.md` owns the Expo Router Android/iOS app, workspace sharing model, native auth/progress behavior, and mobile test/build lanes.
- `docs/features/automated-testing-and-release-regression.md` owns the layered coverage policy, Vitest/Jest/pgTAP/Playwright/Maestro lanes, CI schedules, artifacts, and release promotion gates.
- `docs/features/japanese-language-learning.md` owns the open JF Pre-A1/A1 roadmap, complete basic kana and 100-kanji targets, romaji/IME teaching, six-box review, audio/rights contracts, trusted resources, iPad behavior, and assisted/free handwriting practice.
- `docs/runbooks/native-store-publishing.md` owns the operational checklist for Play Console, Apple Developer Program, App Store Connect, RevenueCat store/provider setup, EAS credentials, first native builds, and first submissions.
- `docs/plans/<feature>/...` is the repo-local home for durable implementation plans when a plan needs to outlive one thread.

## Content Authoring

- `content/knowledge/`: canonical Markdown documents.
- `content/diagrams/`: canonical Mermaid diagrams.
- `content/learning-paths/`: role and skill path JSON.
- `content/exercises/`: flashcard, cloze, questionnaire, and writing practice JSON.
- `content/flashcard-feeds/`: path-scoped passive flashcard feed JSON.
- `content/interviews/`: company and anonymous real-world interview collection JSON, including validated web-project files.
- `content/languages/`: human-language character and vocabulary catalogs.
- `content/discovery/`: validated editorial curation for discovery surfaces.
- `content/sources/`: validated primary-source URLs, versions, maturity, attribution, and verification dates.

## Workspace

- `.agents/skills/`: repo-local Codex workflows, starting with the [technical editing skill](../.agents/skills/technical-edit/SKILL.md).
- `apps/web/`: Next.js App Router web app and Playwright specs.
- `apps/mobile/`: Expo Router native app, EAS profiles, and mobile Jest tests.
- `packages/core/`: shared content index, schemas, search, practice, interview, and progress logic.
- `packages/ui/`: React Native-compatible shared screens and design tokens.

AI engineering lesson content under `content/knowledge/ai-engineering/` must stay aligned with primary or standards-oriented sources such as official Langfuse docs, official LangChain and LangGraph docs, OpenTelemetry, OWASP, and NIST. Coding challenge sections in those lessons are authored as non-executable prompts until a future code editor feature adds an executable challenge contract.

Database index lesson content under `content/knowledge/databases/` must stay aligned with primary or official sources such as PostgreSQL documentation and Drizzle documentation. SQL query practice remains non-executable roadmap work until a future SQL editor feature adds a validated demo-data contract.

Front-End Development lesson content under `content/knowledge/frontend/` must stay aligned with official framework documentation and release notes. The Advanced Next.js 16 path uses official Next.js docs, official Next.js release posts, and npm registry package metadata as source anchors.

## Editorial Standard

- Optimize for senior engineers growing into tech-lead ownership: connect implementation mechanics to correctness, security, operations, cost, migration, and team decisions.
- Lead with a durable mental model, then show the smallest production-relevant example and the conditions under which it stops being correct.
- Distinguish facts, product policy, heuristics, illustrative thresholds, and version-specific behavior. Date or remove claims that become stale quickly.
- Prefer primary sources for technical claims. Do not treat a citation, captured trace, or successful type check as proof of semantic correctness.
- State failure modes, observability, rollback or recovery, and review questions when the topic can affect production.
- Keep prose compact. Remove repeated framing before removing invariants, boundary conditions, or important counterexamples.

## Maintenance

- Update this file when a new docs section, plan convention, feature-doc convention, or recommended reading order is added.
- Update the closest existing README when adding a durable folder, workflow, command, integration, test lane, or content convention.
- If no README owns a new durable area and the area is not self-explanatory, add one.
- Update READMEs in the same branch whenever implementation changes their documented contract.
- Add a dated changelog entry for a release-sized change that spans several feature contracts; do not use the changelog as a replacement for updating those contracts.

- `docs/features/linkedin-editorial.md` owns private source-grounded and manual LinkedIn drafts, text formatting and required manual-draft analysis, shared web/native review, immutable approvals, Supabase jobs and Buffer scheduling. `docs/runbooks/linkedin-editorial.md` owns account bootstrap, pinned local writer/OpenJev setup, manual preparation/backfill and Codex verification, v2 backups and recovery.

- `docs/features/frontend-interview-practice.md` owns the seven frontend challenges, Python companions, quiz/review flow, and exact-solution verification. The existing-content audit is in `docs/features/interview-coding-catalog.md`.

## Technical Editing Skill

Use [$technical-edit](../.agents/skills/technical-edit/SKILL.md) to make existing prose concise and clear while preserving technical facts, commands, code, conditions, and warnings. The instructions live in `.agents/skills/technical-edit/SKILL.md`; `agents/openai.yaml` supplies its display name and starter prompt.

Example requests:

- `Use $technical-edit to simplify the following text: ...`
- `Use $technical-edit to tighten docs/features/auth-and-progress.md in place.`

Pasted-text requests return **Simplified text** and a short **Critique**. File edits save the revised document and return a link plus the critique. Ambiguities are marked `[Unclear: ...]`; code blocks remain verbatim. Explicit audience, format, and scope instructions take precedence over defaults.

When changing the skill, run the bundled `skill-creator/scripts/quick_validate.py` against `.agents/skills/technical-edit` using a Python environment with PyYAML. Review its behavior on prose with conditional steps, exact values, code blocks, distinct examples, and contradictory claims. Check that the rewrite retains those details and that a file edit keeps the critique outside the document. Schema validation checks packaging; it does not prove semantic preservation.

The skill defines editing instructions. Each edit still requires the validation appropriate to its document or content. Preserve quiz answer keys, Japanese expressions/readings/translations, technical examples, source URLs, and attribution. Keep generator templates and authored output consistent, then regenerate the runtime index. Repository skills use the [standard Codex discovery location](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills).

Japanese handwriting includes paired trace/copy/recall planas, kana word sheets, matching pairs, attributed curved kana guides, smooth retained ink, and forgiving beginner grading on web/native. See [Japanese language learning](features/japanese-language-learning.md#handwriting-practice-sheets-planas) for the geometry, licensing, input, completion, and device-validation contracts.

- [Japanese writing notebooks](features/japanese-writing-notebooks.md): Japanese catalog previews with optional romaji, 24-repetition planas, custom pages, automatic mouse/finger/Pencil input, regular web and two-finger touch scrolling, local ink, optional unlock sync and native PencilKit.

Native notebook validation now includes agent-device layout/contact runners in `apps/mobile/e2e/`, plus a [deferred physical iPad checklist](features/japanese-writing-notebooks.md#deferred-physical-ipad-checklist) for the installed PencilKit build and Safari.

## Restore the Signal

[Game campaign contract](features/restore-the-signal.md) owns the twelve-level home, shared evaluators, Patch, asset exports, offline runners, game rewards, and release verification. Read it before changing game rules. See [art sources](../assets/game/README.md), [campaign authoring](../content/game/README.md), and [build tools](../scripts/game/README.md).

[Patch and the zombie character kit](../assets/game/previews/character-kit-v2.png) shows the refined mascot, matching enemy identities and thumbnails. The [asset guide](../assets/game/README.md) owns portrait sizes, rig parts, palette and generation provenance.

The game [miniature sheet](../assets/game/previews/miniatures-v3.png) shows the full-body figures used in each level and their actual phone/wide rendering.

- [Knowledge evaluator](features/knowledge-evaluator.md): local Graphiti/Qwen/OpenJev content inventory and decisions, admin graph/table exploration, offline jobs and graph-bound editorial review. [Runbook](runbooks/knowledge-evaluator.md).
