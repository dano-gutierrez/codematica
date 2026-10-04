# Canonical content checks

`npm run content:index` builds the shared index from validated canonical files; `npm run content:check` checks freshness. Keep generated files in the same change as their authored sources.

`npm run test:interview:python` runs the legacy interview checks and `verify-durable-labs.py`. The latter extracts one Python fence from each allowlisted original lesson: neural gradients, durable retry receipts, evidence-bound handoffs, routing decisions, client compatibility, traffic-rate contracts, webhook authenticity and array-state invariants. Each runs in a temporary directory under isolated Python, an empty environment, a 15-second timeout and resource-warning/exit/stderr checks. It never starts a proxy, broker, renderer, model, real webhook receiver or external payment. Use Python 3.13 as configured in CI; passing these fixtures does not validate upstream courses, platform compatibility or production throughput.

When changing a lab, run the exact canonical fence and challenge its asserted boundaries with targeted mutations. Keep source metadata, owning feature documentation and generated route/quiz tests current. Browser execution of these fences is not supported.

`npm run test:reservation:sql` extracts the three room-date SQL fences from `fair-admission-and-reservations.md`. With Python 3 and local Docker running, first run `docker pull postgres@sha256:e38411452a464af89e5adadb8d223bf53b898d47d6ef918b2d58c08707350449`. The verifier requires a local Unix socket and the pinned image; it never connects to a configured application database. It creates a uniquely named container with no network, host ports or persistent mounts, waits for the final server after bootstrap, and removes it even on test failure. The internal trust authentication applies only to this disposable fixture.

Checks cover overlap, adjacent stays, separate rooms, invalid ranges/fields, guarded expiry, stale reactivation and two-session commit/rollback outcomes. Database CI and release regression run the same verifier. These tests do not execute payments, a booking API or timestamp/time-zone scheduling.
