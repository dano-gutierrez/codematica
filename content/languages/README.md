# Language Content

This folder contains local-first human-language study data for Codematica.

- Author language data as JSON catalogs under `content/languages/<language>/`.
- Japanese catalogs may be split across multiple JSON files. Schema v10 catalogs provide complete kana, the exact 100-kanji target, 650 N5-aligned vocabulary profiles, 60 structured grammar patterns, deterministic study order, IME metadata, original normalized stroke guides, approval-gated audio metadata, and resource-rights metadata. The 100-kanji target still contains 25 published authored profiles and 75 planned profiles; planned entries must never be presented as handwriting-ready until original paths receive visual QA.
- Keep `romaji` pronunciation-oriented. Put kana-producing keyboard aliases such as `konbanha`, `si`, or `wo` in `inputSequences` instead of replacing learner romaji.
- Character slugs must stay ASCII and stable because writing exercises and vocabulary entries reference them.
- Stroke points use a normalized 0-100 coordinate system so web and Expo drawing surfaces can reuse the same scoring logic.
- Run `npm run content:index` after changing language data.
- Add released audio under `content/languages/japanese/audio/`, declare it in `audio-manifest.json`, then run `npm run content:audio`. Empty or unreleased audio must not be represented as published listening coverage.
- `npm run content:japanese:n5` rebuilds the pinned N5 alignment catalog and compact JMdict candidate asset after verifying upstream SHA-256 values. Third-party terms are recorded in `THIRD_PARTY_NOTICES.md`.
- `npm run content:audio:generate` is a no-cost dry run by default. `--confirm` requires `OPENAI_API_KEY`, generates only missing draft MP3s, and records checksums; generated clips still require human approval before runtime export.
- External resources need publisher, access, availability, reuse policy, and attribution. Default to `link-only` unless redistribution rights are explicit.

Open data sources and license obligations must be documented in the feature doc before expanding imported datasets.
