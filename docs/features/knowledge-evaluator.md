# Knowledge graph and local content evaluation

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-03`
- Owner thread: `n/a`
- Current state: An isolated local graph/model service, admin Supabase projection, web explorer and graph-bound LinkedIn preparation are implemented in the stacked PR. Hosted migrations and rollout have not run.
- Target outcome: Compare a candidate with the complete included catalog before authoring, preserve evidence through review, and apply only human-reviewed relationships.
- Code touchpoints: `packages/core/src/knowledge.ts`, `scripts/knowledge/`, `services/knowledge/`, `apps/web/src/components/KnowledgeAdmin.tsx`, `scripts/linkedin/knowledge.ts`, migrations `202610030003` and `202610030004`.
- Primary tests: catalog/worker/review tests, Python graph/API tests, knowledge and LinkedIn pgTAP tests, knowledge/editorial browser journeys, `scripts/knowledge/smoke-editorial.ts`.

## One-Minute Brief

The service maps Codematica content and searches it before a new lesson or post is written. Graphiti stores relationships; local BGE embeddings retrieve passages; OpenJev recommends overlap and placement; Qwen extracts supported concepts and explains decisions. Canonical Markdown and JSON remain authoritative. The explorer and saved reports work from Supabase while this Mac is offline. Models run only on the Mac.

## Outcome / Contract

- Index every included authored resource through the validated parser. Exclude human-language curriculum by directory and curriculum metadata; retain programming content. Keep private posts in an admin-only collection.
- Preserve stable type-qualified resource IDs, path-scoped skills, source paths, hashes, statuses, membership and post revision/publication identity. Index campaign, level and scenario resources from the validated game catalog. Extraction cannot merge or rename authored resources.
- Keep explicit, inferred and approved relationships distinguishable. Inferred claims require literal source quotes. Explicit edges identify their defining source file and hash. Rejected extracted claims are counted and omitted. Unresolved free-text prerequisites remain visible; path order alone does not establish a prerequisite.
- Search lexical and embedding evidence across the complete included catalog, then inspect a bounded graph neighborhood and candidate shortlist. Similarity alone is not a duplicate decision. Cross-format reuse and different audiences or difficulty remain distinct cases.
- Stage one of `update_existing`, `create_resource`, `create_path`, `skip_duplicate`, `split`, or `needs_review`, with evidence and placement. Incomplete semantic coverage or low model confidence requests review; model probabilities are not calibrated accuracy.
- A report never edits authored content, queues Codex or publishes. The sidecar writer serializes applications, rechecks each job against live source hashes, validates curriculum evidence before private writes, and marks completion only after every edge applies. Reviewed curriculum relationships go to `content/relationships.json`; private approved links remain in Supabase. New content requires an authoring edit and reindexing.
- Shared models serialize inference across Python and editorial Node processes through one OS file lock. No hosted-model fallback exists. Credentials stay outside content and reports.
- Enrollment in graph-assisted LinkedIn preparation is durable in Supabase. Graph context reaches the writer, the editorial OpenJev assessment and the compact Codex handoff. Verification acknowledges its hash. Stale projections block adoption, approval and the final Buffer gate.
- Graph holds can proceed to Codex only with a recorded reviewer reason and a verifiable candidate. Canonical source failures cannot be overridden.
- Anonymous learning routes do not import or depend on the graph, its database or the local model runtime.

## Current State

The validated curriculum baseline includes 59 documents, 453 sections, 12 paths, 12 defined skills, 60 units, 59 exercises, 9 feeds, 657 flashcards, 10 interview collections, 35 questions, 78 solution tracks, 5 diagrams and 90 source records. This baseline predates PR #14: the merged campaign adds four documents plus its campaign, twelve levels and 36 scenarios. The private export inspected locally contains 100 current posts. Each indexing run records actual counts, exclusions, unresolved references, source manifest, Git revision and working-tree state; these figures are a baseline, not an assertion about future inventories.

The complete catalog and embeddings are available. Bulk semantic extraction and the 40-case local routing benchmark are resumable experiments. Check the current status and benchmark report before claiming complete semantic coverage or recommendation accuracy. Initial labels are engineering fixtures, not an independent human evaluation. Hosted rollout and installed-device validation are separate from local tests.

## Scope

### In Scope

Local REST/MCP reads and staged evaluation, Graphiti/Neo4j persistence, exact/lexical/embedding retrieval, incremental caches, coverage reporting, admin projections and offline jobs, web graph/table exploration, reviewed relationship proposals, and LinkedIn first-pass context.

### Out Of Scope

Automatic authorship, human approval, content publication, model training, a hosted MLX runtime, public graph access, and human-language learning content.

### Assumptions

One operator on an Apple Silicon Mac with Docker and the existing local writer/OpenJev servers. Supabase coordinates work but cannot run MLX. OpenJev weights are CC-BY-NC-4.0; commercial deployment requires appropriate permission. See the operating instructions before rollout.

## Detailed Behavior

### UI / UX

`/admin/knowledge` has search, type/path/skill/status/visibility/provenance filters, paginated neighborhood expansion and an accessible table. Sections, flashcards and solution nodes are hidden by default. Selected resources show source paths and hashes; proposals show supporting quotes. Candidate submission and review are admin-only. Recent-job summaries omit full report bodies and lease tokens; full reports load on selection. Worker freshness and incomplete extraction remain visible. Account changes clear private resources, reports and candidate drafts; token refresh preserves editing.

The LinkedIn reviewer shows related content and reports for the selected revision. Unsaved edits cannot submit a report for the saved revision. Existing native editorial review remains supported; the graph explorer is a web interface.

### Data Model And Persistence

Candidate hashes preserve exact title/body whitespace across TypeScript, Python and PostgreSQL. A missing current or sent private revision fails the export instead of silently reducing coverage.

Canonical IDs include `document:<slug>`, `interview-question:<collection>/<slug>`, `skill:<path>:<skill>` and `post:<uuid>`. Published historical post revisions use a separate suffix; normalized display status never replaces original post status when rebuilding hashes.

SQLite holds source snapshots, embedding/inference caches, extraction checkpoints and local staged jobs. Neo4j holds Graphiti resource, concept, episode and edge records, with separate authored and inferred partitions and separate private concepts. The API serves only the active source snapshot and source-bound extraction results. Old source versions cannot contribute current inferred edges.

Supabase stores immutable graph projections and private jobs/reports. Projection activation validates resource identities and references in one transaction and retains the previous projection on failure. Service-only leases limit attempts to three. Browser clients cannot claim jobs, activate snapshots or access lease tokens, service credentials or local model endpoints.

### Business Logic

Full extraction exits unsuccessfully while gaps remain; a bounded pilot may stop early. Qwen retries malformed or truncated output once with a larger bounded token budget. Indexing reuses vectors and completed extraction for unchanged source/prompt/model keys. Failed or interrupted extraction leaves visible gaps. Bounded ingestion uses Graphiti's Qwen-backed structured client and node/episode/edge persistence. The native `Graphiti.add_episode` path is retained and was piloted; bulk import uses the smaller validated extraction contract rather than that more expensive default multi-pass pipeline. This distinction matters when reproducing latency and extraction quality.

Supporting quotes may be short code fragments, such as `max: 8`. Quotes must be nonempty, occur verbatim in their source passage and contain the supported concept names. Unsupported concepts and relationships are discarded and counted.

The single JSON repair retry receives the failed output and validation location. It requests compact quotes while keeping schema and literal-evidence validation. Retry metadata identifies this policy separately; completed validated extraction remains reusable.

BGE runs on CPU with 384-token windows and 48-token overlap, normalized pooling and four PyTorch threads. Evaluation retrieves diverse parent resources so one lesson's sections do not crowd out alternatives. Exact matching preserves case-sensitive code and literal whitespace, including Python indentation. The local API requires a private bearer token and accepts only loopback model origins, with redirects and environment proxies disabled.

After preparation enrollment, run `enable-knowledge --all-review` to enroll unapproved review drafts. Approved/rejected drafts are left alone. The command backs up editorial state first, requires an active graph and no running preparation/refinement jobs, and replaces pending unbound work. Newly created drafts inherit enrollment. Suggested imports start analysis when the reviewer requests refinement.

A preparation binds the original revision, saved graph job, projection/catalog IDs, compact evidence and its canonical JSON hash. Codex checks the full candidate body and first comment and returns that graph hash. Human adoption changes the current revision while preserving the source preparation binding. A fact-only confirmation preserves it; a text change requires new preparation. Source/projection changes require reevaluation before adoption, approval or sending.

### Failure And Edge Handling

An unavailable model fails closed. Unsupported source claims, missing references, ambiguous overlap and incomplete indexing request review. A recorded graph override retains warnings and sends the resulting candidate to independent Codex verification; it does not confirm facts or approve a post.

A new graph projection invalidates pending review/publication bindings. Stop and prepare against the current graph rather than bypassing the gate. Expired leases cannot complete jobs using old tokens. The local SQLite worker also uses a lease token, so a delayed worker cannot overwrite a reclaimed job. Unknown Buffer outcomes still require reconciliation; graph integration does not change exact-revision approval or retry policy.

## Code Touchpoints

- `scripts/knowledge/catalog.ts`: inventory, IDs, authored relationships and exclusions.
- `services/knowledge/knowledge/`: local storage, embeddings, Graphiti adapter, retrieval/evaluation and authenticated API.
- `services/knowledge/mcp_server.py`: the same five staged/read capabilities for chats.
- `scripts/knowledge/worker.ts`: projection sync and leased offline jobs.
- `scripts/linkedin/knowledge.ts`: compact evidence for local preparation and Codex.
- `supabase/migrations/202610030004_linkedin_knowledge.sql`: durable enrollment and graph guards around existing revision/lease/approval functions.

## Test Plan

- Unit/integration: full authored inventory, human-language exclusions, retained programming material, stable IDs, scoped skills, granular interviews, campaign/level/scenario coverage, status-preserving post hashes, stale evidence, transport validation, cache/inference locking and graph override recovery.
- Database: RLS/anonymous rejection, atomic activation, idempotent offline submissions, expired leases, candidate hashes, evidence validation and stale preparation/verification/adoption/publication.
- Browser: graph/table navigation, evidence, candidate queueing, review, denied access, offline freshness and LinkedIn context. Regression classification: `@regression`.
- Real local experiment: graph retrieval plus OpenJev/Qwen first pass, independent agent verification, authenticated synthetic adoption/approval and inert Buffer scheduling/reconciliation. No real Buffer request.
- Quality: 40 labeled local cases covering duplicates, updates, level changes, reuse, new paths and injection; report retrieval, routing errors, abstention, latency and process RSS. Reliability requires independent labels/calibration beyond this initial set.
- Coverage: new TypeScript domain/UI code is instrumented; existing floors are unchanged. Python has its own isolated unit lane. CLI orchestration is exercised through integration smokes.
- Required commands: see [the runbook](../runbooks/knowledge-evaluator.md), plus lint, configured typechecks, both coverage lanes, native coverage, content freshness, Expo Doctor, web build and production-pruned HTTP smoke.

## Open Questions

- Independently label and calibrate more real authoring candidates before reducing review holds.
- Confirm OpenJev licensing for intended commercial use.
- Verify hosted migrations and UI rollout after local acceptance, separately from this implementation.

## Decision Log

- `2026-10-03`: Keep canonical content distinct from model-resolved concepts; use human-reviewed sidecars and admin projections.
- `2026-10-03`: Stack on LinkedIn local preparation, share one inference lock and persist graph evidence through exact-revision review.

## Documentation Updates

The docs hub, architecture/context guides, affected READMEs and changelog describe the graph service and its optional integration. Operating commands live in [the runbook](../runbooks/knowledge-evaluator.md).

## Thread Handoff Prompt

Read `docs/codex-context.md`, this feature contract and `docs/runbooks/knowledge-evaluator.md`. Check current indexing/benchmark evidence and active projection before continuing. Preserve local-only inference, private-data isolation, immutable sources and exact human approval. Update the learning log outside the public content tree; do not export private research into curriculum.
