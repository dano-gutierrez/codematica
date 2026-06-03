# Passive Flashcard Feeds

This folder contains path-scoped passive flashcard feeds for short review sessions.

- Author one feed per `.json` file.
- A feed must reference an existing `pathSlug` and renders at `/paths/[pathSlug]/flashcards`.
- Supported card `type` values are `concept`, `practical`, `snippet`, and `interview`.
- Each card needs a unique `id`, `title`, `prompt`, `explanation`, `difficulty`, and `tags`.
- `sourceDocSlug` is optional, but if present it must reference an existing Markdown document.
- `code` is optional and should be a short snippet that fits on mobile.
- Passive feeds do not store progress, score, read state, mastery, streaks, or completion.
- The Python language-refresh feed currently contains 480 senior cards balanced across the four card types.
- The Big O feed uses the same four card types with shorter foundation-to-practitioner cards tied to the Big O path.

Passive flashcards are separate from interactive `type: "flashcard"` exercises in `content/exercises/`. Run `npm run content:check` before committing feed changes.
