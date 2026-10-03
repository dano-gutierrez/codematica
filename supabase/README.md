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

## Restore the Signal

`202609290001_create_game_progress.sql` adds separate game awards, successful activity dates, preferences, owner RLS, and transactional union-merge RPCs. No submitted answer or attempt history is stored. `tests/database/game.test.sql` verifies idempotency, ordering, cosmetics, malformed data, expected account identity, and RLS. Replay migrations only in an isolated disposable local database for verification.
