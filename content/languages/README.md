# Language Content

Author local-first human-language study data here.

- Author language data as JSON catalogs under `content/languages/<language>/`.
- Japanese catalogs may span multiple JSON files. Schema v10 covers complete kana, the exact 100-kanji target, 650 N5-aligned vocabulary profiles, 60 structured grammar patterns, deterministic study order, IME metadata, original normalized stroke guides, approval-gated audio metadata, and resource rights. Of the 100-kanji target, 25 authored profiles are published and 75 are planned. Planned entries are not handwriting-ready until their original stroke paths pass visual QA.
- Keep `romaji` pronunciation-oriented. Put kana-producing keyboard aliases such as `konbanha`, `si`, or `wo` in `inputSequences` instead of replacing learner romaji.
- Character slugs must stay ASCII and stable because writing exercises and vocabulary entries reference them.
- Stroke points use normalized 0-100 coordinates so web and Expo share scoring logic.
- Run `npm run content:index` after changing language data.
- Add released audio under `content/languages/japanese/audio/`, declare it in `audio-manifest.json`, then run `npm run content:audio`. Do not count empty or unreleased audio as published listening coverage.
- `npm run content:japanese:n5` rebuilds the pinned N5 alignment catalog and compact JMdict candidate asset after verifying upstream SHA-256 values. Third-party terms are recorded in `THIRD_PARTY_NOTICES.md`.
- `npm run content:audio:generate` is a no-cost dry run by default. `--confirm` requires `OPENAI_API_KEY`, generates only missing draft MP3s, and records checksums; generated clips still require human approval before runtime export.
- External resources need publisher, access, availability, reuse policy, and attribution. Default to `link-only` unless redistribution rights are explicit.

Open data sources and license obligations must be documented in the feature doc before expanding imported datasets.
