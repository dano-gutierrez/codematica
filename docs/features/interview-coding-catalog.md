# Interview Coding Catalog

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-01`
- Owner thread: `n/a`
- Current state: The app has a local-first interview coding catalog with company pages, reported-public source links, random question navigation, and guided multi-language solution walkthroughs.
- Target outcome: Users can choose a major tech company, open available coding prompts, advance through a step-by-step solution, and review Python, TypeScript, or Java code without auth, Supabase, or a compiler.
- Code touchpoints:
  - `content/interviews/*.json`
  - `public/company-logos/*.svg`
  - `src/lib/content/schema.ts`
  - `src/lib/content/build-index.ts`
  - `src/components/InterviewCatalog.tsx`
  - `src/components/InterviewQuestionSession.tsx`
  - `src/components/CodeBlock.tsx`
  - `src/app/interviews/**/page.tsx`
- Primary tests:
  - `src/lib/content/build-index.test.ts`
  - `src/lib/content/index.test.ts`
  - `src/lib/interviews.test.ts`
  - `src/components/InterviewQuestionSession.test.tsx`
  - `e2e/specs/interview-catalog.regression.spec.ts`

## One-Minute Brief

The interview catalog is a local content surface for coding interview preparation. Company entries are structured JSON, not remote data. Each question is rewritten for Codematica, tagged with community-reported/public source links, and includes two accepted solution tracks. Each solution track has guided steps, final explanation, complexity, and code in Python, TypeScript, and Java.

## Outcome / Contract

- `/interviews` shows company text-logo tiles and a random-question button.
- `/interviews/[company]` shows all available coding questions for one company.
- `/interviews/[company]/[question]` shows the prompt, examples, constraints, diagrams when present, and the guided solution session.
- The guided session defaults to Python, lets users switch to TypeScript or Java, reveals one step per `Next`, and renders final code with language-aware highlighting.
- Starting or restarting a session selects a solution track at random and avoids immediately repeating the previous track when another track exists.
- Catalog language says the prompts are reported/public prep, not official company question banks.
- Supabase, auth, saved progress, scoring, real-time compilation, and answer validation are out of scope for this MVP.

## Data Model

- `content/interviews/*.json` stores one company per file.
- Every company has `slug`, `name`, `logo`, `summary`, `status`, and `questions`.
- `logo.src` points to a local SVG under `/company-logos/` so the catalog does not depend on remote image loading.
- Every question has `sourceLinks`, `examples`, `constraints`, optional Mermaid `diagrams`, and at least two `solutionTracks`.
- Every solution track requires `steps`, `explanation`, `complexity`, and `languages.python`, `languages.typescript`, and `languages.java`.
- Generated index schema version is `4` and includes `interviewCompanies`.

## Future Versions

- Add system design interview question packs beside coding prompts.
- Let users code their own solution in the browser.
- Add real-time compile/run validation for supported languages.
- Add durable attempts, progress, spaced repetition, and scoring after auth/profile state exists.
- Consider hosted search or sync later, but keep repo JSON canonical unless a future feature doc changes the source of truth.

## Source Basis

Seed content uses public/community-reported prep references such as InterviewQuery company guides, reported public LeetCode discussions, and public company question lists. These links are attribution and further reading; Codematica prompts, explanations, and code are original rewrites.

## Test Plan

- Unit: schema validation, duplicate company/question/solution IDs, required source links, and required language code.
- Integration: generated index loads eight companies, 24 questions, and lookup helpers resolve company and question routes.
- Component: guided walkthrough advances steps, switches language, shows highlighted final code/explanation, and restarts on a different solution track.
- E2E: user opens `/interviews`, uses random navigation, opens Amazon, starts Two Sum, advances steps, switches language, and reaches the final explanation.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/interview-coding-catalog.md first. Compare the documented interview catalog contract against content/interviews/*.json, src/lib/content/schema.ts, src/lib/content/build-index.ts, src/components/InterviewCatalog.tsx, src/components/InterviewQuestionSession.tsx, and src/app/interviews/**/page.tsx, then update tests and docs with any behavior changes.`
