# Japanese Language Learning

## Snapshot

- Status: `in_progress`
- Last updated: `2026-08-04`
- Current state: schema-v8 Pre-A1/A1 roadmap, complete basic kana catalogs, contextual A1 lessons and mini-readers, original readiness checkpoints, deterministic skill review, resource-rights metadata, dictionary profiles, responsive handwriting, and web/Expo destinations are shipped. The audio contract and build pipeline are ready, but the manifest intentionally remains empty until released native-speaker recordings exist.
- Target outcome: English-speaking teens and adults can move from kana discovery to practical JF A1 Can-dos while keeping the entire course, reviews, dictionary, handwriting, flashcards, and resources open.

## One-Minute Brief

Japanese Foundations is an open stamp-rally course organized around JF/CEFR `Pre-A1` and `A1`. Friendly stages—Kana Explorer, First Connections, and Everyday Navigator—carry measurable Can-do statements and original contextual checkpoints. Children’s literacy mechanics such as sound grouping, tracing, cumulative recall, picture cues, and short readers are adapted for adult second-language learners.

The learning loop is hear, notice, trace/manipulate, recall, read in context, use for a task, and review later. Audio-dependent steps are modeled but are not marked complete until original, released recordings are added. Third-party learning media is never redistributed merely because it is publicly accessible.

## Shipped Contract

- `ContentIndex.schemaVersion` is `8`.
- Learning paths may declare proficiency levels, skill strands, required nodes, JF Can-dos, open stages, checkpoint thresholds, and estimated time.
- `/languages/japanese` and the Expo Japanese hub keep four destinations visible: Learn, Review, Dictionary, and Resources.
- `/languages/japanese/review` recommends due skills while keeping every skill card and `/paths/japanese-foundations/flashcards` manually available.
- Review uses six boxes: Again → box 0/10 minutes; Hard → back one/1 day; Good → forward one/1, 3, 7, 14, 30, 60 days; Easy → forward two/3, 7, 14, 30, 60, 120 days. Box 4+ is mastered.
- Anonymous review state persists locally on web and Expo. The additive `user_skill_progress` table is RLS-protected and does not change `user_progress_items`.
- No individual answers, raw handwriting coordinates, microphone recordings, or full attempt histories are stored.
- Character/vocabulary search remains local-first and includes glyphs, readings, meanings, examples, learner romaji, and IME aliases such as `konbanha`.
- The trusted resource shelf records publisher, URL, level, skills, access, availability, reuse policy, and attribution. Current JF, MEXT, JLPT/JFT, and Tadoku materials are link-only.

## Curriculum

### Kana Explorer — Pre-A1

Five vowels and mora rhythm lead into all 46 hiragana, sound tools, all 46 katakana, long vowels, and IME spelling. Short row-grouped writing exercises and cumulative checks remain individually accessible. The milestone is an original mixed kana/input checkpoint.

### First Connections — A1

The original lesson covers greetings, introduction, `です・は・も・か`, this/that/whose, identity, ages, time, dates, family, likes, food, drinks, and a café order. Its Level Start reader uses a short café scene.

### Everyday Navigator — A1

The original lesson covers existence, position words, routines, polite present/negative/past, `を・に・で・へ`, invitations, transport, requests, permission, shopping, signs, and short messages. Its Level 0 reader follows a rainy trip to a station. The capstone uses original JLPT/JFT-style formats and is explicitly readiness practice, not an official exam or guarantee.

### Starter Kanji

The catalog contains the exact 80 Grade-1 educational kanji plus `私・食・飲・行・来・駅・電・話・時・分・半・今・何・店・会・社・家・母・父・友`, with unique study order. Existing authored stroke profiles remain published. The remaining profiles are `planned` until original normalized stroke paths, contextual vocabulary, and visual QA exist; `晩` remains a separate greeting profile and is not counted in the 100.

## Audio And Rights

