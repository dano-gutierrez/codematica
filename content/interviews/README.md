# Interview Catalog Content

This folder contains local-first interview coding catalog files.

- Author one company per `.json` file.
- Company files require `slug`, `name`, `logo`, `summary`, `status`, and `questions`.
- `logo.src` should point to a local SVG under `/company-logos/`; `logo.alt` should name the company logo.
- Each question must include at least one public/community source link.
- Each question must include at least two `solutionTracks`.
- Each solution track must include guided `steps`, final `explanation`, `complexity`, and code for `python`, `typescript`, and `java`.
- Use `diagrams[]` for optional Mermaid diagrams that clarify a data structure or flow.
- Prompts and explanations must be Codematica rewrites, not copied from source pages.
- Keep wording clear that this is reported/public prep, not an official company question bank.

Run `npm run content:check` after editing interview files.
