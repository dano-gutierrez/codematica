# Language Content

This folder contains local-first human-language study data for Codematica.

- Author language data as JSON catalogs under `content/languages/<language>/`.
- Japanese catalogs may be split across multiple JSON files. Schema v8 catalogs provide the complete 46-character basic hiragana and katakana sets, focused sound/small-kana variants, the exact 100-kanji Pre-A1/A1 target, vocabulary, deterministic `studyOrder`, learner `romaji`, distinct IME `inputSequences`, structured examples/segments, original normalized stroke guides, audio metadata, and curated resource-rights metadata. The 100-kanji target currently contains 25 published authored profiles and 75 explicitly planned profiles; planned entries must not be presented as handwriting-ready.
- Keep `romaji` pronunciation-oriented. Put kana-producing keyboard aliases such as `konbanha`, `si`, or `wo` in `inputSequences` instead of replacing learner romaji.
- Character slugs must stay ASCII and stable because writing exercises and vocabulary entries reference them.
- Stroke points use a normalized 0-100 coordinate system so web and Expo drawing surfaces can reuse the same scoring logic.
- Run `npm run content:index` after changing language data.
- Add released audio under `content/languages/japanese/audio/`, declare it in `audio-manifest.json`, then run `npm run content:audio`. Empty or unreleased audio must not be represented as published listening coverage.
- External resources need publisher, access, availability, reuse policy, and attribution. Default to `link-only` unless redistribution rights are explicit.

Open data sources and license obligations must be documented in the feature doc before expanding imported datasets.
