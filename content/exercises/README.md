# Exercises

This folder contains manually authored practice prompts for Codematica learning paths.

- Author exercises as `.json` files under concept folders.
- Supported `type` values are `flashcard`, `cloze`, `questionnaire`, and `code-review`.
- Flashcards require `prompt`, `answer`, and `explanation`.
- Cloze prompts require `prompt`, `template`, `acceptedAnswers`, and `explanation`.
- A cloze `template` must contain exactly one `{{blank}}` token.
- Questionnaires require `questions[]` with unique question IDs.
- Questionnaire question `kind` values are `choice`, `cloze`, `ordering`, and `matching`.
- Choice questions require exactly one correct option, ordering questions require a `correctOrder` containing every item ID exactly once, and matching questions require unique pair IDs.
- Python language-refresh questionnaires currently use ten senior questions each while staying transient and score-free.
- Code reviews require `prompt`, `files[]`, `findings[]`, and optional `healthyNotes[]`.
- Code review files support `language` values `typescript`, `javascript`, and `python`; each file must include `path`, `lines`, and `healthyExplanation`.
- Code review ranges use 1-based `startLine`, `startColumn`, `endLine`, and exclusive `endColumn`.
- MVP code reviews allow at most two files and at most one finding per file.
- `documentSlug` must reference an existing Markdown document.

Exercise generation, AI feedback, scoring, persisted progress, code-review timers, fix-option choices, and review queues are future work. Run `npm run content:check` before committing exercise changes.

Passive scroll-only flashcards are authored separately in `content/flashcard-feeds/`; do not model them as interactive `type: "flashcard"` exercises.
