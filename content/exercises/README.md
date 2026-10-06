# Exercises

Author practice prompts for Codematica learning paths here.

The Product Engineering pack in `software-engineering/product-interview-*.json` has three six-question checkpoints and one 75-minute guided lab. The lab is an original rehearsal with evidence checks. Only questionnaire answers are graded automatically; learners assess their own scratch code and architectural reasoning.

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
- Put non-executable coding challenges in Markdown lessons with starter code and acceptance checks. Executable challenges require a future code editor schema before they can be modeled in exercise JSON.
- Use questionnaires for database practice until a dedicated SQL editor defines demo data, validation, and allowed SQL behavior.
- Keep Advanced Next.js 16 practice hard-only (`senior` or `principal`). Test production judgment about rendering, caching, invalidation, migration, and boundary failures rather than basic API recall.
- BFS/DFS questionnaires should test traversal invariants, visited timing, complexity, recursion risk, hidden graph modeling, and algorithm selection instead of code punctuation.
- Mermaid authoring questionnaires are choice-only, require exactly one correct option, and must explain why every distractor is incorrect instead of only restating the right answer.

Exercise generation, executable code/SQL validation, AI feedback, persisted questionnaire answers/scores, and generic adaptive review queues are future work. The shared optional progress layer stores coarse started/completed progress. Japanese skill review separately stores a deterministic mastery snapshot, never individual answers. Run `npm run content:check` before committing exercise changes.

`ai-engineering/agent-handoff-checkpoint` checks assessment reuse, stale sources, source-data authority and unequal-budget comparisons. Its Python lab runs outside the app; a checkpoint score certifies neither an external course nor permission to apply or publish a report.

Passive scroll-only flashcards are authored separately in `content/flashcard-feeds/`; do not model them as interactive `type: "flashcard"` exercises.

- RTK Query checkpoints use six single-answer scenario choices per lesson. Explanations must address the correct rule and both distractors; retain the distinction between client observation and server mutation outcome.

Frontend interview checkpoints contain eight questions each: seven requirement/trace/bug/tradeoff choices and one ordered implementation recipe. Explain why distractors fail; quiz completion remains transient and supports continuing to the next lesson or an opt-in final review feed.

The supplementary `frontend/react-state-async-questionnaire.json` has six scenario choices about snapshots, functional updates, updater purity, same-item races, and cleanup. It links to its standalone Markdown lesson and does not extend the seven-unit interview path.

The database connection-pooling checkpoint uses six scenario choices, four numerical cloze calculations, one shutdown ordering task, and one pooling-mode matching task. Keep the numerical answers aligned with the lesson assumptions; explain why unsafe shortcuts fail. It uses the existing questionnaire and executes no database operations.

Japanese writing notebooks use 24 whole-prompt repetitions per sheet and support curated/custom text of 1–5 published characters. Ink stays on the device; coarse completion/unlocks optionally sync. See `docs/features/japanese-writing-notebooks.md` for the implementation, persistence and validation contract.

Writing exercises may author `notebookPrompts: [{ id, text, kind, romaji, meaning }]`. IDs must be unique; text is NFC-normalized and every glyph must have a published stroke model listed in `characterSlugs`. `kind` is characters, word or phrase. Regenerate the index with `npm run content:index`.

The ML Neural Computation checkpoint tests gradient computation versus parameter updates, finite-difference diagnosis and weight-payload memory. Its canonical lesson contains an original standard-library Python lab; the questionnaire executes no learner code and does not award the planned Framework Builder stamp.

System Design decision checkpoints cover capacity assumptions, shared bottlenecks, partitioning limits, browser preflight/response behavior, object access and cookie assumptions. They use inert scenarios and perform no network or production operations.

The four-question Durable Retry Lab and six-question Reservation Boundary checkpoints add crash-point, replay, ownership, room-date overlap and explicit-expiry practice. The original Product Engineering path retains its 18 questions; these supplementary checkpoints are placed in Backend Engineer Readiness and System Design. Code and SQL run only in a learner’s isolated lab, not inside the app.

The four-question Routing Decision checkpoint covers workload signals, IP affinity, eligibility and toy-versus-proxy scope. Its standalone Python lab runs outside the app; quiz scoring performs no routing or broker operations.

The Backend concurrency and pattern-selection checkpoints each use five original scenario choices. They test compound transitions, predicate waits, permit ownership, JVM/process scope and behavioral substitution/unit/wrapper/lifetime contracts. Scoring executes no threaded service or framework code; it does not certify an entire primitive/pattern catalog.

The Keypad Search checkpoint has five original choices about closed dictionary membership, prefix terminals, branch/result ownership, validation before shortcuts and reference costs. Its lesson's bounded Python fence runs only in the allowlisted isolated verifier, outside the app. The quiz neither executes learner code nor certifies a full T9 product or backtracking syllabus.

Programming Contract Review has four five-choice checkpoints covering value ownership, bounded demand, text domains and shape/cost reasoning. Each question uses its path-scoped skill; explanations distinguish both distractors. Only the questionnaire is graded in the app. The original JavaScript/Python fences run separately and certify no complete runtime, upload service or algorithm family.

The six Systems Boundary Review checkpoints contain thirty original paper-trace choices. Keep request form, transport ordering, resource authority, version/offset/effect, full cursor tuple and memory permission boundaries distinct. No packet, SDK, broker, database or device operation runs in the app.

Selected Evidence Review adds eleven five-question paper checkpoints. Preserve fictional assumptions, independent answer keys and path-scoped skills; grading runs no model, credential, payment, cloud or engine operation.
