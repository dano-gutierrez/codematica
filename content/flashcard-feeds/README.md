# Passive Flashcard Feeds

The Product Engineering Interview feed contains twelve review briefs linked to its JavaScript, durable generation, and mock interview lessons. These are original preparation cards, not reported company questions.

Author path-scoped passive flashcard feeds for short review sessions here.

- Author one feed per `.json` file.
- Each feed references an existing `pathSlug` and renders at `/paths/[pathSlug]/flashcards`.
- Supported card `type` values are `concept`, `practical`, `snippet`, and `interview`.
- Each card needs a unique `id`, `title`, `prompt`, `explanation`, `difficulty`, and `tags`.
- `sourceDocSlug` is optional, but if present it must reference an existing Markdown document.
- `code` is optional and should be a short snippet that fits on mobile.
- AI engineering feeds should balance conceptual vocabulary, practical production review, small code snippets, and interview prompts across beginner through senior/principal material.
- Database feeds should balance conceptual index/search vocabulary, practical query review, small SQL or schema snippets, and interview prompts.
- Advanced Next.js 16 feeds are one-minute vertical briefs and should stay hard-only, concise enough for one mobile viewport, and balanced across concept, practical, snippet, and interview cards.
- Algorithm feeds should mix core invariants, implementation pitfalls, compact Python/TypeScript snippets, and interview-recognition prompts; the BFS/DFS feed follows this balance.
- Diagram-authoring feeds should balance grammar recognition, selection rules, compact Mermaid snippets, debugging, compatibility, and readability review.
- Beginner alphabet feeds should mix row recall, confusing-shape comparisons, sound changes, and real-word decoding. They must work for learners who have not finished the ordered path.
- New paths intended to replace social scrolling with review should include a passive feed unless the owning feature doc explicitly says otherwise.
- Passive feeds save only the latest-card resume position through the optional progress layer. They store no answers, score, mastery, streaks, or raw interaction history.

Passive flashcards are separate from interactive `type: "flashcard"` exercises in `content/exercises/`. Run `npm run content:check` before committing feed changes.

- RTK Query interview briefs provide three concise concept/practical/interview cards per lesson, each linked to its source document; keep version claims aligned with that lesson.

Set `codeLanguage` for every authored snippet (for example `typescript`, `python`, or `sql`). `sourceDocSlug` links back to the canonical lesson and preserves the feed’s path context. Frontend Interview Practice supplies 42 cards covering seven briefs and their implementation recipes.

The database feed contains 48 cards, including eight connection-pooling cards (two of each type). Preserve the earlier 40 cards and source new pooling cards to `databases/postgres-connection-pooling`; numerical capacities remain illustrative.

`partitioned-event-log` supplies fourteen sourced lesson-review cards after its interview checkpoint. Each links to `system-design/partitioned-event-log`; the feed supports continued scrolling through the shared windowing component.
