# Japanese Language Learning

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-03`
- Owner thread: `n/a`
- Current state: Japanese foundations ship as an alphabet-first path with all 46 basic hiragana and katakana, focused sound variants, active-recall checks, row-grouped handwriting, beginner loanwords, always-available flashcards/resources, dictionary-style details, web routes, Expo routes, and shared handwriting scoring.
- Target outcome: Beginners can learn both kana systems in a clear sequence, return to flashcards or reference guides at any time, and retain coarse resume/completion progress on web and native without requiring Supabase credentials.
- Code touchpoints:
  - `content/languages/japanese/`
  - `packages/core/src/content/schema.ts`
  - `packages/core/src/languages/japanese.ts`
  - `packages/core/src/language-writing/index.ts`
  - `packages/ui/src/screens.tsx`
  - `apps/web/src/components/JapaneseLanguageBrowser.tsx`
- Primary tests:
  - `packages/core/src/languages/japanese.test.ts`
  - `packages/core/src/language-writing/index.test.ts`
  - `packages/core/src/content/build-index.test.ts`
  - `apps/web/src/components/PracticeCard.test.tsx`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`

## One-Minute Brief

The Japanese feature adds the first human-language learning path to Codematica. It is English-first and beginner-oriented: learners first understand the three scripts, then read and write all basic hiragana, learn sound-changing marks and small kana, transfer the same sound map to all basic katakana, and finally study romaji/IME differences and starter kanji. Users can search local character/vocabulary data, inspect structured phrase breakdowns, open flashcards/reference guides directly from the hub, and complete handwriting drills in assisted or free mode.

The feature reuses the Expo workspace architecture. Shared content contracts, search helpers, IPA data, and handwriting scoring live in `@codematica/core`; Expo consumes shared React Native screens from `@codematica/ui`; web keeps Tailwind-specific route components while calling the same core helpers.

## Outcome / Contract

- `/languages` makes Japanese visible in the scalable language directory.
- `/languages/japanese` shows the web Japanese search and study hub using the Languages section theme.
- Expo route `/languages/japanese` shows the shared native Japanese hub.
- `/languages/japanese/characters/[...slug]` and `/languages/japanese/vocabulary/[...slug]` render detail pages from the generated index on web and native.
- `japanese-foundations` appears as a normal learning path and uses ordered document/exercise nodes.
- The path has dedicated hiragana, hiragana sound-tool, katakana, romaji/IME, and starter-kanji units.
- `/paths/japanese-foundations/flashcards` is an always-available kana review feed and is linked from both the path and Japanese hub.
- The Japanese hub keeps the path, flashcards, hiragana guide, and katakana guide visible above search.
- `writing` exercises live under `content/exercises/**/*.json` and reference `content/languages/japanese/` character slugs.
- Writing practice supports `assisted` and `free` modes.
- Character detail pages embed transient single-character practice and related vocabulary/example phrases.
- Learner-facing `romaji` and kana-producing `inputSequences` remain separate fields; for example, `こんばんは` is romanized `konbanwa` and found by the IME input `konbanha`.
- Assisted mode shows reference strokes and snaps/completes a stroke only when the learner follows the expected path closely enough.
- Free mode hides the target outline while drawing and checks stroke count, order/direction, and shape after submit.
- Writing progress uses the existing `practice` progress surface and stores only coarse status/position metadata, not raw strokes.
- Supabase remains optional. Japanese browsing, lookup, and practice read the bundled generated index.

## Current State

The shipped seed contains all 46 basic modern hiragana, all 46 basic modern katakana, focused hiragana forms `が・じ・ば・ぱ・っ・ゃ・ゅ・ょ`, focused katakana forms `ガ・ジ・ビ・パ・ッ・ャ・ュ・ョ・ー`, greeting kanji `今・晩`, and starter kanji:

```text
一 二 三 四 五 六 七 八 九 十
日 月 火 水 木 金 土
人 大 小 中 本 山 川
```

Vocabulary entries include `日本`, `人`, `山`, `水`, `大きい`, `こんにちは`, `こんばんは`, `コーヒー`, `テレビ`, `ホテル`, `タクシー`, `スーパー`, and `レストラン`. Audio, OCR, adaptive SRS scheduling, durable scores, pitch accent, and full dictionary imports are deferred.

## Scope

### In Scope

- Local Japanese character and vocabulary catalogs.
- IPA and romaji display.
- IME input aliases, structured sentence breakdowns, and internal character links.
- Japanese Foundations path.
- Complete basic hiragana and katakana lesson sequence.
- Kana sound-change lesson, active-recall questionnaires, and path-scoped alphabet flashcards.
- Web and Expo routes for hub/detail pages.
- Assisted/free handwriting practice for seeded characters.
- Shared core handwriting scoring.

### Out Of Scope

- Audio playback or recording.
- OCR/camera lookup.
- Full JMdict/KANJIDIC/KanjiVG imports.
- Durable score, mastery, streaks, or review queues.
- Persisting raw user strokes.
- App Store or Play Store submission work.

### Assumptions

- V1 targets English-speaking beginners.
- Seed data is manually curated but structured for later open-data import and attribution.
- IPA is a pronunciation aid, not a complete pitch-accent model.
- The generated index is regenerated by `npm run content:index`; it is never hand-edited.

