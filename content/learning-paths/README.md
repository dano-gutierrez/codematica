# Learning Paths

Author curated role and skill paths here.

- Author one path per `.json` file.
- Use `kind: "role"` for career-oriented paths and `kind: "skill"` for topic-oriented paths.
- Keep `units[].nodes[]` ordered. Nodes can reference published documents, external diagrams, exercises, or primary-source nodes.
- Language-refresh paths should pair searchable Markdown docs with practice nodes that reinforce the same concept.
- AI engineering paths should pair source-anchored Markdown lessons with diagrams, questionnaires, and passive flashcard feeds. Coding challenge sections may appear inside Markdown as non-executable prompts until a future executable challenge contract exists.
- Database index paths should pair source-anchored Markdown lessons with questionnaires and passive flashcard feeds. SQL editor practice is future work; do not add executable SQL path nodes yet.
- Front-End Development paths should pair framework lessons grounded in official sources with hard questionnaires. Add passive one-minute brief feeds for paths intended for vertical scroll review.
- Algorithm paths should pair explanatory Markdown with readable language examples, selection-focused questionnaires, passive review, and relevant guided interview prompts. The BFS/DFS path uses this contract for graph traversal.
- Diagram-authoring paths should pair rendered source examples with diagram-selection guidance, choice-only knowledge checks, and passive review; the Mermaid path uses the deployed renderer for browser validation.
- The Advanced Next.js 16 path is hard-only and targets experienced App Router engineers; keep factual claims aligned with official Next.js docs, official release notes, and npm registry version metadata.
- Human-language paths should pair Markdown lessons with language catalogs and `writing` exercise nodes so web and Expo routes share the same study sequence.
- Schema-v10 path nodes may declare `proficiencyLevel`, `skillIds`, and `required`. `kind: "source"` nodes also declare a catalog `sourceRef`, learning `activity`, stable companion slug, and `companionKind`. Questionnaire nodes may now include Japanese IME-backed open answers and approval-gated listening choices.
- Progression-enabled paths use the shared generic career/language model: stable skills/categories, stage level/status, outcomes linked by `skillId`, required nodes, optional planned checkpoints, and required published checkpoints/thresholds.
- Paths with `sourcePolicy: "required"` must declare path-level primary sources and source every internal document/exercise node. Published stages may use source nodes only when a published local companion exists; planned stages may link directly upstream.
- Path-scoped passive flashcard feeds live in `content/flashcard-feeds/` and should not be added to ordered `units[].nodes[]`.
- Beginner language paths should introduce one script at a time and place recognition checks near each row group. Link reference guides and passive review outside the ordered nodes so learners can open them at any time.
- All referenced slugs must exist before running `npm run content:index`.
- Paths are open in the current milestone. `required` identifies milestone calculations; it never locks a node. Do not add lock or payment fields until the feature contract changes.

Run `npm run content:check` before committing path changes.

- The RTK Query Interview Preparation path pairs seven sourced lessons with scenario checkpoints and passive briefs. Keep modern 2.12.0 behavior separate from the PR-inspired 2.2.8 persistence case.
- `product-engineering-interview.json` pairs a company-neutral research guide with original JavaScript/architecture lessons, eighteen checkpoint questions, and a 75-minute guided mock. Use neutral slugs and general technical references; distinguish rehearsal assumptions from real interview evidence.

Interview nodes use `{ "kind": "interview", "slug": "collection/question" }` and require a published target. Source-required paths also require primary references on that question. Opt into `{ "completionDestination": "flashcard-feed" }` to send the final node to the path’s published feed. Other path endings are unchanged.

The `database-indexes-and-search` skill path ends with Connection Pooling And Resilience: a sourced Markdown lesson, three Mermaid diagrams, a 12-question checkpoint, and eight appended review cards. Keep the existing path slug and earlier node order stable; label reported incident context and illustrative capacity assumptions explicitly.

The ML Systems path’s existing Neural Computation source node now opens a published original companion. A questionnaire follows it in Volume I Build. Keep the Framework Builder stage planned until the remaining framework, architecture and training requirements have local companions and a complete checkpoint.

System Design Fundamentals appends Capacity Decisions and API Security Boundaries after its existing cache unit. Keep the authored worksheet assumptions explicit and distinguish browser response sharing, CSRF and object authorization in the lessons and checkpoints.

Backend Engineer Readiness reuses the existing durable-generation architecture lesson with an optional original SQLite retry lab and a separate checkpoint. Its Reservation Boundaries unit is shared with System Design Fundamentals. Keep ordered membership explicit and the original Product Engineering path’s 18-question sequence unchanged.

The AI Engineering path adds Evidence-First Handoffs between Agents And Operations and Risk And Governance. The original Python resume lab and four-question checkpoint distinguish input identity, model execution, verification and approval. External course projects remain optional references, not completed or independently validated activities.

The existing cache and reservation lessons link attributed Discord/Shopify production cases. Their original review prompts distinguish shared in-flight reads from cached results and bounded reservation rows from authoritative stock. Keep engine-specific behavior and reported outcomes separate from local lab measurements.

System Design inserts Routing Decisions between Capacity Decisions and API Security Boundaries. Its original static Python selection lab and four-question checkpoint test signal limits, eligibility and affinity; they do not execute a proxy. Kafka/Redis delivery review extends the existing durable architecture lesson rather than duplicating it.
