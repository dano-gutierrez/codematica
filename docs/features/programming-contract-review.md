# Programming Contract Review

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-04`
- Current state: Four original lessons, twenty scenario choices and four path-scoped skills use existing readers and questionnaires.
- Target outcome: Learners can challenge selected programming summaries with explicit input/ownership rules and independent counterexamples.
- Code touchpoints: `content/knowledge/programming/`, `content/exercises/programming/`, `content/learning-paths/programming-contract-review.json`, `content/sources/programming-contract-review.json`.
- Primary tests: `packages/core/src/content/programming-contracts.test.ts`, `scripts/content/verify-programming-labs.mjs`, `scripts/content/verify-durable-labs.py`, `apps/web/e2e/specs/programming-contracts.regression.spec.ts`.

## One-Minute Brief

Concise programming summaries can hide differences between a fixed binding and shared mutable values, producing and consuming a sequence, matching a substring and validating text, or a tree shape and its ordering. This path teaches those distinctions through original local fixtures. It reuses the existing lesson/checkpoint/progress UI.

## Outcome / Contract

- The four ordered units cover value ownership, bounded demand, text domains, then shape/cost reasoning. Each lesson has five sections and a five-choice checkpoint.
- Every source record identifies its selected primary scope and verification date; no upstream question bank, diagram or implementation is copied.
- Four skills are scoped to this path. Each published stage requires its lesson and checkpoint, uses an 80% overall/per-skill threshold and estimates thirty minutes. This is a curriculum policy, not an external qualification.
- Existing eighteen coding interviews and all eight Coding Interview Pattern Practice units remain unchanged. Its keypad checkpoint remains terminal.
- Only the existing questionnaire is graded in the app. Original code fences run separately in allowlisted inert verification; browser/native readers execute no code.

## Current State

Canonical content and the generated index are authored on the branch. Local checks pass: both 751-test coverage gates, 154 native tests, Doctor 20/20, eleven Python labs, three JavaScript labs, four browser journeys, lint, types, freshness, build and disposable production-only readiness. All 54 lab and 27 metadata mutations fail. The first coverage run had three handwriting timeouts; all nineteen handwriting tests and both full gates passed on rerun. The first artifact copy collided with a browser-test build; the sequential retry passed. The first remote release passed quality/database, with 159 browser passes, six configured skips and one unrelated accessibility timeout. Its roughly nineteen-second Axe scan exhausted the combined thirty-second budget with later layout work. The audit and layout journey now have separate fresh-page tests with all assertions and the same deadline. Failure evidence is retained; exact-head remote remediation validation remains required. No deployment is claimed.

## Scope

The JavaScript lesson covers selected bindings, shallow sharing, own enumeration, equality, call receivers and collection mutation. The demand lesson traces a synthetic generator and a deliberately partial transducer example; streaming pressure, host scheduling and tus offset conflicts are source-backed paper reviews. The text lesson accepts only bounded ASCII, with a separate position oracle. The tree lesson accepts bounded immutable tuple positions, checks ancestor bounds and counts one original selection algorithm's comparisons.

Full language/runtime syllabi, a complete transducer protocol, Unicode segmentation, general regex runtime certification, a real upload service, AVL updates and arbitrary graph validation remain outside these contracts. No private saved-post body or attachment enters the public curriculum.

## Detailed Behavior

Published lessons and checkpoints appear in the existing browse/search/path surfaces. Path-scoped links continue from each document to its checkpoint and then to the next lesson. The final shape/cost checkpoint has no next activity. Primary sources appear through the shared source panel.

Markdown, exercise/path/source JSON remain canonical. The validated parser generates the index. Graph export imports path membership, unit ordering, source citations and path-qualified skill coverage through existing contracts; it adds no inference calls during content generation. Private review receipts stay outside Git.

Invalid input is rejected before a fixture's shortcut. The generator validates zero/invalid limits before opening its synthetic source; early exit/error executes cleanup. The text fixture checks fixed positions and an involution with a separate regex-based position oracle. Tree validation visits all accepted positions, including a malformed branch after an ordering failure; duplicates are rejected by authored policy. Cost checks retain input and compare output against the standard-library sort independently of comparison counts.

## Code Touchpoints

- `content/learning-paths/programming-contract-review.json`: ordered nodes, scoped skills and stage policy.
- `content/knowledge/programming/*.md`: original cases and three JavaScript / one Python reference fences.
- `scripts/content/verify-programming-labs.mjs`: fixed allowlist, empty child environment, temporary working directory, timeout and exact exit/stderr/output checks.
- `scripts/content/verify-durable-labs.py`: tree/cost fence alongside the existing isolated Python labs.
- `packages/core/src/content/programming-contracts.test.ts`: semantic answer keys, sources, route order and canonical JavaScript execution.

## Test Plan

Start with missing-resource/fence failures, then verify all authored fixtures. Challenge predicates, cleanup, pointer progress, ancestor bounds, completeness, input rejection and comparison counts with targeted mutations; restore canonical bytes after each check.

The `@regression` browser journeys read each lesson's actual headings/sources, finish its five answers and verify path-scoped continuation or terminal state. Generated/canonical auditing must preserve all previous resource identities and unit objects; human-language content stays untouched. Graph checks must retain four qualified skills and references.

Run focused Vitest and both fence verifiers, `npm run test:interview:python`, `npm run content:check`, lint, typecheck, both unchanged coverage gates, native coverage/Doctor, production build, disposable production-only startup and the full release regression. No coverage threshold/exclusion or runtime dependency changes. The verifier adds only Node built-ins and remains outside the application module graph.

## Open Questions

The finite fixtures do not measure deployed latency/memory or verify whole external syllabi. Full streaming/transducer and Unicode contracts would require separately scoped content.

## Decision Log

- `2026-10-04`: Group related programming gaps into one four-unit skill path; preserve existing coding identities and selected-source boundaries.
- `2026-10-04`: Use original local references, explicit rejected inputs and independent oracles; keep private post provenance in the private ledger.

## Documentation Updates

`docs/README.md` links this feature; learning-path, exercise, source and content-check READMEs describe the new contract. Architecture, storage and shared Mermaid flows remain unchanged.

## Thread Handoff Prompt

Read this feature and the canonical lessons before changing their checks. Preserve independent oracles and prior path identities; compare the documented input/ownership scope against code and questionnaires, then rerun the required gates.
