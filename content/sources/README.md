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

`event-log-interview.json` records official JavaScript execution, Python bisect/locking and Kafka consumer-offset references for the original partitioned-log exercise. These references support concepts; they do not establish that the simulation is a production broker.

`neural-computation-practice.json` records the author-maintained Understanding Deep Learning notebooks at a verified commit and official PyTorch autograd documentation. These are references for an original gradient-check companion, not copied book chapters or notebook implementations.

`system-design-decision-practice.json` anchors capacity and API-boundary exercises to Google SRE, PostgreSQL, MDN, WHATWG Fetch and OWASP primary material. Example workloads are original assumptions, not provider measurements.

`agent-handoff-practice.json` links two official Anthropic experiments and the author-maintained WalkingLabs course at a pinned commit. The course repository/README were checked; its projects and product breakdowns were not independently executed or validated. Do not turn reported quality differences with different budgets into controlled performance claims.

`durable-retry-and-reservations.json` links HTTP retry semantics, a provider-specific idempotency contract, Python/SQLite transaction control and PostgreSQL 17 locking/selection documentation. The labs use fictional credits and disposable inventory; no external payment or production measurement is implied.

The same catalog includes PostgreSQL 17 ranges, `btree_gist`, partial exclusion and finite-date references for the room-date extension. Preserve lifecycle and checkout-exclusive boundaries; an overlap constraint does not implement authentication, expiry scheduling or payment compensation.

`production-case-readings.json` attributes the Discord 2023 and Shopify 2026 engineering reports. They extend existing cache and reservation lessons with original review prompts; reported production outcomes are not local benchmarks or guarantees for another database engine.

`routing-and-delivery-boundaries.json` anchors routing and durable-effect review to NGINX directives, Kafka 4.1 design and Redis Pub/Sub/XACK/XAUTOCLAIM contracts. Preserve version/edition limits and distinguish readable crash traces from real proxy or broker experiments.

`advanced-agent-research.json` records the official Stanford CS329A Autumn 2025 syllabus as an optional external reading in the existing AI path. Preserve the course edition and public-reading scope. Enrollment, audits, certification, API credits and independently completed projects are not included; no redistribution license is inferred.

`source-audit-readings.json` pins an author-maintained architecture review command and an ML case-study discovery index. Upstream commands were read, not installed or executed. The index is not primary evidence for its linked technical claims; inspect the original author before using a case. Only the review-command repository has a verified MIT license.

`client-compatibility.json` links Duolingo's server-driven UI report, RFC 9110 preconditions and Google AIP-180/160/158/157; the lesson also reuses RFC 6585 from the traffic catalog. Duolingo's outcomes remain author-reported; no redistribution license is inferred for it or the RFC. Google pages identify CC BY 4.0 for text and Apache 2.0 for samples. The selector and work-order review cases are original. Preserve strong comparison and the already-applied exception, page-size versus query continuity, empty nonterminal pages, token authorization boundaries and view defaults. No source certifies server atomicity, query performance or actual platform compatibility.

`traffic-and-webhook-contracts.json` records Redis algorithm guidance, RFC 6585, Stripe delivery/signature contracts and Python 3.13 HMAC documentation. No provider/tutorial code is copied or executed. Stripe recommends its official SDK; the custom lesson envelope is deliberately distinct. Only the Python documentation license is recorded; no license or performance claim is inferred for other readings.

`structural-navigation.json` pins the TSIndex README/project dual license and codebase-memory-mcp v0.11.0 commit/MIT license. The handoff lesson's original retrieval review distinguishes unreadiness, partial source, scoped zero results, continuation and failed staged indexing. TSIndex includes an MCP write tool; source reading does not authorize installation or writes. Reported/heuristic savings remain unverified locally.

`distributed-reading-reviews.json` links author-hosted Dynamo (SOSP 2007), Raft (May 20, 2014 extended version) and The Tail at Scale (February 2013) papers. Only selected versioning, commitment, retry/read and fan-out/hedging passages were verified. Cases and checkpoint are original; paper figures/code/tables are not copied. Public access does not establish a redistribution license. Preserve the historical Dynamo versus current DynamoDB distinction and reported versus measured outcomes.

`token-revocation.json` pins OWASP JWT/REST guidance and its CC-BY-SA-4.0 project license at the inspected commit, plus selected RFC 7009 (August 2013) and RFC 9700 (January 2025) passages. The API lesson adds original status-propagation review cases; no upstream code, token parser or live authorization server is executed. Preserve identifier scope, access/refresh policy and consumer freshness; no RFC redistribution license is inferred.

`video-delivery.json` identifies selected RFC 8216, the fixed 2017 EME Recommendation, Android MediaDrm/secure-window documentation and a dated Netflix browser table. The authored exercise separates payload deadlines, capture/decoder/output observations and accepted playback revisions. No upstream player/DRM code or protected media is copied; conditional support and unmeasured device behavior remain explicit.

`backend-concurrency-patterns.json` links selected Python 3.13 condition/permit/build guidance, Java SE 17 JVM states and ordering/atomicity passages, Fowler’s polymorphism catalog entry and Microsoft’s DI lifetime guidance. Original paper traces and substitution/unit/wrapper cases copy no upstream code. Keep selected editions, construction-versus-instance safety and unexecuted runtime scope explicit.

`keypad-dictionary-search.json` links selected Python 3.13 mutable sequence/mapping semantics and finite Cartesian product fixtures. The bounded trie and independent scan are original code, with no copied upstream example or inferred redistribution license. The source semantics do not prove algorithm performance or arbitrary-input correctness.

`programming-contract-review.json` records selected MDN, Node, tus, OpenDSA and author-hosted Oxford references. Original fixtures copy no upstream implementation or attachment. Preserve the dated documentation editions, strict duplicate policy versus OpenDSA's example, and reported visualizer features versus unmeasured dialect/runtime behavior. No redistribution license is inferred.

`systems-boundary-review.json` records twenty-six selected RFC, author, vendor and university references. Kafka4.1/PostgreSQL17/OSTEP1.10 are pinned reading editions; MongoDB9.0 guidance is dated. Chrome's server-push notice has an explicit prose license; no license is inferred for other sources. Original fictional traces copy no upstream examples or private post attachments, and author-reported VPN behavior is not an independent audit or benchmark.

`selected-evidence-review.json` records27 selected primary references, pinned OpenJev/Unity commits and dated Java23/Blender5.2/OIDC/RFC9700/vendor scope. DDD and Blender prose licenses come from inspected statements; code and weight terms remain separate. No saved-post body, course attachment or upstream implementation is copied.

`frontend-system-design-interviews.json` links six first-person candidate accounts. These are primary evidence of the authors’ reports, not official company questions or authoritative technical solutions. Preserve author attribution, known publication/interview dates, the source-check date, and unverified details; public access does not establish redistribution rights. Rehearsal prompts are paraphrased and additions labeled.

`frontend-system-design-guide.json` records twelve primary technical references from React, TanStack, MDN, web.dev, W3C, and OWASP. The guide reuses the existing MDN AbortController/WebSocket records, for fourteen references total. Keep these technical sources separate from candidate interview accounts.

`forward-deployed-engineer.json` records eleven inspected employer, technical and customer-story references. Roles are dated examples; Morgan Stanley, Intercom and Airbus/easyJet outcomes remain vendor-reported. Keep adoption separate from accuracy, maxima separate from averages, and historical plans separate from observed results. No redistribution license is inferred.
