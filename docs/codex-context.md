# Codex Context

This file carries durable repo context across Codex threads.

## Source Of Truth

- Product and feature intent lives in `docs/features/<feature>.md`.
- Repo-level architecture lives in `docs/engineering-overview.md`.
- Canonical knowledge content lives in `content/knowledge/`.
- Canonical Mermaid diagrams live in `content/diagrams/`.
- Generated content search data lives in `src/generated/content-index.json` and must be regenerated, not edited by hand.

## Current Product Shape

Codematica V1 is a mobile-first Next.js knowledge browser. It renders plain Markdown articles, renders embedded and external Mermaid diagrams, and supports fuzzy search from a generated local content index.

Supabase is scaffolded for future hosted indexing and search, but it is not required for local V1 runtime.

## Repo Map

- `src/app/page.tsx`: main knowledge browser route
- `src/app/docs/[...slug]/page.tsx`: Markdown article route
- `src/app/diagrams/[...slug]/page.tsx`: external Mermaid route
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
- Keep Supabase optional until a feature explicitly moves runtime search or persistence there.
- Update feature docs and architecture docs with behavior changes.
- Add tests with behavior changes; prefer unit coverage before browser coverage.
- Keep UI mobile-first and dense enough for repeated study workflows.

## Feature Index

- `docs/features/markdown-knowledge-browser.md`: V1 Markdown browser, search, diagrams, content indexing, and Supabase scaffold.
- `docs/features/future-roadmap.md`: planned AI, flashcard, blueprint, code challenge, auth, and native app directions.
