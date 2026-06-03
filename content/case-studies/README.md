# Case Study Flows

This folder contains canonical JSON for interactive real-system architecture walkthroughs.

- Author one flow per `.json` file.
- Keep `slug` aligned with the owning document's `caseStudyFlowRef`.
- Use fixed `position` coordinates so the React Flow canvas is deterministic on mobile and desktop.
- Keep node IDs, edge IDs, and step IDs lowercase with hyphen separators.
- Every edge must reference existing node IDs.
- Every step must reference existing node and edge IDs.
- Markdown remains the explanation source of truth. Flow JSON is only the interactive visual layer.
- Case study flow JSON is local-first and is not synced to Supabase in the current V1 contract.

Run `npm run content:index` after changing flow JSON, then `npm run content:check` before committing.
