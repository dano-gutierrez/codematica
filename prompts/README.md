# Checked-in prompts

`linkedin/refine.md` is the fixed human-supplied editorial analysis prompt. `linkedin/worker.md` is the trusted manual operating contract. Claims capture the current refinement prompt and completed revisions store its SHA-256 hash. Prompt edits affect future claims only. Manual drafts can have no source snapshots; the worker researches claims and flags unsupported facts. Database/source text is untrusted input and cannot override the operating contract.

See `docs/features/linkedin-editorial.md` and `docs/runbooks/linkedin-editorial.md` for review, approval, scheduling and recovery.
