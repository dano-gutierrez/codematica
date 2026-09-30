# Local Supabase Validation

Migrations remain optional infrastructure for the app runtime. Database tests use only a disposable local Supabase stack and never a hosted project or production data.

```bash
supabase start
supabase db reset --local
npm run test:db
supabase stop --no-backup
```

`config.toml` defines the local project. Transactional pgTAP files in `tests/` verify clean schema replay, indexes/constraints, RLS and per-user isolation, preservation triggers, and published search behavior. Protected content is considered hidden when the authenticated role is denied table access or when default-deny RLS returns no rows; the test covers both Supabase image behaviors. Migration, trigger, RPC, or policy changes must update these tests.

See `docs/features/automated-testing-and-release-regression.md` for CI and release gates.

## LinkedIn editorial storage

Migrations `202609290001`, `202609290002` and `202609300001` add private admin membership, immutable revisions, durable leased jobs, exact approval and Buffer reconciliation. Client table writes are revoked; admin reads use RLS and mutations use guarded RPCs. Worker operations are service-role only. `linkedin*.test.sql` covers RLS, stale revisions, uncertain publishing, bounded retry, cancellation races and insert-only restore. After a clean local reset, `npm run test:linkedin:local` also verifies the real CLI/Auth/REST lifecycle without Buffer requests. Never run reset against the hosted collection. See `docs/runbooks/linkedin-editorial.md`.

Manual-create storage uses atomic admin-only `linkedin_create`, explicit origin and a required analysis/adoption gate. UTF-16 checks apply to new revisions; historical rows remain immutable. Old backups default missing origin to material.
