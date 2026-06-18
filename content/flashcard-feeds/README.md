# Passive Flashcard Feeds

This folder contains path-scoped passive flashcard feeds for short review sessions.

- Author one feed per `.json` file.
- A feed must reference an existing `pathSlug` and renders at `/paths/[pathSlug]/flashcards`.
- Supported card `type` values are `concept`, `practical`, `snippet`, and `interview`.
- Each card needs a unique `id`, `title`, `prompt`, `explanation`, `difficulty`, and `tags`.
- `sourceDocSlug` is optional, but if present it must reference an existing Markdown document.
- `code` is optional and should be a short snippet that fits on mobile.
- Database feeds should balance conceptual index/search vocabulary, practical query review, small SQL or schema snippets, and interview prompts.
- Passive feeds do not store progress, score, read state, mastery, streaks, or completion.

Passive flashcards are separate from interactive `type: "flashcard"` exercises in `content/exercises/`. Run `npm run content:check` before committing feed changes.
