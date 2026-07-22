# Passive Flashcard Feeds

This folder contains path-scoped passive flashcard feeds for short review sessions.

- Author one feed per `.json` file.
- A feed must reference an existing `pathSlug` and renders at `/paths/[pathSlug]/flashcards`.
- Supported card `type` values are `concept`, `practical`, `snippet`, and `interview`.
- Each card needs a unique `id`, `title`, `prompt`, `explanation`, `difficulty`, and `tags`.
- `sourceDocSlug` is optional, but if present it must reference an existing Markdown document.
- `code` is optional and should be a short snippet that fits on mobile.
- AI engineering feeds should balance conceptual vocabulary, practical production review, small code snippets, and interview prompts across beginner through senior/principal material.
- Database feeds should balance conceptual index/search vocabulary, practical query review, small SQL or schema snippets, and interview prompts.
- Advanced Next.js 16 feeds are one-minute vertical briefs and should stay hard-only, concise enough for one mobile viewport, and balanced across concept, practical, snippet, and interview cards.
- Algorithm feeds should mix core invariants, implementation pitfalls, compact Python/TypeScript snippets, and interview-recognition prompts; the BFS/DFS feed follows this balance.
- New learning paths that intend to replace passive social scrolling with meaningful review should include a path-scoped passive feed unless the owning feature doc explicitly says otherwise.
- Passive feeds do not store progress, score, read state, mastery, streaks, or completion.

Passive flashcards are separate from interactive `type: "flashcard"` exercises in `content/exercises/`. Run `npm run content:check` before committing feed changes.
