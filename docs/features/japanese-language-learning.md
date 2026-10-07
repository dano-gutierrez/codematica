# Japanese Language Learning

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-02`
- Current state: schema-v12 provides a kana-to-N5 roadmap, 650 N5-aligned vocabulary profiles, 60 grammar patterns, ten progressive A1 units, and mixed/open-answer/listening questionnaires. Web and Expo share an offline Japanese IME, Pencil Scribble-compatible text input, flashcard/writing review routes, and OpenAI TTS metadata requiring approval.
- Target outcome: English-speaking teens and adults can move from kana discovery to practical JF A1 Can-dos while keeping the entire course, reviews, dictionary, handwriting, flashcards, and resources open.

## One-Minute Brief

Japanese Foundations is an open stamp-rally course organized around JF/CEFR `Pre-A1` and `A1`. Stages—Kana Explorer, First Connections, and Everyday Navigator—have measurable Can-do statements and original contextual checkpoints. [Unclear: these stage names differ from the N5 roadmap in the Snapshot.] The course adapts sound grouping, tracing, cumulative recall, picture cues, and short readers from children’s literacy teaching for adult second-language learners.

The learning loop is hear, notice, trace/manipulate, recall, read in context, use for a task, and review later. Current lessons use concrete scene cues and short readers; original illustration assets remain future visual work. Audio-dependent steps are modeled but are not marked complete until original, released recordings are added. Third-party learning media is never redistributed merely because it is publicly accessible.

## Shipped Contract

- `ContentIndex.schemaVersion` is `11`.
- Learning paths may declare proficiency levels, skill strands, required nodes, JF Can-dos, open stages, checkpoint thresholds, and estimated time.
- `/languages/japanese` and the Expo Japanese hub keep four destinations visible: Learn, Review, Dictionary, and Resources.
- `/languages/japanese/review` keeps the due queue primary and links to 650-card vocabulary and 80-prompt open-answer modes. Listening is linked only when its complete referenced audio is approved.
- Open answers accept Japanese directly or convert romaji locally into kana/kanji candidates. iPad uses the same native `TextInput`, allowing on-device Apple Pencil Scribble without retaining raw ink.
- Review uses six boxes: Again → box 0/10 minutes; Hard → back one/1 day; Good → forward one/1, 3, 7, 14, 30, 60 days; Easy → forward two/3, 7, 14, 30, 60, 120 days. Box 4+ is mastered.
- Web and Expo review ratings expose a persistent selected/pressed state, announce the saved choice, and lock the four ratings after one choice so an accidental repeated tap cannot create extra attempts. `Practice again` explicitly starts another recall and re-enables rating.
- A delayed authenticated progress response merges against the newest in-memory review state, so it cannot overwrite a rating made while the review screen is open.
- Anonymous review state persists locally on web and Expo. When authenticated, both clients load the remote snapshot, validate it, merge it with retained local state, save the merged result locally, and upload bounded 20-row batches. The additive `user_skill_progress` table is RLS-protected and does not change `user_progress_items`.
- Individual answers, microphone recordings and full attempt histories are not stored. Notebook vector ink is saved only on its device; remote progress never contains ink.
- Notebook handwriting compares full shapes after alignment, allowing reordered strokes and extra pen lifts. Missing major features, taps and scribbles fail. See the notebook contract below.
- Character/vocabulary search remains local-first and includes glyphs, readings, meanings, examples, learner romaji, and IME aliases such as `konbanha`.
- The trusted resource shelf records publisher, URL, level, skills, access, availability, reuse policy, and attribution. Current JF, MEXT, JLPT/JFT, and Tadoku materials are link-only.

## Handwriting Practice Sheets (Planas)

[Japanese writing notebooks](japanese-writing-notebooks.md) owns the current 24-repetition notebook, custom creation, local ink, optional unlock sync and PencilKit contract. Handwriting difficulty offers Easy (default), Balanced and Precise, saved per notebook. Input detection is automatic with no mode buttons; one finger writes, two fingers scroll the paper, and web wheel/trackpad scrolling stays available. Characters check automatically after a 400ms pen-up pause; error feedback waits until 1.2 seconds after pen-up and is cancelled when another stroke begins. The manual Check character control is removed. Rejected ink briefly bounces the expected cell, then fades; starting another stroke cancels expiry for correction. Footer controls stay compact with an accessible restart icon. Writing cells clear the red notebook margin. The Japanese hub keeps Hiragana 101 and Katakana links and adds Notebook practice. Required pair sheets determine lesson completion; matching and supplemental word sheets keep separate completion behavior.

All 109 kana models retain accurate KanjiVG curves, pinned at `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`, and visible Ulrich Apel/contributor CC BY-SA 3.0 attribution. The notebook grader uses major stroke geometry for coverage without requiring user stroke order, direction or exact lifts. The older stroke-by-stroke helpers remain for compatibility and dictionary model rendering.

## Curriculum

### Kana Explorer — Pre-A1

Five vowels and mora rhythm lead into all 46 hiragana, sound tools, all 46 katakana, long vowels, and IME spelling. Short row-grouped writing exercises and cumulative checks remain individually accessible. The milestone is an original mixed kana/input checkpoint.

### First Connections — A1

The original lesson covers greetings, introduction, `です・は・も・か`, this/that/whose, identity, ages, time, dates, family, likes, food, drinks, and a café order. Its Level Start reader uses a short café scene.

### Everyday Navigator — A1

The original lesson covers existence, position words, routines, polite present/negative/past, `を・に・で・へ`, invitations, transport, requests, permission, shopping, signs, and short messages. Its Level 0 reader follows a rainy trip to a station. The capstone uses original JLPT/JFT-style formats and is explicitly readiness practice, not an official exam or guarantee.

### Starter Kanji

The catalog contains the exact 80 Grade-1 educational kanji plus `私・食・飲・行・来・駅・電・話・時・分・半・今・何・店・会・社・家・母・父・友`, with unique study order. Existing authored stroke profiles remain published. The remaining profiles are `planned` until original normalized stroke paths, contextual vocabulary, and visual QA exist; `晩` remains a separate greeting profile and is not counted in the 100.

### N5 Foundation

Ten A1 units progress through identity, time, home, routines, shopping, description, requests, travel, past activities, and integrated readiness. The catalog contains exactly 650 independently selected study entries aligned against a pinned open N5 deck and exactly 60 authored grammar patterns. Each unit has a searchable lesson, twelve-item mixed quiz, eight open answers, and six draft listening questions. The word set is N5-aligned, not official: JLPT publishes level and item-format guidance without an exhaustive vocabulary list.

The offline IME uses deterministic romaji-to-kana rules, curriculum boosts, and a compact 12,000-reading JMdict common-word candidate map. Candidate data is local, carries attribution/share-alike notices, and never sends learner input to a service.

## Audio And Rights

- Canonical metadata lives in `content/languages/japanese/audio-manifest.json`.
- Every record requires transcript, reading, speaker, license, attribution, and a local asset path.
- Index generation rejects duplicate/missing audio IDs and any approved record whose local file is missing; draft queue records may intentionally have no MP3 yet.
- `npm run content:audio` copies web assets and creates static web/Expo registries.
- The manifest queues 710 OpenAI TTS drafts: 650 headwords and 60 original listening sentences. `content:audio:generate` is dry-run-first and resumable; no generation occurs in app runtimes.
- Generated clips require an `AI-generated voice` disclosure, checksum, standard-Tokyo Japanese review, transcript verification, and named human approval before `content:audio` exports them. Playback provides replay and 0.75× speed and never autoplays.

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
- [JLPT test sections and item composition](https://www.jlpt.jp/e/guideline/testsections.html)
- [JMdict/EDRDG](https://www.edrdg.org/jmdict/j_jmdict.html)
- [Apple Pencil Scribble](https://support.apple.com/guide/ipad/enter-text-with-scribble-ipad355ab2a7/ipados)
- [OpenAI text-to-speech](https://developers.openai.com/api/docs/guides/text-to-speech)
- [JFT-Basic](https://www.jpf.go.jp/jft-basic/e/about/index.html)
- [Tadoku free readers](https://tadoku.org/japanese/en/free-books-en/)

## Primary Touchpoints And Tests

- Content: `content/learning-paths/japanese-foundations.json`, `content/knowledge/languages/`, `content/exercises/languages/`, `content/languages/japanese/`
- Core: `packages/core/src/content/`, `packages/core/src/japanese-ime/`, `packages/core/src/practice/questionnaire.ts`, `packages/core/src/language-writing/practice.ts`, `packages/core/src/progress/mastery.ts`, `packages/core/src/progress/progression.ts`
- Web: `JapaneseLanguageBrowser`, `JapaneseReview`, `JapaneseAnswerInput`, `JapaneseAudioPlayer`, `JapaneseFlashcardPractice`, `JapaneseWritingPractice`, `QuestionnaireSession`
- Native: `packages/ui/src/screens.tsx`, `apps/mobile/app/languages/japanese/`
- Persistence: `supabase/migrations/202608040001_create_user_skill_progress.sql`
- Tests: exact N5 content counts and references, schema/grading/IME/audio filtering, assisted and free handwriting tolerance, stage progression, mastery scheduling, web/native open-answer and review modes, Japanese Playwright regression, coverage floors, and the Maestro installed-app journey.

## App-wide Japanese design pass — 2026-10-03

The dictionary presents a labeled search with empty results and Clear search recovery. The complete word catalog stays available in a named disclosure; direct search still covers every published word. Study links, details and review actions use shared geometry and semantic tones. Native character tiles grow with Dynamic Type instead of fixing their height/width; the context header stacks its action at large text sizes and omits redundant visible subtitles. Detail pages separate sections with dividers, preserve examples/readings/stroke models and use a named Japanese return link.

Approved audio uses shared normal/slow playback controls. Rejected playback keeps the exercise and offers Retry audio; an older playback failure cannot replace newer feedback. Normal replay restores speed 1.0. Native listening reports false/rejected playback, and native answer choices expose radio state. Audio approval gates are unchanged.

Test plan additions: `JapaneseLanguageBrowser.test.tsx`, `JapanesePracticeModes.test.tsx`, `QuestionnaireKinds.test.tsx`, native `design-controls.test.tsx`, and `design-japanese.regression.spec.ts` cover search, disclosure, audio recovery, review controls and 320/768/1440 px plus 200% text. Browser evidence does not certify native audio, VoiceOver/TalkBack or physical handwriting.

### Review storage recovery and detail layout

A failed web rating write keeps the recall in memory and reports that it could not be saved on this device. Retry saving writes the current snapshot without grading or counting another recall. The original rating remains disabled until the next recall. “Saved” appears only after the local write succeeds; it does not assert remote synchronization.

Native character/vocabulary details use plain sections for readings and examples, named dictionary actions and an accessible stroke-order image. Only the stroke model, handwriting and repeated destinations use frames. Font scaling remains enabled.

Regression tests in `JapaneseReview.test.tsx` deny local storage once, retry, and assert an unchanged attempt count. Native `design-controls.test.tsx` verifies stroke-model names and related-destination routing.

Native skill ratings show Loading/Saving before acknowledgment, then “saved on this device.” A failed save keeps the selected rating and offers Retry save. Retries reuse one prepared recall and reconcile a rejected write that already committed. A changed same-skill record requires Reload progress; invalid local records remain untouched. Other skill writes and late remote merges read the latest serialized local snapshot. The optional remote request does not block local practice, and a rejected sync retains the device copy.

## Test Plan

Installed `.maestro/japanese-study.yaml` uses bounded, fully visible search, result, review, deck and practice controls at normal and enlarged system text. Inspect the skill section through its heading, then return to the flashcard action before navigating; those controls need not fit in one viewport. Keep dictionary, skill, deck and writing assertions and the 20-second bound per search.

The notebook feature doc owns current core, storage, component, native, Playwright, pgTAP and physical-device checks. Preserve dictionary/path navigation, IME/review behavior, source attribution, optional account configuration and the separation between required writing and optional matching.

The Japanese hub's Axe audit and keyboard/200%-font/reduced-motion checks use separate fresh-page tests with the unchanged default deadline. The first release trace showed a roughly nineteen-second Axe scan before later layout checks exhausted the combined thirty-second budget. Preserve every assertion and the 320px viewport; keyboard traversal must focus the visible Skip to content link.

Preserve Japanese expressions, readings, translations, answer keys, and study counts during copy edits. Keep generator templates and authored lessons consistent. The N5 builder regression parses generated vocabulary tables as GFM and verifies that a literal pipe stays within its definition cell. The Japanese browser regression checks that the full definition is visible in exactly three table columns.

Hub component tests scope link queries to the character section or resource shelf to avoid scanning the full vocabulary catalog repeatedly. They verify all 46 basic katakana links, separation from sound extras, and Irodori's destination and link-only reuse label.

Native `review-persistence.test.ts`, `review-save-screen.test.tsx` and `review-route.test.tsx` pin deferred acknowledgment, retry without another attempt, commit-then-reject reconciliation, concurrent skills, stale remote merges, conflict/reload, invalid-data preservation and leaving the screen. `.maestro/skill-review-save.regression.yaml` checks acknowledged ratings, process-restart restoration and the next intentional recall. Run mobile coverage, lint/typechecks and this flow on a fresh credential-free Release; fault recovery is injected below the device layer.

Installed `.maestro/review-and-recovery.regression.yaml` covers missing-page recovery, word breakdown/examples, first-card reveal, forward/back navigation with reveal reset, and the approval-pending listening screen. These checks pass on the current credential-free Android Release; installed iOS remains open. The 650-word deck has no skill-rating save or completion action. Active audio remains unverified until approved clips exist.

## Implementation Map

| Concern | Canonical or primary implementation |
|---|---|
| Course order and stage metadata | `content/learning-paths/japanese-foundations.json` |
| Ten progressive N5 units | `content/knowledge/languages/japanese-n5-*.md`, `content/exercises/languages/japanese-n5-*.json` |
| Grammar and vocabulary catalogs | `content/languages/japanese/grammar-n5.json`, `content/languages/japanese/vocabulary.json` |
| Characters, vocabulary, 100-kanji target | `content/languages/japanese/*.json` |
| Trusted resources and rights | `content/languages/japanese/resources.json` |
| Audio source metadata | `content/languages/japanese/audio-manifest.json` |
| Audio registry preparation | `scripts/content/build-japanese-audio.ts`, generated registries under each app’s `src/generated/` |
| TTS draft generation | `scripts/content/generate-japanese-audio.ts` |
| Offline conversion | `packages/core/src/japanese-ime/index.ts`, `packages/core/src/generated/japanese-ime-dictionary.json` |
| Schema and reference validation | `packages/core/src/content/schema.ts`, `packages/core/src/content/build-index.ts` |
| Review schedule and merge | `packages/core/src/progress/mastery.ts` |
| Stage percentage and stamp eligibility | `packages/core/src/progress/progression.ts` |
| Web Japanese hub/review | `apps/web/src/components/JapaneseLanguageBrowser.tsx`, `apps/web/src/components/JapaneseReview.tsx` |
| Native Japanese hub/review | `packages/ui/src/screens.tsx`, `apps/mobile/app/languages/japanese/` |
| Authenticated mastery persistence | `apps/web/src/app/api/progress/skills/route.ts`, `apps/mobile/src/lib/skill-progress.ts`, `supabase/migrations/202608040001_create_user_skill_progress.sql` |

## Runtime Flows

```mermaid
flowchart LR
  Catalogs["Japanese catalogs, path, lessons, checkpoints"] --> Validator["Schema-v11 index validation"]
  Validator --> Index["Generated local content index"]
  Index --> Sheets["Shared 24-repetition notebook engine"]
  Sheets --> Web
  Sheets --> Native
  Index --> Web["Web Learn / Review / Dictionary / Resources"]
  Index --> Native["Expo Learn / Review / Dictionary / Resources"]
  Local["Retained anonymous mastery"] --> Merge["Validate + deterministic merge"]
  Remote[("RLS user_skill_progress")] --> Merge
  Merge --> Local
  Merge --> Batch["Batches of at most 20 rows"]
  Batch --> Remote
```

The merge uses snapshots: the newest practice timestamp determines box/state/due scheduling, while best score and attempt count take their maximum values. Neither device’s stored score or attempt count decreases. Independent concurrent attempts are not summed; that would require the per-attempt event log excluded by the privacy contract.

```mermaid
flowchart LR
  Queue["Draft transcript queue"] --> TTS["Server-only OpenAI TTS generator"]
  TTS --> Approval["Human Japanese approval"]
  Approval --> Manifest["Validated approved audio manifest"]
  Manifest --> Prep["npm run content:audio"]
  Files["Released local audio files"] --> Prep
  Prep --> WebRegistry["Browser URL registry"]
  Prep --> ExpoRegistry["Static Expo require registry"]
```

## Delivery Verification — 2026-08-04

- `npm run content:audio`: passed with zero released assets, matching the intentionally empty manifest.
- `npm run content:check`: passes after the schema version 9 progression migration.
- `npm run typecheck`, `npm run lint`, and `npm run build`: passed.
- Vitest: 38 files and 190 tests passed.
- Native Jest: 2 suites and 10 tests passed.
- Japanese Playwright regression and accessibility regression: passed.
- Full Playwright smoke run: 15 tests passed.
- Expo Doctor: 20/20 checks passed.
- iPad native compilation remains blocked by the local Xcode version described below; this is not recorded as a successful simulator build.

## Review Rating Follow-Up — 2026-08-08

- Added non-color selected feedback, `aria-pressed`/native selected semantics, a saved announcement, per-rating scheduling hints, and an explicit `Practice again` action.
- Added synchronous repeat-tap guards on web and Expo so one recall produces exactly one progress update.
- Added regression coverage for selection, disabling/resetting, repeat taps, delayed remote snapshot merging, and the browser journey.
- Kept `/review` focused on its due-skill queue by removing flashcard launchers from both web and Expo review screens. Review screens must not expose flashcard or audio-practice launchers unless those modes gain substantive, review-specific content under a future documented contract.

## N5 Expansion Verification — 2026-08-09

- Schema v10 content validation passes with exactly 650 published N5-aligned vocabulary entries, 60 published grammar patterns, ten mixed quizzes, ten open-answer drills, and ten draft listening sessions.
- `content:audio:generate -- --dry-run` reports 710 clips and performs no billable generation; `content:audio` exports zero because no draft has human approval.
- Full Vitest/per-file coverage and Expo Jest coverage pass. Lint, typecheck, production build, Expo Doctor, the Japanese Playwright regression, and the full smoke lane pass.
- The database lane was not applicable to this local-first change and could not connect because the optional local Supabase stack was stopped. No schema migration or persisted-user-data behavior changed.
- The Maestro journey now includes the review flashcard and writing routes. Device execution, Apple Pencil Scribble, VoiceOver/Larger Text, Japanese pronunciation, and the remaining kanji stroke-path review stay manual release checks.

## Known Gaps

- The 710 queued audio records are drafts. Listening routes intentionally remain unlisted until a Japanese speaker approves their generated MP3s.
- The 75 newly declared kanji profiles need original stroke paths and contextual exercises before publication.
- Signed-in mastery sync is shipped through the additive skill-progress API, with anonymous mastery retained locally until every bounded sync batch succeeds. Checkpoint-derived automatic stamp rendering is the next persistence/UI slice; existing completion records and local mastery remain preserved.
- Original illustrated scene assets, animation celebrations, haptics, and animated stroke demonstrations remain v2 work; reduced-motion/static-equivalent requirements already govern that future work.
- Manual VoiceOver/Larger Text QA remains. The iPad build reached native compilation, but local Xcode 26.3 is below Expo SDK 57's documented Xcode 26.4+ baseline and fails inside ExpoModulesJSI; rerun after the toolchain upgrade.

## Decision Log

- `2026-08-09`: Add schema-v10 N5 catalogs, original quizzes, local JMdict-backed conversion, open-answer composition, Pencil Scribble input, and approval-gated OpenAI TTS. Treat writing as supplemental because JLPT N5 does not test composition.

- `2026-08-08`: Apply forgiving grading to final free-mode attempts as well as assisted traces; retain stroke-count and broad order/direction checks rather than requiring precise placement.
- `2026-08-08`: Lower assisted-stroke similarity gating and include the web pointer-release coordinate so beginner traces can advance without requiring near-pixel-perfect input.
- `2026-08-08`: Keep review routes scoped to due-skill recall. Standalone flashcards remain discoverable from the Japanese hub and path, while audio practice stays unlisted until real recordings and meaningful exercises ship.
- `2026-08-08`: Treat one rating as one recall attempt. Keep the selected choice visible and locked until the learner explicitly chooses `Practice again`.
- `2026-08-04`: Adopt JF/CEFR stages with friendly stamp names and keep all content open.
- `2026-08-04`: Add mastery additively rather than changing or deleting completion history.
- `2026-08-04`: Keep public third-party materials link-only unless redistribution rights are explicit.
- `2026-08-04`: Ship audio validation and preparation before recordings; never substitute synthetic or unlicensed media for the promised native-speaker corpus.

The native device pass compacts selected notebook headers and places feedback immediately above the paper. Automatic ScrollView interception and handwriting-route swipe-back are blocked so vertical and rightward strokes remain ink. The new native layout/contact regressions and deferred physical Pencil steps are documented in [Japanese writing notebooks](japanese-writing-notebooks.md). Shape-grading thresholds are unchanged.
