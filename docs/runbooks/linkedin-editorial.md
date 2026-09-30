# Operating the LinkedIn editorial queue

## Local setup and account access

Use Node 22 and `npm ci` in the repository. Root `.env` contains only locally managed `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for operator commands. Never print or copy the service key into an app. Configure public URL/publishable key in `apps/web/.env.local` and the corresponding EXPO_PUBLIC variables in `apps/mobile/.env.local` for client Auth/REST.

Confirm the owner's personal email. The owner must create and verify their app account through `/login`; existing Supabase dashboard credentials are a separate identity. Find that verified Auth user UUID using the Supabase dashboard, then run:

```sh
npm run linkedin -- bootstrap VERIFIED_AUTH_USER_UUID
```

This grants database-backed admin membership. Sign in again or focus the app to refresh navigation. Open `/admin/linkedin` on web or More → LinkedIn posts on native. Never bootstrap an arbitrary or unverified account. The worker cannot perform this setup.

## Review and daily scheduling

1. Select an existing draft, or use Create → title/topic/post text → Add for analysis. Manual drafts automatically queue a refinement and require Use revision before approval. Select text for Unicode bold/italic or bullets; Plain text removes supported styling. Editing analyzed manual text requires another Refine. Review the draft, edit if needed, then Save revision.
2. Refine queues analysis with `prompts/linkedin/refine.md`. Ask Codex to process the queue; the manual worker records a proposal. Use revision adopts it without approving it.
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
