# Exercises

This folder contains manually authored practice prompts for Codematica learning paths.

- Author exercises as `.json` files under concept folders.
- Supported `type` values are `flashcard`, `cloze`, `questionnaire`, `writing`, and `guided-lab`.
- Flashcards require `prompt`, `answer`, and `explanation`.
- Cloze prompts require `prompt`, `template`, `acceptedAnswers`, and `explanation`.
- A cloze `template` must contain exactly one `{{blank}}` token.
- Questionnaires require `questions[]` with unique question IDs.
- Questionnaire question `kind` values are `choice`, `cloze`, `ordering`, and `matching`.
- Choice questions require exactly one correct option, ordering questions require a `correctOrder` containing every item ID exactly once, and matching questions require unique pair IDs. Japanese prompts and labels may be a single visible glyph; the schema validates non-empty Unicode text.
- Writing exercises require `characterSlugs`, `modes`, `prompt`, and `explanation`; referenced character slugs must exist in `content/languages/`.
- Guided labs require a briefing, objectives, prediction commitment, ordered steps, evidence checklist, reflection prompts, extension challenge, and estimated time. Persist only coarse completion evidence, never raw reflection text.
- Questionnaire questions may declare stable `skillIds`; checkpoint completion calculates overall and per-skill scores without persisting individual answers.
- Source-linked exercises declare `sourceRefs` from `content/sources/`; the primary source remains authoritative.
- `documentSlug` must reference an existing Markdown document.
- Non-executable coding challenges currently belong inside Markdown lessons as challenge sections with starter code and acceptance checks. Do not model executable challenges in exercise JSON until a future code editor feature adds that schema.
- Database SQL query practice is future work. Until a dedicated SQL editor feature defines demo data, validation, and allowed SQL behavior, database path practice should use the existing questionnaire model.
- Advanced Next.js 16 practice should stay hard-only (`senior` or `principal`) and test production judgment about rendering, caching, invalidation, migration, and boundary failures instead of basic API recall.
- BFS/DFS questionnaires should test traversal invariants, visited timing, complexity, recursion risk, hidden graph modeling, and algorithm selection instead of code punctuation.
- Mermaid authoring questionnaires are choice-only, require exactly one correct option, and must explain why every distractor is incorrect instead of only restating the right answer.

Exercise generation, executable code validation, executable SQL validation, AI feedback, persisted questionnaire answers/scores, and generic adaptive review queues are future work. Coarse started/completed progress already uses the shared optional progress layer. Japanese has a separate deterministic skill-review contract that stores only its narrow mastery snapshot, never individual exercise answers. Run `npm run content:check` before committing exercise changes.

Passive scroll-only flashcards are authored separately in `content/flashcard-feeds/`; do not model them as interactive `type: "flashcard"` exercises.
