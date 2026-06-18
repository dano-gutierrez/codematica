# Learning Paths

This folder contains curated role and skill paths for Codematica.

- Author one path per `.json` file.
- Use `kind: "role"` for career-oriented paths and `kind: "skill"` for topic-oriented paths.
- Keep `units[].nodes[]` ordered. Nodes can reference published documents, external diagrams, or exercises.
- Language-refresh paths should pair searchable Markdown docs with practice nodes that reinforce the same concept.
- Database index paths should pair source-anchored Markdown lessons with questionnaires and passive flashcard feeds. SQL query editor practice is future work and should not be modeled as executable path nodes yet.
- Path-scoped passive flashcard feeds live in `content/flashcard-feeds/` and should not be added to ordered `units[].nodes[]`.
- All referenced slugs must exist before running `npm run content:index`.
- Paths are open in the current milestone. Do not add lock, payment, or completion fields until the feature contract changes.

Run `npm run content:check` before committing path changes.
