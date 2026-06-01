# Exercises

This folder contains manually authored practice prompts for Codematica learning paths.

- Author exercises as `.json` files under concept folders.
- Supported `type` values are `flashcard` and `cloze`.
- Flashcards require `prompt`, `answer`, and `explanation`.
- Cloze prompts require `prompt`, `template`, `acceptedAnswers`, and `explanation`.
- A cloze `template` must contain exactly one `{{blank}}` token.
- `documentSlug` must reference an existing Markdown document.

Exercise generation, AI feedback, scoring, and review queues are future work. Run `npm run content:check` before committing exercise changes.
