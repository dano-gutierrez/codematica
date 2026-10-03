# LinkedIn operator CLI

Run `npm run linkedin -- COMMAND` from the repository with a full local developer install and root `.env`. Secrets stay in the CLI; none are imported into client bundles. `worker.ts` contains unit-tested validation; `cli.ts` coordinates service-only RPCs and private file envelopes. `smoke-local.ts` runs the real CLI against a disposable local Supabase stack and refuses a remote URL.

Use `npm run test:linkedin:local` after clean local migration replay. The smoke uses synthetic publication IDs and never contacts Buffer. Private seed/results/exports live under ignored `.local/linkedin/`. Operations and exact command examples are in `docs/runbooks/linkedin-editorial.md`; the manual operating contract is `prompts/linkedin/worker.md`.

The local smoke also creates a manual post through the authenticated RPC, verifies idempotent retry and the analysis gate, then runs the CLI refinement/adoption/approval cycle. Publishing remains paused and no Buffer request is made.

`preparation.ts` implements bounded editing, integrity checks and duplicate/related routing; `local-models.ts` accepts only loopback endpoints and maintains private input-addressed caches. `models.py` manually configures/starts/stops the pinned Python servers; it has no Supabase access. `evaluate-local.ts` uses synthetic text against real models, while `smoke-preparation.ts` exercises ready/held/override/verification with fake loopback models against disposable Supabase. Run `npm run test:linkedin:preparation` after the legacy local smoke. Use `SUPABASE_WORKDIR` to target a separate local stack; tests never load `.env`. Core model modules are covered by Vitest; CLI orchestration is covered by subprocess integration.

`npm run typecheck:linkedin` checks the CLI, inference adapters and their fixtures; it is included in the root typecheck gate. Python lifecycle safety checks use `python3 -m unittest discover -s scripts/linkedin -p test_models.py`.
