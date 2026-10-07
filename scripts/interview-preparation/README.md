# Private interview workflow

The local-only CLI composes shared validation, admin RPCs, private files and technical-edit provenance. `workflow.ts` owns finalization, candidate identity and private catalog resources. `test-database.py` validates every migration and transactional pgTAP suite in a fresh local database without resetting existing data.

Use `npm run interview:prep -- <command>`; see [the runbook](../../docs/runbooks/interview-preparation.md). Actual generation happens in the installed `prepare-interview` Codex skill, not an HTTP handler or hosted worker. Private context and working files belong under ignored `.local/interview-preparation`.
