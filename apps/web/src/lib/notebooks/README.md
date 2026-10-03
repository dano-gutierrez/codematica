# Web notebook persistence

`storage.ts` implements the shared notebook storage interface with IndexedDB, owner-scoped definitions/snapshots and bounded optional API progress sync. Vectors and pressure remain local. Failed writes retain the active session and expose Retry. Do not replace missing/corrupt saved pages silently.

See `docs/features/japanese-writing-notebooks.md`; run the storage Vitest tests and Japanese Playwright notebook regression after persistence changes.

The catalog's Show romaji preference uses `codematica:notebook-romaji:v1` in localStorage, defaulting to on. It is a device display setting, separate from account-scoped IndexedDB ink and completion. The shared hook preserves the current UI if preference storage fails and serializes rapid updates. `notebook-catalog.regression.spec.ts` checks hiding/restoring annotations, saved previews, reload and responsive layouts.
