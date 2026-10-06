# Operate the local knowledge evaluator

This service starts on demand. Run commands from the repository root with Node 22, Python 3.13, Docker and an Apple Silicon Mac. The models are reused from the [LinkedIn local-preparation setup](linkedin-editorial.md). No hosted migrations or model deployment is implied by these commands.

## Install and start

`npm run knowledge -- install` creates `.local/knowledge/python`, installs `services/knowledge/requirements.lock`, downloads the pinned local BGE weights and creates private database/API credentials. It does not install into global Python. Dependency/model download needs network access; subsequent indexing and inference use local files and loopback services only.

The pins are Graphiti 0.30.2, Neo4j Community 5.26 with an image digest in `services/knowledge/compose.yaml`, BGE-small-en-v1.5 revision `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`, and the writer/judge revisions recorded in `services/knowledge/knowledge/config.py`. Preserve the lock and image digest when reproducing results. Graphiti is Apache-2.0, Neo4j Community GPL-3.0, BGE MIT, Qwen Apache-2.0, and OpenJev weights CC-BY-NC-4.0. Confirm permission before commercial use of those weights.

```sh
python3 scripts/linkedin/models.py start
npm run knowledge:export
npm run knowledge -- index .local/knowledge/catalog.json --extract
npm run knowledge -- start
npm run knowledge -- status
```

`knowledge:export` indexes curriculum only. To include private current/published posts, configure server credentials in a private environment and run `knowledge:export:posts`; this export reads editorial tables and never edits them. Avoid replacing a private-inclusive catalog with a curriculum-only export unintentionally.

Ports: OpenJev `8791`, Qwen `8793`, knowledge API `8795`, Neo4j Bolt `17687`, Neo4j HTTP `17474`, all loopback. Startup refuses an occupied API port. Model lifecycle commands manage only the processes recorded by their owning checkout. Reuse an existing model server rather than starting a second one.

Interrupted extraction resumes from source/prompt/model checkpoints. Re-run the index command after edits, removals or failures. Inspect counts, exclusions, unresolved references, `extracted`, `extraction_total`, `extraction_errors`, `rejected_evidence`, `semantic_complete`, source revision and working-tree state. Full `--extract` exits nonzero while gaps remain; `--limit` is a bounded compatibility pilot. Extraction completion means all source batches were processed, not that every model claim was supported. Rejected claims never become graph edges. Do not describe a partial extraction as complete. Private logs and caches may contain post text; keep `.local/` outside Git and external attachments.

All heavy calls share `~/.local/share/codematica/inference.lock`. `CODEMATICA_INFERENCE_LOCK` accepts an absolute alternative for isolated inert tests. Real graph and editorial processes must use the same path. The bearer token and Neo4j credentials are private mode-0600 files, not public application environment variables.

## Synchronize and process offline jobs

