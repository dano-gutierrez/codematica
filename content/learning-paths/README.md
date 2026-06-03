# Learning Paths

This folder contains curated role and skill paths for Codematica.

- Author one path per `.json` file.
- Use `kind: "role"` for career-oriented paths and `kind: "skill"` for topic-oriented paths.
- Keep `units[].nodes[]` ordered. Nodes can reference published documents, external diagrams, exercises, or existing interview questions.
- Use `kind: "interview"` with slugs shaped as `company/question`; these route to `/interviews/company/question?path=<pathSlug>` when opened from a path.
- Language-refresh paths should pair searchable Markdown docs with practice nodes that reinforce the same concept.
- Language-refresh paths may end with a focused interview-practice unit when existing interview questions naturally exercise the language concepts.
- Path-scoped passive flashcard feeds live in `content/flashcard-feeds/` and should not be added to ordered `units[].nodes[]`.
- All referenced slugs must exist before running `npm run content:index`.
- Paths are open in the current milestone. Do not add lock, payment, or completion fields until the feature contract changes.

Run `npm run content:check` before committing path changes.
