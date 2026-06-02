# Docs Hub

This folder is the durable context layer for Codex threads working in this repo.

Start here:

1. Read `docs/codex-context.md` for the repo map, working rules, and handoff pattern.
2. Read `docs/engineering-overview.md` for the current architecture, stack, content flow, Supabase direction, and Mermaid diagrams.
3. Read the relevant file in `docs/features/` for the feature you are touching.
4. If the feature is `proposed` or `in_progress`, verify the named touchpoints in code before editing.
5. After changing behavior, adding a workflow, or making a product decision, update the matching feature doc in the same branch.

Conventions:

- `docs/codex-context.md` is the repo-wide orientation file.
- `docs/engineering-overview.md` is the repo-level architecture and system-flow document.
- `docs/features/<feature>.md` is the durable product and implementation contract for one feature.
- `docs/features/_template.md` is the format new feature docs should follow.
- `docs/features/README.md` explains how threads should consume and maintain feature docs.
- `docs/features/learning-paths-and-practice.md` owns the path-first home, local path JSON, local exercise JSON, and practice routes.
- `docs/features/programming-language-refresh.md` owns reusable programming-language refresh paths, starting with Python for TypeScript and JavaScript engineers.
- `docs/features/interview-coding-catalog.md` owns the reported-public company interview coding catalog and guided solution walkthroughs.
- `docs/plans/<feature>/...` is the repo-local home for durable implementation plans when a plan needs to outlive one thread.

Content authoring surfaces:

- `content/knowledge/`: canonical Markdown documents.
- `content/diagrams/`: canonical Mermaid diagrams.
- `content/learning-paths/`: role and skill path JSON.
- `content/exercises/`: flashcard, cloze, and questionnaire practice JSON.
- `content/flashcard-feeds/`: path-scoped passive flashcard feed JSON.
- `content/interviews/`: company-scoped interview coding catalog JSON.

Maintenance rules:

- Update this file when a new docs section, plan convention, feature-doc convention, or recommended reading order is added.
- Update the closest existing README when adding a durable folder, workflow, command, integration, test lane, or content convention.
- If no README owns a new durable area and the area is not self-explanatory, add one.
- Do not let README files become historical sketches. If implementation changes the actual contract, update the README in the same branch.
