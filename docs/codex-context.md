# Codex Context

This file carries durable repo context across Codex threads.

## Source Of Truth

- Product and feature intent lives in `docs/features/<feature>.md`.
- Repo-level architecture lives in `docs/engineering-overview.md`.
- Canonical knowledge content lives in `content/knowledge/`.
- Canonical Mermaid diagrams live in `content/diagrams/`.
- Canonical learning paths live in `content/learning-paths/`.
- Canonical practice prompts, questionnaires, and code reviews live in `content/exercises/`.
- Canonical passive flashcard feeds live in `content/flashcard-feeds/`.
- Canonical interactive real-system case-study flows live in `content/case-studies/`.
- Canonical interview coding catalog content lives in `content/interviews/`.
- Generated content search data lives in `src/generated/content-index.json` and must be regenerated, not edited by hand.

## Current Product Shape

Codematica V1 is a mobile-first Next.js learning app. The home route is a path map built from local learning-path JSON with explicit shortcuts for browse, real cases, interviews, and code reviews. It renders plain Markdown articles, renders embedded and external Mermaid diagrams, supports local React Flow case-study walkthroughs for selected system-design articles, supports embedded React Flow complexity animations in Markdown, supports flashcard, cloze, questionnaire, code-review, passive flashcard, and guided interview coding practice, preserves path-scoped interview continuation, and keeps the content library at `/browse` from a generated local content index.

Supabase is scaffolded for future hosted indexing and search, but it is not required for local V1 runtime.

## Repo Map

- `src/app/page.tsx`: learning path home route
- `src/app/browse/page.tsx`: content library route
- `src/app/paths/[slug]/page.tsx`: learning path detail route
- `src/app/paths/[slug]/flashcards/page.tsx`: passive flashcard feed route
- `src/app/practice/[...slug]/page.tsx`: flashcard, cloze, questionnaire, and code-review practice route
- `src/app/code-reviews/page.tsx`: standalone random and deep-linked code-review game route
- `src/app/interviews/**/page.tsx`: interview catalog, company, and question routes
- `src/app/docs/[...slug]/page.tsx`: Markdown article route
- `src/app/diagrams/[...slug]/page.tsx`: external Mermaid route
- `src/components/LearningPathMap.tsx`: path home and path detail UI
- `src/components/PracticeCard.tsx`: flashcard, cloze, questionnaire, and code-review shell
- `src/components/QuestionnaireSession.tsx`: one-screen questionnaire interactions
- `src/components/CodeReviewSession.tsx`: PR-style review interactions and authored fixes
- `src/components/PassiveFlashcardFeed.tsx`: path-scoped passive flashcard feed UI
- `src/components/InterviewCatalog.tsx`: interview catalog and company page UI
- `src/components/InterviewQuestionSession.tsx`: guided interview solution walkthrough
- `src/components/CaseStudyFlow.tsx`: read-only React Flow architecture walkthrough renderer
- `src/components/ComplexityFlowBlock.tsx`: read-only React Flow algorithm-complexity walkthrough renderer
- `src/components/KnowledgeBrowser.tsx`: browser, filters, and result cards
- `src/components/MarkdownRenderer.tsx`: safe Markdown rendering, embedded Mermaid, and embedded complexity-flow support
- `src/components/CodeBlock.tsx`: shared language-aware code block renderer
- `src/components/MermaidBlock.tsx`: client-side Mermaid renderer
- `src/lib/content/`: content schema, parser, index builder, and generated index access
- `src/lib/content/index.ts`: lookup helpers and path-node route helpers for document, diagram, exercise, and interview nodes
- `src/lib/practice/code-review.ts`: code-review range hit detection and replacement helpers
- `src/lib/search.ts`: fuzzy search
- `scripts/content/`: index generation and optional Supabase sync
- `supabase/migrations/`: optional Supabase schema
- `e2e/specs/`: Playwright smoke workflows

## Working Rules

- Preserve Markdown as the authoring source of truth.
- Preserve learning path and exercise JSON as the local source of truth for study structure, including interview nodes that reference existing interview catalog questions.
- Preserve embedded `complexity-flow` Markdown blocks as the local source of truth for article-specific algorithm animations.
- Preserve code-review exercise JSON as the local source of truth for snippets, findings, healthy notes, and fixes.
- Preserve passive flashcard feed JSON as the local source of truth for scroll-only review.
- Preserve case-study flow JSON as the local source of truth for interactive architecture walkthroughs.
- Preserve interview catalog JSON as the local source of truth for reported/public coding prompt packs.
- Keep questionnaire sessions transient unless a future progress feature explicitly adds durable state.
- Keep code-review attempts transient unless a future progress/scoring feature explicitly adds durable state.
- Keep passive flashcard feed sessions transient unless a future review feature explicitly adds durable state.
- Keep case-study flows local-first and out of Supabase sync until a hosted case-study/search feature explicitly requires remote storage.
- Keep complexity-flow playback transient and read-only; do not add persisted progress or user-authored flow editing without a feature contract.
- Keep Supabase optional until a feature explicitly moves runtime search or persistence there.
- Update feature docs and architecture docs with behavior changes.
- Add tests with behavior changes; prefer unit coverage before browser coverage.
- Keep UI mobile-first and dense enough for repeated study workflows.

## Feature Index

- `docs/features/markdown-knowledge-browser.md`: V1 Markdown browser, search, diagrams, content indexing, and Supabase scaffold.
- `docs/features/learning-paths-and-practice.md`: path-first study map, flashcards, cloze prompts, interview path nodes, and local path/exercise content.
- `docs/features/code-review-game.md`: code-review exercise schema, standalone route, review UI, and future scoring/fix-choice roadmap.
- `docs/features/real-system-case-studies.md`: source-backed system-design case studies with Mermaid diagrams and local React Flow walkthroughs.
- `docs/features/programming-language-refresh.md`: reusable language refresh paths and the Python-for-TS/JS module.
- `docs/features/big-o-notation-skill.md`: Big O skill path, complexity-flow Markdown blocks, and algorithm practice content.
- `docs/features/interview-coding-catalog.md`: reported-public company coding catalog and guided multi-language solution walkthroughs.
- `docs/features/future-roadmap.md`: planned AI, flashcard, blueprint, code challenge, auth, and native app directions.
