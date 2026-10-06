# Codematica preparation workflow

Read `docs/features/interview-preparation.md` and `docs/runbooks/interview-preparation.md` in the repository. `packages/core/src/interview-preparation.ts` is the payload contract; do not duplicate its schema here.

The local CLI is `npm run interview:prep -- <command>`. Credentials come from local `.env`; never print or export them.

1. `context OPPORTUNITY_ID [PRIVATE_FILE]` captures the current opportunity, resume/experience profile and prior brief.
2. Produce draft and edited JSON packages following `briefSchema`. Populate every section, citation and verified date. Initial knowledge status is `pending`, with honest coverage warnings. The finalizer adds the editing receipt.
3. Read and apply technical-edit to the entire draft. Compare every section against its source.
4. `finalize DRAFT EDITED OUTPUT --compared` verifies metadata/protected literals and records skill and prose hashes. `validate OUTPUT` checks the complete package.
5. `import OUTPUT [REQUEST_KEY]` appends an immutable private revision. A default content-derived key makes uncertain retries safe.
6. Optional: `assess OUTPUT [REQUEST_UUID]`, then run the existing local knowledge worker and inspect the report in Admin → Knowledge. Accept only after reviewing the report; acceptance is an explicit human decision. Add the accepted job ID and its saved `knowledge_jobs.snapshot_id` (the active graph ID, not the report’s source catalog ID) and `reviewed` status to a new package, then repeat the editing/finalization pass and import. Do not alter prose after assessment without reevaluating it.
7. `export OPPORTUNITY_OR_REVISION [FILE]` writes Markdown from the selected saved revision. `backup [FILE]` preserves the current opportunities, all profile revisions and immutable briefs with their original opportunity context; copy backups to a user-controlled durable location.

`npm run knowledge:export:private` catalogs private LinkedIn and interview artifacts alongside authored knowledge. Synchronization and local evaluation use the existing knowledge runbook. Do not activate snapshots during someone else's running assessment batch.

A brief is prepared only when the current saved knowledge assessment is accepted. Changes to opportunity/profile versions or the graph snapshot mark it as needing refresh. No content is automatically published.
