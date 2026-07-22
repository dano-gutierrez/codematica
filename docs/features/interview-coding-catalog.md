# Interview Coding Catalog

## Snapshot

- Status: `shipped`
- Last updated: `2026-07-22`
- Owner thread: `n/a`
- Current state: The app has a local-first interview coding catalog with company pages, reported-public source links, random question navigation, and guided multi-language solution walkthroughs.
- Target outcome: Users can choose a major tech company, open available coding prompts, advance through a step-by-step solution, and review Python, TypeScript, or Java code without requiring auth, Supabase, or a compiler.
- Code touchpoints:
  - `content/interviews/*.json`
  - `public/company-logos/*.svg`
  - `packages/core/src/content/schema.ts`
  - `packages/core/src/content/build-index.ts`
  - `apps/web/src/components/InterviewCatalog.tsx`
  - `apps/web/src/components/InterviewQuestionSession.tsx`
  - `apps/web/src/components/CodeBlock.tsx`
  - `apps/web/src/app/interviews/**/page.tsx`
- Primary tests:
  - `packages/core/src/content/build-index.test.ts`
  - `packages/core/src/content/index.test.ts`
  - `apps/web/src/lib/interviews.test.ts`
  - `apps/web/src/components/InterviewQuestionSession.test.tsx`
  - `apps/web/e2e/specs/interview-catalog.regression.spec.ts`

## One-Minute Brief

The interview catalog is a local content surface for coding interview preparation. Company entries are structured JSON, not remote data. Each question is rewritten for Codematica, tagged with community-reported/public source links, and includes two accepted solution tracks. Each solution track has guided steps, final explanation, complexity, and code in Python, TypeScript, and Java.

## Outcome / Contract

- `/interviews` shows company text-logo tiles, a random-question button, and every question with search, company, and difficulty filters.
- `/interviews/[company]` shows all available coding questions for one company.
- `/interviews/[company]/[question]` shows the prompt, examples, constraints, diagrams when present, and the guided solution session.
- The guided session defaults to Python, lets users switch to TypeScript or Java, reveals one step per `Next`, and renders final code with language-aware highlighting.
- Starting or restarting a session selects a solution track at random and avoids immediately repeating the previous track when another track exists.
- Catalog language says the prompts are reported/public prep, not official company question banks.
- Scoring, real-time compilation, and answer validation are out of scope for this MVP. Optional saved progress is owned by `docs/features/auth-and-progress.md`.

## Data Model

- `content/interviews/*.json` stores one company per file.
- Every company has `slug`, `name`, `logo`, `summary`, `status`, and `questions`.
- `logo.src` points to a local SVG under `/company-logos/` so the catalog does not depend on remote image loading.
- Every question has `sourceLinks`, `examples`, `constraints`, optional Mermaid `diagrams`, and at least two `solutionTracks`.
- Every solution track requires `steps`, `explanation`, `complexity`, and `languages.python`, `languages.typescript`, and `languages.java`.
- Generated index schema version is `6` and includes interview companies plus validated home discovery curation.

## Future Versions

- Add system design interview question packs beside coding prompts.
- Let users code their own solution in the browser.
- Add real-time compile/run validation for supported languages.
- Add durable attempts, spaced repetition, and scoring on top of the basic auth/progress contract.
- Consider hosted search or sync later, but keep repo JSON canonical unless a future feature doc changes the source of truth.

## Source Basis

Seed content uses public/community-reported prep references such as InterviewQuery company guides, reported public LeetCode discussions, and public company question lists. These links are attribution and further reading; Codematica prompts, explanations, and code are original rewrites.

## Test Plan

- Unit: schema validation, duplicate company/question/solution IDs, required source links, and required language code.
- Integration: generated index loads eight companies, 27 questions, including the BFS/DFS graph-search additions, and lookup helpers resolve company and question routes.
- Component: guided walkthrough advances steps, switches language, shows highlighted final code/explanation, and restarts on a different solution track.
- E2E: user opens `/interviews`, sees the complete question catalog, uses random navigation, opens Amazon, starts Two Sum, advances steps, switches language, and reaches the final explanation.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/interview-coding-catalog.md first. Compare the documented interview catalog contract against content/interviews/*.json, packages/core/src/content/schema.ts, packages/core/src/content/build-index.ts, apps/web/src/components/InterviewCatalog.tsx, apps/web/src/components/InterviewQuestionSession.tsx, and apps/web/src/app/interviews/**/page.tsx, then update tests and docs with any behavior changes.`
