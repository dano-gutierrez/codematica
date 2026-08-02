# Interview Coding Catalog

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-02`
- Owner thread: `n/a`
- Current state: The app has company interview preparation plus an anonymous real-world section, guided algorithm walkthroughs, and runnable React/TypeScript web exercises.
- Target outcome: Users can study public company patterns or authentic anonymous briefs, understand evaluation criteria and red flags, and run accepted frontend solutions without requiring auth or Supabase.
- Code touchpoints:
  - `content/interviews/*.json`
  - `public/company-logos/*.svg`
  - `packages/core/src/content/schema.ts`
  - `packages/core/src/content/build-index.ts`
  - `apps/web/src/components/InterviewCatalog.tsx`
  - `apps/web/src/components/InterviewQuestionSession.tsx`
  - `apps/web/src/components/WebInterviewQuestionSession.tsx`
  - `apps/web/src/components/WebPlayground.tsx`
  - `apps/web/src/components/CodeBlock.tsx`
  - `apps/web/src/app/interviews/**/page.tsx`
- Primary tests:
  - `packages/core/src/content/build-index.test.ts`
  - `packages/core/src/content/index.test.ts`
  - `apps/web/src/lib/interviews.test.ts`
  - `apps/web/src/components/InterviewQuestionSession.test.tsx`
  - `apps/web/e2e/specs/interview-catalog.regression.spec.ts`

## One-Minute Brief

The catalog stores typed interview collections as local JSON. Company algorithm questions retain guided multi-language walkthroughs. Anonymous real-world questions document interviewer intent, accepted signals, red flags, and runnable web projects. The first real-world exercise asks users to scope and generate a Piet Mondrian-style composition through three complete React/TypeScript approaches.

## Outcome / Contract

- `/interviews` separates anonymous real-world collections from company preparation, supports question search plus collection/difficulty filters, and lets random navigation choose from either.
- `/interviews/[collection]` shows questions for a company or real-world collection; existing company URLs are unchanged.
- `/interviews/[collection]/[question]` dispatches to an algorithm walkthrough or web exercise session.
- The guided session defaults to Python, lets users switch to TypeScript or Java, reveals one step per `Next`, and renders final code with language-aware highlighting.
- Starting or restarting a session selects a solution track at random and avoids immediately repeating the previous track when another track exists.
- Web sessions expose every accepted approach explicitly, render comprehensive evaluation guidance, and mount one editable Sandpack project at a time.
- Web playground edits are transient. Sandpack code runs in a cross-origin iframe and receives no Codematica auth, progress, or secret data.
- Expo renders all web-exercise explanations and source files read-only; execution remains web-only.
- Catalog language says the prompts are reported/public prep, not official company question banks.
- Scoring, grading, persistence of edits, backend execution, and native WebView execution remain out of scope.

## Data Model

- `content/interviews/*.json` stores one `company` or `real-world` collection per file.
- Company collections require local logos and public source links. Real-world collections omit logos and require anonymous provenance notes.
- `logo.src` points to a local SVG under `/company-logos/` so the catalog does not depend on remote image loading.
- Algorithm questions require two tracks with `languages.python`, `languages.typescript`, and `languages.java`.
- Web questions require at least three tracks plus structured evaluation guidance. Each track owns a reusable `WebExerciseProject` with runtime, file map, active/visible files, optional entry, and dependencies.
- Every question has examples, constraints, optional Mermaid diagrams, and solution tracks appropriate to its discriminated kind.
- Generated index schema version is `7` and includes generic `interviewCollections` plus validated home discovery curation.

## Future Versions

- Add system design interview question packs beside coding prompts.
- Add deterministic grading and authored tests on top of the shipped editable web runtime.
- Add durable attempts, spaced repetition, and scoring on top of the basic auth/progress contract.
- Consider hosted search or sync later, but keep repo JSON canonical unless a future feature doc changes the source of truth.

## Source Basis

Seed content uses public/community-reported prep references such as InterviewQuery company guides, reported public LeetCode discussions, and public company question lists. These links are attribution and further reading; Codematica prompts, explanations, and code are original rewrites.

## Test Plan

- Unit: collection discrimination, conditional provenance, safe project paths, active/visible file references, web track minimums, and algorithm language requirements.
- Integration: generated index loads company and real-world collections, including graph-search additions, and resolves both route forms.
- Component: algorithm walkthrough behavior remains stable; web sessions switch all approaches and map files into Run/Reset playground controls.
- Native: real-world content and every source file remain available without executing the project.
- E2E: catalog search/filter and the existing Amazon flow remain covered; the Mondrian flow verifies rubric content, three approaches, and live preview output.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/interview-coding-catalog.md first. Compare the documented interview catalog contract against content/interviews/*.json, packages/core/src/content/schema.ts, packages/core/src/content/build-index.ts, apps/web/src/components/InterviewCatalog.tsx, apps/web/src/components/InterviewQuestionSession.tsx, and apps/web/src/app/interviews/**/page.tsx, then update tests and docs with any behavior changes.`
