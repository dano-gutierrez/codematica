# Primary Sources

Store canonical metadata for external primary sources cited by authored content here.

- Use stable lowercase IDs and authoritative URLs.
- Record provider, attribution, `lastVerifiedAt`, and upstream version/commit/maturity when available.
- Add license metadata only when verified; a public URL does not grant redistribution rights.
- Knowledge frontmatter, exercises, and source-backed paths reference catalog IDs through `sourceRefs`.
- `kind: "source"` path nodes open a published local companion when one exists; otherwise they open the catalog URL.
- Source-linked companions must teach and summarize without copying large portions of upstream work.
- Refresh the verification date only after checking the URL, version, maturity, attribution, and scope.

Run `npm run content:check` after any source change. Never hand-edit the generated content index.

- `rtk-query.json` anchors the RTK curriculum to official docs and pinned releases/source files. Reverify the npm version, release notes, and both case-study/current source paths when refreshing the dated baseline.
- `product-engineering-interview.json` contains only general MDN, Google Cloud, Google SRE, and OpenTelemetry references for the company-neutral interview pack. Keep employer identities and identifying URLs out of source metadata. Change verification dates only after checking the actual technical sources.

Interview questions can declare `sourceRefs`, validated at build time and required when a source-required path references the interview. Keep private brief provenance anonymous; cite public technical documentation for the authored explanations.

`react-async-state.json` records React's state-snapshot, update-queue, setter, and effect-cleanup references for the supplementary delayed-callback lesson and checkpoint. Code examples are original and tested from their canonical Markdown fences.

`neural-computation-practice.json` records the author-maintained Understanding Deep Learning notebooks at a verified commit and official PyTorch autograd documentation. These are references for an original gradient-check companion, not copied book chapters or notebook implementations.

`system-design-decision-practice.json` anchors capacity and API-boundary exercises to Google SRE, PostgreSQL, MDN, WHATWG Fetch and OWASP primary material. Example workloads are original assumptions, not provider measurements.

`agent-handoff-practice.json` links two official Anthropic experiments and the author-maintained WalkingLabs course at a pinned commit. The course repository/README were checked; its projects and product breakdowns were not independently executed or validated. Do not turn reported quality differences with different budgets into controlled performance claims.

`durable-retry-and-reservations.json` links HTTP retry semantics, a provider-specific idempotency contract, Python/SQLite transaction control and PostgreSQL 17 locking/selection documentation. The labs use fictional credits and disposable inventory; no external payment or production measurement is implied.

The same catalog includes PostgreSQL 17 ranges, `btree_gist`, partial exclusion and finite-date references for the room-date extension. Preserve lifecycle and checkout-exclusive boundaries; an overlap constraint does not implement authentication, expiry scheduling or payment compensation.

`production-case-readings.json` attributes the Discord 2023 and Shopify 2026 engineering reports. They extend existing cache and reservation lessons with original review prompts; reported production outcomes are not local benchmarks or guarantees for another database engine.

`routing-and-delivery-boundaries.json` anchors routing and durable-effect review to NGINX directives, Kafka 4.1 design and Redis Pub/Sub/XACK/XAUTOCLAIM contracts. Preserve version/edition limits and distinguish readable crash traces from real proxy or broker experiments.

`advanced-agent-research.json` records the official Stanford CS329A Autumn 2025 syllabus as an optional external reading in the existing AI path. Preserve the course edition and public-reading scope. Enrollment, audits, certification, API credits and independently completed projects are not included; no redistribution license is inferred.

`source-audit-readings.json` pins an author-maintained architecture review command and an ML case-study discovery index. Upstream commands were read, not installed or executed. The index is not primary evidence for its linked technical claims; inspect the original author before using a case. Only the review-command repository has a verified MIT license.

`client-compatibility.json` links Duolingo's server-driven UI report and Google AIP-180. The former's outcomes remain author-reported; no redistribution license is inferred. AIP-180 identifies CC BY 4.0 for text and Apache 2.0 for its code samples. The selection fixture is original; neither source certifies the toy or actual platform compatibility.
