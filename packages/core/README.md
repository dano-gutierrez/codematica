# @codematica/core

Shared runtime-safe Codematica domain logic for web and native apps.

This package owns generated content index access, content contracts, document/diagram search, cross-section discovery search and curation resolution, practice logic, passive flashcard windowing, Japanese language lookup helpers, handwriting scoring, and progress validation/display helpers. Node-only authoring and indexing helpers live here for reuse by root scripts, but mobile bundles should import only runtime exports.

Runtime-safe language modules live under `src/languages/` and `src/language-writing/`. Local language catalogs are indexed from `content/languages/` into the generated content index; do not hand-edit `src/generated/content-index.json`.
