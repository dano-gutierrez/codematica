# Content and local search tooling

Markdown and structured catalogs in `content/` are canonical. These build-only scripts validate or export them; generated files are never authoring surfaces.

- `npm run content:index`: validate content and rebuild the shared index.
- `npm run content:check`: verify the committed index against canonical inputs.
- `npm run content:audio`: export approved local Japanese audio registries.
- `npm run search:runtime`: bundle the shared discovery/library matchers for native local execution.
- `npm run search:check`: verify that the native search bundle is reproducible and current.

`build-search-runtime.mjs` uses the existing build-time esbuild dependency and includes Fuse's license. Its allowlisted dependency graph contains only the entry, pure core search modules and the directly declared Fuse dependency. It writes `apps/mobile/src/generated/search-worker.ts`; it does not embed the content index, credentials or an SDK. The native adapter supplies this fixed bundle to `packages/ui/src/LocalSearch.tsx`.

The local WebView receives prepared public search rows as JSON and returns request IDs and row positions. Canonical result metadata and destinations stay in the host. No network, worker service or remote database is required. Runtime changes require regenerating the bundle, running its VM integration tests, and installed Android/iOS checks; source-only tests do not establish WebView startup or performance.

See [home discovery](../../docs/features/home-discovery.md), [the knowledge browser](../../docs/features/markdown-knowledge-browser.md), and [the engineering overview](../../docs/engineering-overview.md).

CI checks the committed search runtime before `build` can regenerate it, so a stale native bundle cannot be silently repaired by the web build.
