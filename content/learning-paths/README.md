# Learning Paths

This folder contains curated role and skill paths for Codematica.

- Author one path per `.json` file.
- Use `kind: "role"` for career-oriented paths and `kind: "skill"` for topic-oriented paths.
- Keep `units[].nodes[]` ordered. Nodes can reference published documents, external diagrams, or exercises.
- Language-refresh paths should pair searchable Markdown docs with practice nodes that reinforce the same concept.
- AI engineering paths should pair source-anchored Markdown lessons with diagrams, questionnaires, and passive flashcard feeds. Coding challenge sections may appear inside Markdown as non-executable prompts until a future executable challenge contract exists.
- Database index paths should pair source-anchored Markdown lessons with questionnaires and passive flashcard feeds. SQL query editor practice is future work and should not be modeled as executable path nodes yet.
- Front-End Development paths should pair official-source-anchored framework lessons with hard questionnaires and passive one-minute brief feeds when the path is intended for vertical scroll review.
- Algorithm paths should pair explanatory Markdown with readable language examples, selection-focused questionnaires, passive review, and relevant guided interview prompts. The BFS/DFS path uses this contract for graph traversal.
- Diagram-authoring paths should pair rendered source examples with diagram-selection guidance, choice-only knowledge checks, and passive review; the Mermaid path uses the deployed renderer for browser validation.
- The Advanced Next.js 16 path is hard-only and targets experienced App Router engineers; keep factual claims aligned with official Next.js docs, official release notes, and npm registry version metadata.
- Human-language paths should pair Markdown lessons with language catalogs and `writing` exercise nodes so web and Expo routes share the same study sequence.
- Schema-v8 path nodes may declare `proficiencyLevel`, `skillIds`, and `required`. Progression-enabled language paths may also define stable skill IDs, friendly stages, official proficiency levels, Can-do statements, required nodes, a questionnaire checkpoint, thresholds, and estimated time.
- Path-scoped passive flashcard feeds live in `content/flashcard-feeds/` and should not be added to ordered `units[].nodes[]`.
- Beginner language paths should introduce one script at a time, keep recognition checks near each row group, and link their reference guides and passive review feed outside the ordered node sequence so learners can open them at any time.
- All referenced slugs must exist before running `npm run content:index`.
- Paths are open in the current milestone. `required` identifies milestone calculations; it never locks a node. Do not add lock or payment fields until the feature contract changes.

Run `npm run content:check` before committing path changes.
