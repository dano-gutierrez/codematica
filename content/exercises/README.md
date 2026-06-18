# Exercises

This folder contains manually authored practice prompts for Codematica learning paths.

- Author exercises as `.json` files under concept folders.
- Supported `type` values are `flashcard`, `cloze`, and `questionnaire`.
- Flashcards require `prompt`, `answer`, and `explanation`.
- Cloze prompts require `prompt`, `template`, `acceptedAnswers`, and `explanation`.
- A cloze `template` must contain exactly one `{{blank}}` token.
- Questionnaires require `questions[]` with unique question IDs.
- Questionnaire question `kind` values are `choice`, `cloze`, `ordering`, and `matching`.
- Choice questions require exactly one correct option, ordering questions require a `correctOrder` containing every item ID exactly once, and matching questions require unique pair IDs.
- `documentSlug` must reference an existing Markdown document.
- Non-executable coding challenges currently belong inside Markdown lessons as challenge sections with starter code and acceptance checks. Do not model executable challenges in exercise JSON until a future code editor feature adds that schema.
- Database SQL query practice is future work. Until a dedicated SQL editor feature defines demo data, validation, and allowed SQL behavior, database path practice should use the existing questionnaire model.

Exercise generation, executable code validation, executable SQL validation, AI feedback, scoring, persisted progress, and review queues are future work. Run `npm run content:check` before committing exercise changes.

Passive scroll-only flashcards are authored separately in `content/flashcard-feeds/`; do not model them as interactive `type: "flashcard"` exercises.
