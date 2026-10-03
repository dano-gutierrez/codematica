# Local Supabase Validation

Migrations remain optional runtime infrastructure. Run database tests only on a disposable local Supabase stack, never a hosted project or production data.

```bash
supabase start
supabase db reset --local
npm run test:db
supabase stop --no-backup
```

`config.toml` defines the local project. Transactional pgTAP files in `tests/` verify clean schema replay, indexes/constraints, RLS and per-user isolation, preservation triggers, and published search behavior. The test accepts both Supabase image behaviors that hide protected content: denying the authenticated role table access or returning no rows through default-deny RLS. Migration, trigger, RPC, or policy changes must update these tests.

See `docs/features/automated-testing-and-release-regression.md` for CI and release gates.

## LinkedIn editorial storage

Migrations `202609290001`, `202609290002` and `202609300001` add private admin membership, immutable revisions, durable leased jobs, exact approval and Buffer reconciliation. Client table writes are revoked; admin reads use RLS and mutations use guarded RPCs. Worker operations are service-role only. `linkedin*.test.sql` covers RLS, stale revisions, uncertain publishing, bounded retry, cancellation races and insert-only restore. After a clean local reset, `npm run test:linkedin:local` also verifies the real CLI/Auth/REST lifecycle without Buffer requests. Never run reset against the hosted collection. See `docs/runbooks/linkedin-editorial.md`.

Manual-create storage uses atomic admin-only `linkedin_create`, explicit origin and a required analysis/adoption gate. UTF-16 checks apply to new revisions; historical rows remain immutable. Old backups default missing origin to material.

Japanese writing notebooks use 24 whole-prompt repetitions per sheet and support curated/custom text of 1–5 published characters. Ink stays on the device; coarse completion/unlocks optionally sync. See `docs/features/japanese-writing-notebooks.md` for the implementation, persistence and validation contract.

Migration `202610030001` adds opt-in local preparation reports, generic voice history, preparation/verification bindings, versioned overview/detail RPCs and v2 restore. It performs no inference or automatic backfill. `linkedin_enable_preparation` enrolls review drafts only after an operator backup and refuses running editorial jobs. The local integration command `npm run test:linkedin:preparation` follows the legacy smoke in CI.
