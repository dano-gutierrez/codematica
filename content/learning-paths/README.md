# Learning Paths

This folder contains curated role and skill paths for Codematica.

- Author one path per `.json` file.
- Use `kind: "role"` for career-oriented paths and `kind: "skill"` for topic-oriented paths.
- Keep `units[].nodes[]` ordered. Nodes can reference published documents, external diagrams, or exercises.
- All referenced slugs must exist before running `npm run content:index`.
- Paths are open in the current milestone. Do not add lock, payment, or completion fields until the feature contract changes.

Run `npm run content:check` before committing path changes.
