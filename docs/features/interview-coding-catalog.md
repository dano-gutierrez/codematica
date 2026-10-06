# Interview Coding Catalog

## Snapshot

- Status: `shipped`
- Last updated: `2026-10-04`
- Owner thread: `n/a`
- Current state: The app has company interview preparation plus an anonymous real-world section, guided algorithm walkthroughs, and runnable React/TypeScript web exercises.
- Target outcome: Users can study public company patterns or authentic anonymous briefs, understand evaluation criteria and red flags, and run frontend practice solutions without requiring auth or Supabase.
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
  - `packages/ui/src/screens.tsx` and native interview routes
- Primary tests:
  - `packages/core/src/content/build-index.test.ts`
  - `packages/core/src/content/index.test.ts`
  - `apps/web/src/lib/interviews.test.ts`
  - `apps/web/src/components/InterviewQuestionSession.test.tsx`
  - `apps/web/e2e/specs/interview-catalog.regression.spec.ts`
  - `apps/web/e2e/specs/coding-patterns.regression.spec.ts`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`

## One-Minute Brief

The catalog stores typed interview collections as local JSON. Company algorithm questions retain guided multi-language walkthroughs. Anonymous real-world questions document interviewer intent, expected signals, red flags, and runnable web projects. The first real-world exercise asks users to scope and generate a Piet Mondrian-style composition through three complete React/TypeScript approaches.

## Outcome / Contract

- `/interviews` separates anonymous real-world collections from company preparation, supports question search plus collection/difficulty filters, and lets random navigation choose from either.
- `/interviews/[collection]` shows questions for a company or real-world collection; existing company URLs are unchanged.
- `/interviews/[collection]/[question]` dispatches to an algorithm walkthrough or web exercise session.
- The algorithm session defaults to Python, lets users switch to TypeScript or Java, reveals one step per `Next`, and renders final code with language-aware highlighting.
- Path-scoped algorithm sessions expose the authored next activity after the full web explanation; restarting hides it again. Web standalone and unknown paths have no continuation. Native routes reject unknown and inherited path keys and retain existing unambiguous path inference for direct links; read-only algorithm readers navigate without certifying completion.
- Coding Interview Pattern Practice groups 18 existing questions plus BFS/DFS lessons and checkpoints. It preserves question identities, solutions and difficulty; backtracking and comprehensive dynamic programming are outside its scope.
- Starting or restarting an algorithm session selects a solution track at random and avoids immediately repeating the previous track when another track exists.
- Web sessions default to the first approach, reveal recipe steps, and expose code/explanation at the end or via Show full solution. Optional Python companions share the language switch; one editable Sandpack project mounts at a time.
- Web playground edits are transient. Sandpack code runs in a cross-origin iframe and receives no Codematica auth, progress, or secret data.
- Expo renders all web-exercise explanations and source files read-only; execution remains web-only.
- Catalog copy identifies prompts as reported/public preparation, not official company question banks.
- Scoring, grading, persistence of edits, backend execution, and native WebView execution remain out of scope.

## Data Model

- `content/interviews/*.json` stores one `company` or `real-world` collection per file.
- Company collections require local logos and public source links. Real-world collections omit logos and require anonymous provenance notes.
- `logo.src` points to a local SVG under `/company-logos/` so the catalog does not depend on remote image loading.
- Algorithm questions require two tracks with `languages.python`, `languages.typescript`, and `languages.java`.
- Web questions require at least three tracks plus structured evaluation guidance. Each track owns a reusable `WebExerciseProject` with runtime, file map, active/visible files, optional entry, and dependencies.
- Every question has examples, constraints, optional Mermaid diagrams, and solution tracks appropriate to its discriminated kind.
- Generated index schema version is `11` and includes generic `interviewCollections` plus validated home discovery curation.

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
- Component: algorithm continuation covers selected/unknown/inherited-key/blank/absent paths, full-explanation gating and restart; standalone walkthrough behavior remains stable; web sessions switch all approaches and map files into Run/Reset playground controls.
- Native: real-world content and every source file remain available without executing the project. Algorithm continuation checks exact destination, one navigation attempt and no automatic completion. Route tests cover known, inferred, blank, unknown and inherited path keys. `.maestro/coding-patterns.yaml` covers path → algorithm → next question; installed Android/iOS execution remains unverified for this change.
- E2E: coding-pattern path → full explanation → next question and standalone reading; catalog search/filter and the existing Amazon flow remain covered; the Mondrian flow verifies rubric content, three approaches, and live preview output.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/interview-coding-catalog.md first. Compare the documented interview catalog contract against content/interviews/*.json, packages/core/src/content/schema.ts, packages/core/src/content/build-index.ts, apps/web/src/components/InterviewCatalog.tsx, apps/web/src/components/InterviewQuestionSession.tsx, and apps/web/src/app/interviews/**/page.tsx, then update tests and docs with any behavior changes.`

## 2026-09-27 Correctness Audit

Reviewed all nine pre-existing collections: 27 algorithm questions with 54 tracks (162 language snippets), plus Mondrian's three runnable web tracks. Also reviewed Product Engineering's four lessons, 18 questions and 12 briefs; RTK Query's seven lessons, 42 questions and 21 briefs; and BFS/DFS's two lessons, 12 questions and 16 briefs. The audit checked prompt/example agreement, algorithms, boundaries, complexity, answer keys, distractors, and provenance. It is not exhaustive proof over arbitrary inputs.

Corrections:

| Area | Verified finding and correction |
| --- | --- |
| Airbnb | “Reverse trie” repeated hash-split code. Replaced it with a pairwise baseline in all languages, retained its stored track ID, and included output space. Added missing flat-map reads and standard filesystem method aliases. Documented valid-path assumptions and language-specific path/string costs. |
| Amazon | TS top-k used full sorting under a heap label; now includes an actual binary heap. Fixed k=0 bucket handling, stated valid k, guarded TS iterator typing, and widened Java two-sum arithmetic. |
| Apple | The second delimiter solution only supported parentheses. Replaced it with a complete three-type reduction baseline and O(n²) cost. Replaced overflow-prone Java interval comparison. |
| Google | Fixed identical word-ladder endpoints and included string construction in complexity; clarified nonempty median inputs and widened Java median addition. Number-of-islands now shows character cells, matching its implementations. The first Java binary-matrix track now preserves input with visited state. |
| Meta | Fixed UTF-16 index/code-point mismatch that corrupted emoji while removing parentheses. Avoided repeatedly copying a BFS column array; corrected its complexity and the bounded recursion cost of the one-deletion variant. Explicitly distinguished vertical-order tie contracts. |
| Microsoft | Added missing `top` in both stacks and missing deserializers; tree codecs now round-trip sparse/null trees. Stated valid operations and wire-input assumptions. |
| Netflix | Added heap-cache reads in all languages, implemented the TS binary heap, and accounted for obsolete expiry records and cleanup work. Clarified window space variables. |
| Uber | Implemented real TS heaps for Dijkstra and rooms. Replaced the unit-weight-only second road solution with Bellman–Ford in all languages while retaining its ID. Stated positive-duration meetings and conservative complexity for compression-only union-find. |
| Mondrian | Replaced “would be accepted” guarantees with practice-criteria rationale. All three existing runnable approaches remain available through explicit reveal. |
| BFS/DFS | Corrected review/guide memory claims: a head-index array retains processed entries; iterative DFS marking on pop can retain O(E) pending entries. Corrected TypeScript snippet labels. |
| Other review snippets | Backfilled actual TS/Python/SQL/Mermaid/TOML/bash/plain-text languages instead of rendering every snippet as Python. Source-lesson links retain path context. |

`interview-audit.test.ts` began with 12 reproduced failures and now executes the repaired TS behaviors. Python regressions execute the corresponding canonical snippets and parse all 54 algorithm examples. All 54 Java snippets were compiled locally with JDK 17 using minimal standard node/import wrappers; this is compilation evidence, not full Java behavioral coverage. The new frontend solutions use the stricter exact-project/Python execution gate described in [Frontend Interview Practice](frontend-interview-practice.md).

The Product Engineering contracts and answer keys needed no factual correction. RTK's dated 2.12.0 baseline and release milestones were checked against [official release notes](https://github.com/reduxjs/redux-toolkit/releases/tag/v2.12.0), [infinite query documentation](https://redux-toolkit.js.org/rtk-query/usage/infinite-queries), and [createApi](https://redux-toolkit.js.org/rtk-query/api/createApi). The persistence lesson already separates raw Redux restoration from RTK rehydration and code validation from deployment. Its private incident is retained as a dated attributed report, not newly verified production evidence. Existing Product/RTK content tests and browser journeys remain part of validation.
