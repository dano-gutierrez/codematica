# Codex Context

This file carries durable repo context across Codex threads.

## Source Of Truth

- Product and feature intent lives in `docs/features/<feature>.md`.
- Repo-level architecture lives in `docs/engineering-overview.md`.
- Canonical knowledge content lives in `content/knowledge/`.
- Canonical Mermaid diagrams live in `content/diagrams/`.
- Canonical learning paths live in `content/learning-paths/`.
- Canonical practice prompts live in `content/exercises/`.
- Generated content search data lives in `src/generated/content-index.json` and must be regenerated, not edited by hand.

## Current Product Shape

Codematica V1 is a mobile-first Next.js learning app. The home route is a path map built from local learning-path JSON. It renders plain Markdown articles, renders embedded and external Mermaid diagrams, supports flashcard and cloze practice, and preserves fuzzy search at `/browse` from a generated local content index.

Supabase is scaffolded for future hosted indexing and search, but it is not required for local V1 runtime.

## Repo Map

- `src/app/page.tsx`: learning path home route
- `src/app/browse/page.tsx`: knowledge browser route
- `src/app/paths/[slug]/page.tsx`: learning path detail route
- `src/app/practice/[...slug]/page.tsx`: flashcard and cloze practice route
- `src/app/docs/[...slug]/page.tsx`: Markdown article route
- `src/app/diagrams/[...slug]/page.tsx`: external Mermaid route
- `src/components/LearningPathMap.tsx`: path home and path detail UI
- `src/components/PracticeCard.tsx`: flashcard and cloze interactions
- `src/components/KnowledgeBrowser.tsx`: browser, filters, and result cards
- `src/components/MarkdownRenderer.tsx`: safe Markdown rendering and embedded Mermaid support
- `src/components/MermaidBlock.tsx`: client-side Mermaid renderer
- `src/lib/content/`: content schema, parser, index builder, and generated index access
- `src/lib/search.ts`: fuzzy search
- `scripts/content/`: index generation and optional Supabase sync
- `supabase/migrations/`: optional Supabase schema
- `e2e/specs/`: Playwright smoke workflows

## Working Rules

- Preserve Markdown as the authoring source of truth.
- Preserve learning path and exercise JSON as the local source of truth for study structure.
- Keep Supabase optional until a feature explicitly moves runtime search or persistence there.
- Update feature docs and architecture docs with behavior changes.
- Add tests with behavior changes; prefer unit coverage before browser coverage.
- Keep UI mobile-first and dense enough for repeated study workflows.

## Feature Index

- `docs/features/markdown-knowledge-browser.md`: V1 Markdown browser, search, diagrams, content indexing, and Supabase scaffold.
- `docs/features/learning-paths-and-practice.md`: path-first study map, flashcards, cloze prompts, and local path/exercise content.
- `docs/features/future-roadmap.md`: planned AI, flashcard, blueprint, code challenge, auth, and native app directions.