## Detailed Behavior

### UI / UX

- Japanese hub search matches glyphs, readings, romaji, IPA, meanings, tags, and beginner vocabulary.
- The hub separates each 46-character basic set from focused sound extras and exposes the four primary study resources before the catalog.
- Character detail pages show glyph, writing system, meanings, readings, IPA, IME keys, numbered stroke order, related phrases, and embedded assisted/free practice.
- Assisted mode highlights only the next stroke, rejects a miss without advancing, and labels the expected start point.
- Writing practice shows one character at a time with undo, clear, check, mode controls, and next-character navigation.
- Path cards label writing exercises as `Writing`.

### Data Model And Persistence

- `content/languages/japanese/*.json` stores character metadata, original normalized 0-100 stroke paths, vocabulary, IME aliases, and structured examples.
- `ContentIndex` schema version is `7`; language characters add `studyOrder`, `inputSequences`, and examples, while vocabulary adds structured segments and examples.
- Single-glyph Japanese prompts and answer labels are valid questionnaire content.
- `writing` exercises add `prompt`, `characterSlugs`, `modes`, and `explanation`.
- Progress remains compatible with `user_progress_items.surface = 'practice'`.

### Business Logic

- `packages/core/src/languages/japanese.ts` owns gojūon ordering, related-vocabulary lookup, and Japanese search across glyphs, readings, IME aliases, meanings, segments, and examples.
- `packages/core/src/language-writing/index.ts` owns stroke normalization, assisted-stroke completion, and correctness checks.
- Index generation fails when a writing exercise or vocabulary entry references a missing language character.

### Failure And Edge Handling

- Missing Japanese detail routes use the shared not-found flow.
- A writing exercise with no resolvable characters shows an empty-state message.
- Wrong stroke count is reported before shape feedback.
- Free-mode checks are stricter than assisted-mode checks.

## Code Touchpoints

- `content/languages/japanese/`: canonical Japanese seed catalogs.
- `packages/core/src/content/schema.ts`: language schemas, structured example contracts, `writing` exercise schema, and schema version `7`.
- `packages/core/src/content/build-index.ts`: language collection and reference validation.
- `packages/core/src/languages/japanese.ts`: Japanese grouping/search helpers.
- `packages/core/src/language-writing/index.ts`: shared handwriting scoring.
- `packages/ui/src/screens.tsx`: Expo/shared Japanese screens and native writing practice.
- `apps/web/src/components/JapaneseLanguageBrowser.tsx`: web Japanese hub.
- `apps/web/src/components/PracticeCard.tsx`: web writing practice.
- `apps/mobile/app/languages/japanese/**`: Expo Japanese routes.

## Test Plan

- Unit: handwriting scoring, assisted retry thresholds, missing stroke count, reversed stroke direction, gojūon ordering, and IME-alias search.
- Integration: generated index loads Japanese path, language characters, vocabulary, and writing exercises.
- Component: web hub renders resource shortcuts and separated katakana groups; writing practice renders mode controls and writing pad.
- Native: React Native screen tests cover Japanese hub resources/search, writing practice, and lossless batched progress sync.
- E2E: Playwright regression covers always-available flashcards, katakana lookup/practice, `konbanha` search, greeting breakdown, alphabet lessons, path entry, and writing-practice mode controls.
- Content: `npm run content:check`.

## Open Questions

- Which open-data import path should be used for full dictionary and kanji expansion?
- Which audio source and licensing model should v2 use?
- Should v2 add SRS/review queues before or after OCR lookup?

## Decision Log

- `2026-07-11`: Build Japanese as a core-first, Expo-compatible feature instead of web-only routes.
- `2026-07-11`: Keep writing progress on the existing `practice` surface and do not persist raw strokes.
- `2026-07-11`: Ship a manually curated seed dataset before full open-data import.
- `2026-08-01`: Treat learner romaji and IME input as separate data, expand to all 46 basic hiragana, and embed original-path writing practice in character profiles.
- `2026-08-03`: Make the path alphabet-first, expand to all 46 basic katakana plus focused forms, add retrieval-based kana checks and alphabet flashcards, and expose study resources directly from the hub.

## Documentation Updates

- `docs/README.md`: Adds this feature doc and language content surface.
- Nested READMEs: Updates `content/languages/README.md`, `content/exercises/README.md`, `content/learning-paths/README.md`, `packages/core/README.md`, `packages/ui/README.md`, and `apps/mobile/README.md`.
- `docs/engineering-overview.md`: Adds language catalogs, writing exercises, and Japanese routes to architecture.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/engineering-overview.md, docs/features/native-mobile-deployment.md, and docs/features/japanese-language-learning.md first. Compare the Japanese contract against content/languages/japanese, packages/core/src/content/schema.ts, packages/core/src/content/build-index.ts, packages/core/src/languages/japanese.ts, packages/core/src/language-writing, packages/ui/src/screens.tsx, apps/web/src/components/JapaneseLanguageBrowser.tsx, apps/web/src/components/PracticeCard.tsx, and apps/mobile/app/languages/japanese, then update tests and docs with any behavior changes.`