- Canonical metadata lives in `content/languages/japanese/audio-manifest.json`.
- Every record requires transcript, reading, speaker, license, attribution, and a local asset path.
- Index generation rejects duplicate/missing audio IDs and missing local files.
- `npm run content:audio` copies web assets and creates static web/Expo registries.
- The current manifest is empty. Do not fabricate speakers, releases, or recordings and do not publish text-only content as though listening coverage exists.
- Future recordings need standard-Tokyo native speakers, releases, two speakers for dialogue, transcript controls, 0.75× playback, no autoplay, and offline bundling.

## iPad And Accessibility

- Expo uses adaptive orientation and retains `supportsTablet: true`.
- Native writing canvases respond to phone, Split View, portrait iPad, and landscape width up to 560 pt. Finger, mouse, and Pencil-compatible pointer input share the same responder path; pressure is not graded.
- Japanese instructional text carries `accessibilityLanguage="ja-JP"` on native; web character content uses Japanese text semantics where rendered.
- Web learning copy starts at 16 CSS px; native body copy is 17 pt, meaningful support labels are at least 13 pt, and instructional glyphs are 24 pt or larger.
- Browser zoom and native font scaling remain enabled. Controls retain visible labels, non-color feedback, and at least 44 pt native primary targets.

## Trusted References

- [JF Standard](https://www.jfstandard.jpf.go.jp/pdf/jfs2024_pamphlet_en.pdf)
- [Irodori](https://www.irodori.jpf.go.jp/en/)
- [Marugoto](https://marugoto.jpf.go.jp/en/)
- [Minato kana course](https://minato-jf.jp/CourseDetail/Index/KC25_HRGS_A100_EN01)
- [Erin’s Challenge](https://www.erin.jpf.go.jp/en/)
- [MEXT elementary literacy guidance](https://www.mext.go.jp/content/20220606-mxt_kyoiku02-100002607_002.pdf)
- [MEXT JSL guidance](https://www.mext.go.jp/a_menu/shotou/clarinet/003/001/008/007.htm)
- [JLPT levels](https://www.jlpt.jp/e/about/levelsummary.html) and [official samples](https://samplequestions.jlpt.jp/e/samples/sampleindex.html)
- [JFT-Basic](https://www.jpf.go.jp/jft-basic/e/about/index.html)
- [Tadoku free readers](https://tadoku.org/japanese/en/free-books-en/)

## Primary Touchpoints And Tests

- Content: `content/learning-paths/japanese-foundations.json`, `content/knowledge/languages/`, `content/exercises/languages/`, `content/languages/japanese/`
- Core: `packages/core/src/content/`, `packages/core/src/progress/mastery.ts`, `packages/core/src/progress/progression.ts`
- Web: `JapaneseLanguageBrowser`, `JapaneseReview`, `LearningPathMap`, `JapaneseWritingPractice`
- Native: `packages/ui/src/screens.tsx`, `apps/mobile/app/languages/japanese/`
- Persistence: `supabase/migrations/202608040001_create_user_skill_progress.sql`
- Tests: Japanese content/order/search, stage progression, mastery scheduling, web hub/review, native screens, and Japanese Playwright regression.

## Known Gaps

- Native-speaker audio and its playback UI cannot ship until genuine released recordings are supplied.
- The 75 newly declared kanji profiles need original stroke paths and contextual exercises before publication.
- Signed-in mastery sync is shipped through the additive skill-progress API, with anonymous mastery retained locally until every bounded sync batch succeeds. Checkpoint-derived automatic stamp rendering is the next persistence/UI slice; existing completion records and local mastery remain preserved.
- Manual VoiceOver/Larger Text QA remains. The iPad build reached native compilation, but local Xcode 26.3 is below Expo SDK 57's documented Xcode 26.4+ baseline and fails inside ExpoModulesJSI; rerun after the toolchain upgrade.

## Decision Log

- `2026-08-04`: Adopt JF/CEFR stages with friendly stamp names and keep all content open.
- `2026-08-04`: Add mastery additively rather than changing or deleting completion history.
- `2026-08-04`: Keep public third-party materials link-only unless redistribution rights are explicit.
- `2026-08-04`: Ship audio validation and preparation before recordings; never substitute synthetic or unlicensed media for the promised native-speaker corpus.
