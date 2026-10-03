# Web notebook persistence

`storage.ts` implements the shared notebook storage interface with IndexedDB, owner-scoped definitions/snapshots and bounded optional API progress sync. Vectors and pressure remain local. Failed writes retain the active session and expose Retry. Do not replace missing/corrupt saved pages silently.

See `docs/features/japanese-writing-notebooks.md`; run the storage Vitest tests and Japanese Playwright notebook regression after persistence changes.
