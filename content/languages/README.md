# Language Content

This folder contains local-first human-language study data for Codematica.

- Author language data as JSON catalogs under `content/languages/<language>/`.
- Japanese catalogs may be split across multiple JSON files. They provide the complete 46-character basic hiragana and katakana sets, focused sound/small-kana variants, starter kanji, vocabulary, deterministic `studyOrder`, learner `romaji`, distinct IME `inputSequences`, structured examples/segments, and original normalized stroke guides.
- Keep `romaji` pronunciation-oriented. Put kana-producing keyboard aliases such as `konbanha`, `si`, or `wo` in `inputSequences` instead of replacing learner romaji.
- Character slugs must stay ASCII and stable because writing exercises and vocabulary entries reference them.
- Stroke points use a normalized 0-100 coordinate system so web and Expo drawing surfaces can reuse the same scoring logic.
- Run `npm run content:index` after changing language data.

Open data sources and license obligations must be documented in the feature doc before expanding imported datasets.
