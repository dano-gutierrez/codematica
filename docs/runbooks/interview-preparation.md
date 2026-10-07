# Interview preparation operations

Read the [feature contract](../features/interview-preparation.md), [design system](../features/design-system.md) and [knowledge runbook](knowledge-evaluator.md). The implementation depends on the knowledge evaluator migrations through `202610030004` and adds `202610040001`. Apply hosted migrations only as an explicitly authorized rollout, after isolated replay and acceptance.

## Start

Sign in with an existing verified allowlisted admin account. Open Admin → Interview preparation on web/native, paste your resume and evidence-linked project stories in Your experience, then create a company/role and its rounds. No real companies are seeded.

Invoke `$prepare-interview` in Codex with the saved opportunity ID. The maintained skill is `.agents/skills/prepare-interview/SKILL.md`; the installed copy is `~/.codex/skills/prepare-interview`. Keep both copies synchronized when changing the skill.

## Local commands

Configure server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in local `.env`. Never expose them under public env names or export them in context files.

```sh
npm run interview:prep -- status
npm run interview:prep -- context OPPORTUNITY_ID
npm run interview:prep -- finalize DRAFT_JSON EDITED_JSON OUTPUT_JSON --compared
npm run interview:prep -- validate OUTPUT_JSON
npm run interview:prep -- import OUTPUT_JSON
npm run interview:prep -- assess OUTPUT_JSON
npm run interview:prep -- export OPPORTUNITY_OR_REVISION_ID
npm run interview:prep -- backup
```

The finalizer must follow an actual technical-edit pass and complete source comparison. `--compared` attests that comparison; it does not run an editor model. It reads the repository skill, preserves structured metadata and checks protected code, links and numbers. Input versions and edited hashes are checked again by the database.

A pending assessment imports as a draft. `assess` queues a saved candidate for the existing manually run local knowledge worker. Review the resulting report in Admin → Knowledge. Explicit acceptance authorizes report use; it does not publish content. Bind the accepted current job/snapshot to the package, repeat technical editing/finalization and import a new revision. Any prose change after assessment requires reevaluation.

`npm run knowledge:export:private` includes private interview/LinkedIn revisions without exporting the full resume. Index/sync through the existing knowledge runbook; do not disturb an active assessment batch. All private outputs default to ignored `.local/interview-preparation`. Explicit filenames must still point to a private location. Exports never overwrite files automatically.

## Reuse and recovery

For a reusable lesson, ask the preparation skill to anonymize it, apply technical-edit and stage a document/exercise candidate in Admin → Knowledge. Review current overlap/placement evidence before requesting canonical authoring. Remove company, interviewer and personal identifiers first; public curriculum stays company-neutral.

Failed saves preserve fields; retry the same payload/key after an uncertain outcome. Changed payloads need a fresh operation. Version conflicts require fresh context and regeneration. Archive preserves records. Download Markdown for portability and copy complete private backups to a user-controlled durable location. No destructive restore command is provided.

## Validation

```sh
python3 scripts/interview-preparation/test-database.py
npm run e2e:interview-admin
npm run test:coverage
npm run test:mobile:coverage
npm run typecheck
npm run lint
npm run content:check
npm run mobile:doctor
npm run build
npm run test:production:smoke
```

Database replay creates a fresh named database in the local Supabase PostgreSQL container, bootstraps its managed auth infrastructure, replays every app migration and runs all transactional pgTAP suites. Existing databases are not reset. Logs and scratch databases remain available for diagnosis.

Run `.maestro/interview-preparation.yaml` on Android and iOS with a disposable signed-in admin and isolated test database before native release acceptance. Browser/fixture success does not establish installed-device or hosted rollout readiness.
