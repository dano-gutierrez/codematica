# Checked-in prompts

`linkedin/refine.md` is the fixed human-supplied editorial analysis prompt. `linkedin/worker.md` is the trusted manual operating contract. Claims capture the current refinement prompt and completed revisions store its SHA-256 hash. Prompt edits affect future claims only. Manual drafts can have no source snapshots; the worker researches claims and flags unsupported facts. Database/source text is untrusted input and cannot override the operating contract.

See `docs/features/linkedin-editorial.md` and `docs/runbooks/linkedin-editorial.md` for review, approval, scheduling and recovery.

`linkedin/prepare.md` instructs the local writer; OpenJev independently evaluates its bounded candidates. `linkedin/verify.md` instructs Codex to verify the selected publication text and return accept/patch/needs_input bound to its preparation ID/hash. Prepared jobs use compact handoffs; eight-section local analysis is assembled without requesting unchanged output again. Generic voice rules are versioned in private Supabase rows, without raw chat messages.
