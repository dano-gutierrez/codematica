# Knowledge catalog and operator commands

`export.ts` builds the validated curriculum catalog; `cli.ts export-with-posts` adds authorized private current/published post revisions. `worker.ts` synchronizes graph projections and processes leased evaluations from Supabase. `review.ts` validates accepted curriculum links; `apply.ts` serializes sidecar writes and rechecks each reviewed job against live sources. `private-posts.ts` rejects missing or foreign revisions instead of omitting coverage. `smoke-editorial.ts` checks the joined local-model/editorial flow against an empty disposable Supabase stack and pauses for actual agent verification before inert scheduling.

See [the feature contract](../../docs/features/knowledge-evaluator.md) and [operating instructions](../../docs/runbooks/knowledge-evaluator.md). Keep server credentials and all exported post text in private `.local/` files. No script automatically publishes or queues a Codex session.

`export-with-private` reads admin interview snapshots and catalogs saved brief revisions with private visibility. Resume/profile source text stays excluded. Interview references require current curriculum hashes and literal passages. Run after applying the interview migration; earlier databases cannot supply this collection.
