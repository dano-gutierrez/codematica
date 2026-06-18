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
- Generated content search data lives in `src/generated/content-index.json` and must be regenerated, not edited by hand.

## Current Product Shape

Codematica V1 is a mobile-first Next.js learning app. The home route is a path map built from local learning-path JSON. It renders plain Markdown articles, renders embedded and external Mermaid diagrams, supports flashcard, cloze, questionnaire, passive flashcard, and guided interview coding practice, and preserves the content library at `/browse` from a generated local content index.

Supabase is scaffolded for future hosted indexing and search, but it is not required for local V1 runtime.

## Repo Map

- `src/app/page.tsx`: learning path home route
- `src/app/browse/page.tsx`: content library route
- `src/app/paths/[slug]/page.tsx`: learning path detail route
- `src/app/paths/[slug]/flashcards/page.tsx`: passive flashcard feed route
- `src/app/practice/[...slug]/page.tsx`: flashcard, cloze, and questionnaire practice route
- `src/app/interviews/**/page.tsx`: interview catalog, company, and question routes
- `src/app/docs/[...slug]/page.tsx`: Markdown article route
- `src/app/diagrams/[...slug]/page.tsx`: external Mermaid route
- `src/components/BackButton.tsx`: shared client-side back navigation button
- `src/components/LearningPathMap.tsx`: path home and path detail UI
- `src/components/PracticeCard.tsx`: flashcard, cloze, and questionnaire shell
- `src/components/QuestionnaireSession.tsx`: one-screen questionnaire interactions
- `src/components/PassiveFlashcardFeed.tsx`: path-scoped passive flashcard feed UI
- `src/components/InterviewCatalog.tsx`: interview catalog and company page UI
- `src/components/InterviewQuestionSession.tsx`: guided interview solution walkthrough
- `src/components/KnowledgeBrowser.tsx`: browser, filters, and result cards
- `src/components/DifficultyPill.tsx`: shared difficulty badge
- `src/components/Dropdown.tsx`: custom Radix-backed dropdown primitive
- `src/components/MarkdownRenderer.tsx`: safe Markdown rendering and embedded Mermaid support
- `src/components/CodeBlock.tsx`: shared language-aware code block renderer
- `src/components/MermaidBlock.tsx`: client-side Mermaid renderer
- `src/components/RandomInterviewButton.tsx`: randomized interview practice CTA
- `src/lib/content/`: content schema, parser, index builder, and generated index access
- `src/lib/search.ts`: fuzzy search
- `scripts/content/`: index generation and optional Supabase sync
- `supabase/migrations/`: optional Supabase schema
- `e2e/specs/`: Playwright smoke workflows

## Working Rules

- Preserve Markdown as the authoring source of truth.
- Preserve learning path and exercise JSON as the local source of truth for study structure.
- Preserve passive flashcard feed JSON as the local source of truth for scroll-only review.
- Preserve interview catalog JSON as the local source of truth for reported/public coding prompt packs.
- Keep questionnaire sessions transient unless a future progress feature explicitly adds durable state.
- Keep passive flashcard feed sessions transient unless a future review feature explicitly adds durable state.
- Keep Supabase optional until a feature explicitly moves runtime search or persistence there.
- Update feature docs and architecture docs with behavior changes.
- Add tests with behavior changes; prefer unit coverage before browser coverage.
- Keep UI mobile-first and dense enough for repeated study workflows.
- Reuse and extend existing components in `src/components/` before creating new UI from scratch. New reusable components should be added to the inventory in `AGENTS.md`.

## Feature Index

- `docs/features/markdown-knowledge-browser.md`: V1 Markdown browser, search, diagrams, content indexing, and Supabase scaffold.
- `docs/features/learning-paths-and-practice.md`: path-first study map, flashcards, cloze prompts, and local path/exercise content.
- `docs/features/programming-language-refresh.md`: reusable language refresh paths and the Python-for-TS/JS module.
- `docs/features/interview-coding-catalog.md`: reported-public company coding catalog and guided multi-language solution walkthroughs.
- `docs/features/future-roadmap.md`: planned AI, flashcard, blueprint, code challenge, auth, and native app directions.
