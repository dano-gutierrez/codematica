# Selected evidence review

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-04`
- Owner thread: `n/a`
- Current state: Eleven original lessons and 55 scenario choices form three source-required paths; hosted rollout is separate.
- Target outcome: Check concise technical and ownership claims through explicit assumptions, evidence and counterexamples.
- Code touchpoints: `content/learning-paths/{engineering-evidence-review,creative-computing-review,ownership-and-funding-review}.json`, `content/sources/selected-evidence-review.json`, their lesson/checkpoint files and the generated content index.
- Primary tests: `packages/core/src/content/evidence-review.test.ts`, `scripts/knowledge/catalog.test.ts`, `apps/web/e2e/specs/selected-evidence.regression.spec.ts`.

## One-Minute Brief

These paths teach selected concepts with original fictional cases. Engineering review covers local decisions, credential containment, Java ownership/concurrency/proxy contracts, domain boundaries, cloud responsibility, federation and card-payment receipts. Creative computing covers bounded visual prediction, sampled surfaces and trigger state. Ownership review uses a simplified share-count model and scoped SAFE reading. Each lesson leads to five explained choices.

## Outcome / Contract

- Every published unit contains one lesson and its five-question checkpoint, with a path-scoped skill, required sources and an 80% curriculum threshold.
- Preserve previous documents, exercises, paths, interview identities and human-language content.
- Sources identify selected primary passages and editions. Authored cases copy no saved-post bodies, upstream implementation, diagrams, scenes or course attachments.
- Paper assumptions govern the exercises. A score establishes only those answers, not installed-system behavior, licensing permission, financial rights or complete course proficiency.
- Canonical resources remain distinct. The graph exports explicit membership, order, skill coverage and citations; model extraction cannot merge these identities.

## Current State

The canonical content uses existing web/native readers, questionnaire scoring and generated indexing. No parser, renderer, provider, migration or runtime dependency is added. Reindexing and synchronized projection activation remain explicit operations. Local graph calibration and hosted activation have their own evidence in the knowledge evaluator contract.

## Scope

### In Scope

Selected primary-source concepts, original finite paper traces, five-choice checkpoints, three ordered paths and explicit graph relationships.

### Out Of Scope

Full vendor courses, unseen raster attachments, copied assets, live credential/payment/cloud mutations, engine/JVM installations and legal or investment decisions.

### Assumptions

Learners use the declared fictional state and numeric inputs. Unity anticipation documentation is archived at the cited commit; Java is SE23; Blender references the inspected 5.2 manual. Server-code and model-weight licenses remain separate.

## Detailed Behavior

### UI / UX

Paths open their existing document routes. A lesson continues to its checkpoint; completed practice continues to the next lesson in that path. The final checkpoint has no next activity. Source panels link to dated primary references. Existing anonymous learning and native readers remain independent of the local knowledge service.

### Data Model And Persistence

Markdown and JSON remain canonical. Each new source has a stable `evidence-` identity, verification date and selected scope. DDD records CC BY4.0 and Blender prose records CC BY-SA4.0 from their inspected license statements; no other redistribution license is inferred. Existing progress persistence is unchanged.

### Business Logic

OpenJev expected-index, choice, missing-evidence and ordered-option contracts are separate. Containment uses explicit fictional incident authority. Java visibility does not imply atomic increment, deep record immutability or proxy self-invocation. Cloud acceptance does not imply outcome. OIDC uses the exercise's trusted signature verifier and sent nonce, plus independent object authorization. Payment hold/capture/settlement receipts differ. Creative cases declare clock mapping, horizon, session and geometry units. Ownership arithmetic declares securities, denominator and omitted rights.

### Failure And Edge Handling

Stale sequence/session events cannot overwrite the selected fictional state. Missing evidence remains unknown. A timed-out payment operation is not assumed absent. Coarse samples or attractive shading do not prove geometry. Later share issues change the denominator. The app performs no external operation for these choices.

## Code Touchpoints

- `packages/core/src/test/evidence-review-fixture.ts`: independently reviewed expected choices, without reading authored correctness flags.
- `packages/core/src/content/evidence-review.test.ts`: answer keys, sources, skill scope and next routes.
- `scripts/knowledge/catalog.test.ts`: canonical/scoped graph identities, ordered membership and cited source coverage.
- `apps/web/e2e/specs/selected-evidence.regression.spec.ts`: eleven source-to-checkpoint-to-next journeys.

## Test Plan

Browser source checks open the Primary sources disclosure before inspecting visible links and their exact destinations.

- Red first: eleven missing-resource cases failed before authoring. A mistaken test call passed a string to the existing next-route API; corrected the test to its documented node object and path query without changing production.
- Unit/integration: all 55 reviewed answers, single correct option, question/quiz skill scope, source metadata and lesson/checkpoint routes; three graph paths, eleven qualified skills and 27 source identities.
- E2E: `@regression` journeys read a selected heading/source, grade all five answers and inspect the next or terminal route.
- Adequacy: targeted answer, source and skill/order mutations must fail; restore originals before aggregate checks. Finite numeric examples are independently calculated; no arbitrary-input/runtime certification is claimed.
- Coverage: existing floors and instrumentation remain unchanged.
- Required commands: content freshness, lint, configured types, focused checks, both Vitest coverage lanes, native coverage/Doctor, existing isolated Python companions, build, pruned production readiness and the browser lane.

Local validation passes 835 Vitest tests through each unchanged coverage gate, 161 native tests, Doctor20/20, eleven browser journeys, Python companions, lint, types, content freshness, build and production-only startup. Heavy extraction was paused and Vitest used one worker after eight unrelated timeout failures; those logs remain retained. All 86 valid answer, source, skill and order mutations failed before the original bytes were restored. Independent finite arithmetic/state references pass. Remote release checks and graph activation are separate validations.

## Open Questions

- Add actual engine/runtime labs only under a separate execution and asset contract.
- Independent human labels are still required before treating graph routing probabilities as reliable accuracy.

## Decision Log

- `2026-10-04`: Group complementary selected concepts into three bounded paths; preserve source/course and original authored-content distinctions.

## Documentation Updates

The docs hub, core/content READMEs and changelog describe these additions. Existing indexing and reading architecture is unchanged; no Mermaid or topology update is required.

## Thread Handoff Prompt

Read this contract and the knowledge evaluator runbook. Preserve original fictional assumptions, primary-source scope, prior canonical identities and path-qualified skills. Inspect source changes before updating answers or exporting a new snapshot.