After the additive migrations are reviewed and applied to the chosen environment, put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.local/knowledge/supabase.env` with mode 0600. Browser clients use the ordinary public Supabase settings and admin membership; they never receive this file.

```sh
npm run knowledge:sync
npm run knowledge:worker -- --once
npm run knowledge:worker
```

Synchronization validates and activates one projection atomically. It preserves the old projection if upload fails. The continuous worker is an explicit foreground command; stop it with Ctrl-C. While the Mac is offline, admin clients read saved graph/report data and queue new jobs. The worker claims jobs against the active synchronized catalog, checks the local source ID, evaluates locally and completes only with its lease token. Three expired attempts become terminal.

## Use from chats

The MCP program is `services/knowledge/mcp_server.py`, run with the absolute `.local/knowledge/python/bin/python` from this checkout. It reads the token locally and talks to the running API. Register it in the chat client's MCP configuration; the service is not automatically started by an MCP call.

Tools: `search_knowledge`, `get_resource`, `get_relationships`, `evaluate_candidate`, `get_evaluation`. Evaluation returns a staged job ID; poll `get_evaluation`. Read evidence and coverage before using recommendations. MCP and REST cannot authorize publication or write authored content.

## Enroll LinkedIn preparation

Before rollout, export editorial state, settle PR #13's contracts, apply all additive migrations and deploy compatible clients. Start/reuse the models, index the private-inclusive catalog, start the API and synchronize it. Keep publishing paused during enrollment. Never overwrite live drafts with test fixtures.

```sh
node --env-file=.env --import tsx scripts/linkedin/cli.ts enable-preparation --all-review
node --env-file=.env --import tsx scripts/linkedin/cli.ts enable-knowledge --all-review
node --env-file=.env --import tsx scripts/linkedin/cli.ts prepare 5
```

Both enrollment commands save private v2 editorial backups before changing review eligibility. Knowledge enrollment persists per-post gates and queues new preparation; it cannot run with active preparation/refinement leases. It does not enroll approved or rejected posts. New posts inherit enrollment. Imported suggestions are analyzed when refinement is requested.

Read the compact Codex handoff, independently verify the complete proposed body and first comment, and acknowledge `knowledge_hash` along with the preparation/candidate hashes. Holds and warnings remain evidence to inspect. A reviewer reason can request a follow-up or flagged verification; a canonical source failure still requires a refreshed source snapshot. Completion creates a proposal. Human adoption and exact-revision approval remain separate actions. Buffer still receives only the approved body; first comments remain manual.

If the active graph changes, prepare again before adoption, approval or sending. Do not remove graph enrollment or switch to the legacy completion function to bypass stale evidence. Restoring older editorial backups does not restore the graph projection/jobs; keep publishing paused, reindex/sync and reenroll review drafts before continuing.

## Review and apply relationships

The explorer records accept/reject decisions bound to candidate and snapshot hashes. `npm run knowledge:apply-reviewed` serializes writers and validates live canonical/private source versions separately for each reviewed job and stages accepted curriculum links in the versioned `content/relationships.json` sidecar. Inspect its diff and run content/index validation before committing. Private post links go to the admin ledger and are projected only while their supporting hashes and quotes remain current.

An interrupted application can replay private edges idempotently; a job is marked applied only after all supported edges succeed. Candidate-only relationships await an authored resource and a new evaluation; the command never invents the resource or changes Markdown. Reindex and sync after accepted content or relationship edits.

## Validation and diagnostics

```sh
npm run lint
npm run typecheck
npm run test:coverage
npm run test:mobile:coverage
npm run content:check
npm run mobile:doctor
npm run build
npm run test:production:smoke
npm run test:knowledge:python
npm run knowledge -- smoke
npm run knowledge:benchmark
```

Use the repository's disposable local Supabase stack for `npm run test:db`. Reset it before pgTAP, then run `test:linkedin:local` and `test:linkedin:preparation`. Those smokes leave fixtures; do not run them against a hosted database. Use the installed Supabase CLI consistently rather than silently fetching a different version with `npx`.

The real joined editorial smoke requires an empty disposable database and the running local graph/models:

```sh
SUPABASE_WORKDIR=.local/knowledge/db node --import tsx scripts/knowledge/smoke-editorial.ts prepare .local/knowledge/editorial-flow
# Independently inspect the saved handoff and canonical evidence; write verification JSON.
SUPABASE_WORKDIR=.local/knowledge/db node --import tsx scripts/knowledge/smoke-editorial.ts complete .local/knowledge/editorial-flow /absolute/path/to/verification.json
```

The smoke intentionally pauses for independent agent verification. It uses a synthetic authenticated reviewer for adoption/approval and checks an inert Buffer payload/reconciliation. It never imports a Buffer transport or sends a real Buffer request. Failures and retained warnings remain visible in private results.

The 40-case benchmark stores resumable, source/model/evaluator-bound private reports and aggregate metrics. Its process RSS covers the benchmark process, not total MLX/Metal memory. Initial labels are not independent quality certification. Measure actual retrieval errors, abstentions and routing outcomes before relaxing conservative review thresholds.

```sh
npm run knowledge -- stop
python3 scripts/linkedin/models.py stop
```

Stop model servers through their owning checkout only. Stopping the graph service retains its persistent database volume and private state. Keep copies of source sidecars and appropriate private backups in a user-controlled durable location.
