# Language Content

This folder contains local-first human-language study data for Codematica.

- Author language data as JSON catalogs under `content/languages/<language>/`.
- Japanese v1 uses `characters.json` for kana/kanji cards and `vocabulary.json` for beginner lookup entries.
- Character slugs must stay ASCII and stable because writing exercises and vocabulary entries reference them.
- Stroke points use a normalized 0-100 coordinate system so web and Expo drawing surfaces can reuse the same scoring logic.
- Run `npm run content:index` after changing language data.

Open data sources and license obligations must be documented in the feature doc before expanding imported datasets.
