# Canonical content checks

`npm run content:index` builds the shared index from validated canonical files; `npm run content:check` checks freshness. Keep generated files in the same change as their authored sources.

`npm run test:interview:python` runs the legacy interview checks and `verify-durable-labs.py`. The latter extracts one Python fence from each allowlisted original lesson: neural gradients, durable retry receipts, evidence-bound handoffs and routing decisions. Each runs in a temporary directory under isolated Python, an empty environment, a 15-second timeout and resource-warning/exit/stderr checks. It never starts a proxy, broker, model or external payment. Use Python 3.13 as configured in CI; passing these fixtures does not validate upstream courses or production throughput.

When changing a lab, run the exact canonical fence and challenge its asserted boundaries with targeted mutations. Keep source metadata, owning feature documentation and generated route/quiz tests current. Browser execution of these fences is not supported.
