# Operating the LinkedIn editorial queue

## Local setup and account access

Use Node 22 and `npm ci` in the repository. Root `.env` contains only locally managed `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for operator commands. Never print or copy the service key into an app. Configure public URL/publishable key in `apps/web/.env.local` and the corresponding EXPO_PUBLIC variables in `apps/mobile/.env.local` for client Auth/REST.

Confirm the owner's personal email. The owner must create and verify their app account through `/login`; existing Supabase dashboard credentials are a separate identity. Find that verified Auth user UUID using the Supabase dashboard, then run:

```sh
npm run linkedin -- bootstrap VERIFIED_AUTH_USER_UUID
```

This grants database-backed admin membership. Sign in again or focus the app to refresh navigation. Open `/admin/linkedin` on web or More → LinkedIn posts on native. Never bootstrap an arbitrary or unverified account. The worker cannot perform this setup.

## Review and daily scheduling

1. Select an existing draft, or use Create → title/topic/post text → Add for analysis. Manual drafts automatically queue preparation when enabled, or legacy refinement, and require Use revision before approval. Select text for Unicode bold/italic or bullets; Plain text removes supported styling. Editing analyzed manual text requires another Refine. Review the draft, edit if needed, then Save revision.
2. With local preparation enabled, run a local batch, inspect flags, then ask Codex to verify ready work. Otherwise Refine uses `prompts/linkedin/refine.md`. The manual worker records a proposal. Use revision adopts it without approving it.
3. Verify flagged facts, save that confirmation and resolve placeholders.
4. Approve & queue authorizes the exact revision to be scheduled on the configured Buffer channel. Approvals beyond Buffer's free capacity stay in Supabase.
5. Return to review cancels a pending local schedule immediately or queues a Buffer move-to-draft. Editing unlocks only after confirmed cancellation. Publication can beat cancellation; an already sent post remains locked.

Buffer has one recommended slot per day, timezone America/Los_Angeles. Inspect current channel settings in Buffer before changing cadence. First comments are manual on Free. The worker must neither rewrite approved text nor add content during scheduling.

## Worker and costs

The recurring `linkedin-editorial-worker` automation has been deleted. When requests are ready, tell Codex: “Process the LinkedIn queue using prompts/linkedin/worker.md.” Each manual run processes incoming work under that contract. Requests remain durable in Postgres between runs. The workflow uses the existing Codex account usage allowance, Supabase storage/requests and Buffer Free quotas. There is no separate OpenAI API key or model billing integration.

Useful read-only and private-file commands:

```sh
npm run linkedin -- status
npm run linkedin -- schema
npm run linkedin -- validate-seed /absolute/path/to/posts.json
npm run linkedin -- export
```

Seeds contain `seed_key`, `title`, `topic`, `body`, `first_comment`, and `sources` (each with path/hash/title/excerpt/urls). `import FILE` validates the full collection and never overwrites an existing seed key. Keep seed files under ignored `.local/linkedin/`; do not commit unpublished personal posts. Initial human-readable batch: `.local/linkedin/initial-100-review.md`.

Only an operator configures destinations/publishing, after checking the connected channel:

```sh
npm run linkedin -- configure CHANNEL_ID ORGANIZATION_ID enabled America/Los_Angeles
npm run linkedin -- configure CHANNEL_ID ORGANIZATION_ID paused America/Los_Angeles
```

The first command is setup authorization, not post approval. Every post still requires an authenticated human approval. Pausing stops new schedule claims but does not remove posts already in Buffer. Pause the Buffer queue separately when necessary.

## Recovery and backup

Exports are private timestamped JSON files under `.local/linkedin/exports/`, mode 0600. Retain old exports; copy to user-controlled durable backup storage. Each manual run exports before mutations if there is no backup from the current day. Free infrastructure is not a replacement for backups.

A `running` refinement has a twenty-minute lease. It can be renewed and retried at most three times. Scheduling/cancellation ambiguity becomes `uncertain`; do not turn it pending or call Buffer create again. Inspect Buffer by saved ID, or match channel, exact body and creation time uniquely. Save a result file and use the documented `reconcile POST_UUID REVISION_UUID RESULT_FILE` command. If identity remains ambiguous, ask the owner for a recovery decision and preserve both records.

`restore FILE` only inserts into an empty editorial collection. It never deletes existing data. It preserves IDs/history and pauses publishing while unfinished external work becomes uncertain. Referenced Auth users must exist for approved revisions; this is deliberately checked by foreign keys. Admin membership is provisioned separately. Reconcile Buffer state before enabling publishing after restoration.

## Validation and release limits

Use `supabase db reset --local` only on the disposable local stack. `npm run test:linkedin:local` refuses a non-loopback API and exercises Auth, RLS, manual creation/idempotent retry/analysis gating, CLI leases, refinement, approval, reconciliation, cancellation and export with fixture Buffer IDs; it never contacts Buffer. Run after a fresh reset for deterministic queue order.

`npm run e2e:linkedin` uses mocked editorial RPCs and fake public configuration; it never reads hosted drafts. `npm run test:production:smoke` expects an existing production build and makes a clean production-only install in a temporary directory. Retained install/runtime logs identify packaging failures without pruning the working install. Local worker commands require the full developer install (`tsx` is intentionally a development tool, absent from the web runtime).

An updated codebase and hosted schema do not deploy the web or native clients. Do not claim deployment or device readiness until those separate checks succeed. Personal account bootstrap and installed-device Maestro checks remain explicit onboarding/release tasks. Expo Doctor passes after the SDK alignment merged from `main`; continue running it after dependency updates.

## Local preparation before Codex

The preparation feature is opt-in. Its additive migration does not enable it or enroll existing drafts. Deploy the migration and matching web/native clients together, then use the controlled activation below. Inference never runs in Supabase, an Edge Function, the web server, or a hosted Hugging Face endpoint. There is no paid model API fallback. The two local servers remain idle between manually requested batches.

### Model installation on Apple Silicon

Writer: [Qwen3-14B MLX 4-bit](https://huggingface.co/mlx-community/Qwen3-14B-4bit); evaluator: [OpenJev MLX 4-bit](https://huggingface.co/openjev/openjev-MLX-4bit).

Tested runtime: Python 3.13, MLX 0.32.2, mlx-lm 0.31.3, Transformers 5.17.0, huggingface-hub 1.32.0. The tested Mac has 64 GB unified memory; both quantized models occupy about 23 GB on disk, with additional runtime memory required. Reuse an existing installation when available. For a fresh installation, from the repository root:

```sh
mkdir -p .local/linkedin/models
python3.13 -m venv .local/linkedin/venv
.local/linkedin/venv/bin/pip install 'mlx==0.32.2' 'mlx-lm==0.31.3' 'transformers==5.17.0' 'huggingface-hub==1.32.0'
git clone https://github.com/abhishekgahlot2/openjev-server.git .local/linkedin/openjev-server
git -C .local/linkedin/openjev-server checkout 032a2c5791f3d8856cc26fdb6876c106fac8dbf8
.local/linkedin/venv/bin/pip install -e '.local/linkedin/openjev-server[mlx]'
.local/linkedin/venv/bin/hf download openjev/openjev-MLX-4bit --revision c59bf1eed7d8de0eb88105a0d5517c9b4a858e16 --local-dir .local/linkedin/models/openjev
.local/linkedin/venv/bin/hf download mlx-community/Qwen3-14B-4bit --revision a4d9b2df59d2c150bef02fcbe0d91046b7ca33a4 --local-dir .local/linkedin/models/writer
npm run linkedin:models -- configure --python .local/linkedin/venv/bin/python --judge .local/linkedin/models/openjev --writer .local/linkedin/models/writer --profile .local/linkedin/openjev-server/profiles/openjev.json
npm run linkedin:models -- start
npm run linkedin:models -- status
```

`configure` also accepts absolute paths to existing installations. The manager preserves the virtual environment executable, binds judge/writer to `127.0.0.1:8791` / `127.0.0.1:8793`, and sets Hugging Face offline mode for serving. It starts no login item or recurring job. The writer uses MLX's `default_model` alias with thinking disabled. Model endpoints can be overridden in root `.env` using `LINKEDIN_OPENJEV_URL` and `LINKEDIN_WRITER_URL`; only literal loopback HTTP origins are accepted. Keep the pinned model/server versions aligned with `MODEL_VERSIONS` in `preparation.ts` when changing installations.

`npm run linkedin:models -- stop` stops only processes launched by this checkout, identified by PID and start time. `--only writer` or `--only judge` scopes any lifecycle command. An occupied port is never taken over. Logs/config/PID files are private under `.local/linkedin/runtime/`. Start failures and readiness are separate: inspect `status` after loading finishes. The lifecycle tool has no database credentials or publishing capability.

OpenJev weights use CC BY-NC 4.0; the server's permissive license does not override the model license. This implementation has been evaluated locally. Obtain the publisher's permission before commercial use, or substitute an appropriately licensed evaluator and repeat the acceptance tests.

### Activate and backfill

1. Export the hosted collection. Finish running editorial jobs; activation refuses to interrupt running `prepare` or `refine` jobs. Keep publishing under its existing human approval rules.
2. Apply `202610030001_linkedin_preparation.sql` through the normal approved migration rollout, and deploy matching review clients. Do not reset the hosted database.
3. Run `npm run linkedin -- enable-preparation --all-review`. It writes an additional private v2 backup before activation, cancels superseded pending legacy refinements and enqueues all current `review` drafts. Approved, withdrawing and rejected posts remain outside this batch. Repeating activation does not overwrite text or completed reports.
4. Start with `npm run linkedin -- prepare 5`. Review local results and holds before `npm run linkedin -- prepare --all` for the remaining eligible collection. `--all` is a bounded snapshot of eligible work, not a daemon.
5. Ask Codex to process the prepared queue using `prompts/linkedin/worker.md`. Codex receives only the selected text, original, references, generic voice rules, related IDs and flags. It independently verifies or patches that result.

### Review and retry

The collection shows Waiting locally, Preparing, Waiting for Codex, Needs attention, Codex proposal and Verified revision. Select a post to load its full details. Local preparation displays advisory before/after scores, hooks, issues, related posts and model/prompt/voice versions. It never replaces the saved original or creates approval. The original is always an eligible winner; a strong existing draft can stay unchanged.

For held work, edit/save and choose Prepare again, reject a duplicate, or enter a reason for Keep as a follow-up / Send to Codex with flags. A reason is retained with the job and sent to Codex; it does not remove warnings or grant publication permission. A held report without a candidate goes through preparation again before Codex. Source-provenance failures remain held until repaired; the reason cannot bypass them. To repair a changed source snapshot, import a new private draft with current canonical snapshots (preserve the original post), or ask Codex to diagnose the snapshot mismatch. Do not overwrite immutable revisions.

Voice rules are generic, versioned and editable from the collection screen. Saving new rules cancels pending editorial jobs and prepares eligible review drafts again. Running jobs finish against their captured version; stale results cannot advance. Completed historical analyses remain inspectable. No Slack messages or company-specific examples are stored in the voice profile.

Preparation does exact-text comparison across the current collection, then compares at most twelve lexical/topic/source candidates semantically. Approved/published history takes precedence; otherwise the oldest draft is canonical. Related topics and useful follow-ups are not automatically duplicates. Semantic scores are routing heuristics, not calibrated correctness probabilities. Same-topic false positives and missed paraphrases are possible and remain reviewable.

Model calls are cached privately by exact input, questions and pinned versions under `.local/linkedin/cache/`. Invalid cache entries are recomputed; local readiness is checked even when cache entries exist. Only current revisions are fetched once for the batch corpus. Source file hashes/excerpts and repository containment are verified before inference. Manual drafts can have no sources; they can proceed with ordinary advice or clearly stated opinion, while unsupported factual claims are held for evidence or explicit Codex review. No automatic web retrieval runs locally.

At most two writer rounds run per draft, with one candidate per round in the MLX adapter. OpenJev checks facts, meaning and voice separately from quality. The best hook gets another complete text/comment assessment before selection. Discarded candidates stay out of the Codex handoff. Malformed responses, missing judgments and unavailable models fail closed. Failed preparation retries after the existing one-hour backoff, at most three attempts per job; an expired lease can be reclaimed on the next manual batch. Editing/rejection/voice changes prevent delayed work from advancing. Private error/result files identify the failed stage without putting draft text in job errors.

For prepared jobs, `claim refine` returns a `handoff` path and an opaque job-file path. Read the handoff and `schema verification`; complete with `accept`, sparse `patch`, or `needs_input`, bound to the preparation ID and candidate hash. Related source text can be fetched on demand using `context POST_UUID REVISION_UUID`. Adoption and exact-revision approval remain separate human actions. Text/comment edits invalidate preparation eligibility; a facts-only confirmation preserves it.

### Storage, cost and validation

Supabase stores immutable originals, accepted local reports, voice versions and jobs. Model weights, caches and discarded generations stay local. Browser polling uses `linkedin_overview` with a change version and fetches `linkedin_detail` only for the selected post when needed. It no longer reloads the whole revision corpus every fifteen seconds. There is no database cron, Realtime stream or Edge Function. This design adds storage and transfer usage within the existing plan; it does not provision paid infrastructure. Check actual Free-plan quotas before rollout; don't treat a projected small report size as a live billing guarantee.

Exports use v2 and include preparations and voice profiles; v1 imports remain supported. Restore remains insert-only into an empty collection, preserves original and report identity, requeues eligible local work, and pauses publishing. Originals/history have no automatic expiry.

```sh
# Use a fresh, disposable local Supabase project; never the hosted project.
npm run test:linkedin:local
npm run test:linkedin:preparation
npm run linkedin:evaluate
python3 -m unittest discover -s scripts/linkedin -p 'test_models.py'
```

Both CLI smokes accept `SUPABASE_WORKDIR` for a separate local stack and refuse non-loopback Supabase URLs. Fake-model caches/results use a separate private temporary directory. `linkedin:evaluate` uses synthetic text and the real local models, has no database/Buffer client, and asserts that unsupported autobiographical metrics stay held. It prints reproducible character counts as a proxy for handoff/output size, not measured Codex billing tokens. Model generation is not deterministic across every hardware/runtime combination; passing these fixtures is not a claim of general editorial accuracy.

Use `PLAYWRIGHT_PORT=3217 npm run e2e:linkedin` to avoid another checkout's server. `.maestro/linkedin-admin.yaml` was updated for the preparation queue labels; installed Android/iOS checks remain required before native release. Runtime imports stay out of the Next artifact, whose retained CI smoke installs production dependencies in a disposable directory and verifies HTTP readiness without service credentials.

### Validation record — 2026-10-03

On the implementation branch rebased onto main `3144320`, configured lint/typechecks (including the new local CLI scope), content freshness, Expo Doctor 20/20, 501 Vitest tests with both coverage gates and 113 native Jest tests with coverage passed. The migration replay and 167 pgTAP checks passed in an isolated local Supabase project. Both CLI lifecycles passed with synthetic data and no Buffer requests. The final Next artifact reached HTTP readiness after a clean production-only dependency install. The four editorial browser journeys and nine public smoke journeys passed on separate ports. Three Python lifecycle checks and the shared inference-lock checks passed; the Python checks are retained in CI. Private evidence stays in ignored test-results directories.

The real local pipeline edited a repetitive draft, retained an unchanged practical draft and held unsupported autobiographical metrics; it can retain an original when a rewrite is worse. Character-count evidence showed roughly 3.2–3.6k characters for verification input and 231 characters for an accept response, versus 2.0–2.4k characters for the complete analysis output in these examples. Uncached fixture runs on the tested Mac took 24–63 seconds. These are synthetic examples and character proxies, not a measured saving on a production Codex batch. Native installed-device validation, hosted migration, live backfill and deployment were not performed.

Model POST requests share a POSIX inference lock at `~/.local/share/codematica/inference.lock` with the knowledge service. The stdlib Python helper releases the lock on completion, failure, or parent exit; readiness probes do not wait for inference. Set `CODEMATICA_INFERENCE_LOCK` to an absolute path only when both services use the same override. Models still start only through the manual lifecycle command.
