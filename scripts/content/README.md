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

`npm run test:interview:python` runs the legacy interview checks and `verify-durable-labs.py`. The latter extracts one Python fence from each allowlisted original lesson: neural gradients, durable retry receipts, evidence-bound handoffs, routing decisions, client compatibility, traffic-rate contracts, webhook authenticity, array-state invariants, progressive state/history and keypad dictionary search. Each runs in a temporary directory under isolated Python, an empty environment, a 15-second timeout and resource-warning/exit/stderr checks. It never starts a proxy, broker, renderer, model, real webhook receiver or external payment. Use Python 3.13 as configured in CI; passing these fixtures does not validate upstream courses, platform compatibility or production throughput.

When changing a lab, run the exact canonical fence and challenge its asserted boundaries with targeted mutations. Keep source metadata, owning feature documentation and generated route/quiz tests current. Browser execution of these fences is not supported.

`npm run test:reservation:sql` extracts the three room-date SQL fences from `fair-admission-and-reservations.md`. With Python 3 and local Docker running, first run `docker pull postgres@sha256:e38411452a464af89e5adadb8d223bf53b898d47d6ef918b2d58c08707350449`. The verifier requires a local Unix socket and the pinned image; it never connects to a configured application database. It creates a uniquely named container with no network, host ports or persistent mounts, waits for the final server after bootstrap, and removes it even on test failure. The internal trust authentication applies only to this disposable fixture.

Checks cover overlap, adjacent stays, separate rooms, invalid ranges/fields, guarded expiry, stale reactivation and two-session commit/rollback outcomes. Database CI and release regression run the same verifier. These tests do not execute payments, a booking API or timestamp/time-zone scheduling.

Programming Contract Review adds the bounded tree/cost fixture to `verify-durable-labs.py` and three fixed JavaScript fences to `verify-programming-labs.mjs`, also run by `npm run test:interview:python`. The Node verifier uses an empty child environment, temporary directory, five-second timeout and exact exit/stderr/output checks. It executes only authored allowlisted fences, never candidates or learner input. Use Node 22+ and Python 3.13; no browser, network, upload, timer or external visualizer is started.

Systems Boundary Review uses six source-required lessons, thirty scenario choices and six qualified skills. The canonical/parser audit preserves earlier decoded records; tests independently pin answer meanings and graph order. These are inert paper scenarios, with no new executable fence, SDK, network, broker, database or driver verifier.
