# Interview Catalog Content

This folder contains local-first interview coding catalog files.

- Author one interview collection per `.json` file with `kind: "company"` or `kind: "real-world"`.
- Company collections require `slug`, `name`, `logo`, `summary`, `status`, and `questions`; real-world collections omit company logos and identifying source details.
- `logo.src` should point to a local SVG under `/company-logos/`; `logo.alt` should name the company logo.
- Company questions must include at least one public/community source link. Anonymous real-world questions instead require a provenance `sourceNote`.
- `algorithm` questions require at least two solution tracks with guided steps, explanation, complexity, and Python, TypeScript, and Java code.
- `web` questions require evaluation intent, expected signals, acceptance criteria, red flags, and at least three solution tracks.
- Every web solution includes acceptance rationale, tradeoffs, complexity, and a validated `WebExerciseProject` containing authored React/TS, vanilla TS, or static files.
- Use `diagrams[]` for optional Mermaid diagrams that clarify a data structure or flow.
- Prompts and explanations must be Codematica rewrites, not copied from source pages.
- When two algorithms correctly solve the same prompt, solution tracks should explain asymptotic performance, practical memory shape, readability, and runtime risks rather than presenting code alone.
- Keep wording clear that this is reported/public prep, not an official company question bank.

Run `npm run content:check` after editing interview files.

Web tracks may include `python` with complete `code`, `explanation`, and language-specific `complexity`. Frontend Interview Practice uses three tracks per question; all 21 TS projects and Python companions are executed by tests. `sourceRefs` resolve through the shared source catalog. Run `npm run test:interview:python` and the authored-project Vitest checks after editing solutions.
