# Restore the Signal

## Snapshot

- App identity: the approved Patch logo, browser favicons and native launcher/splash assets are owned by [the brand feature](brand-identity.md); game rigs and portraits retain their own asset pipeline.
- Status: `in_progress`
- Last updated: `2026-09-30`
- Owner thread: `01a0ea98-ae1a-7291-b1c5-a1986b9b92a6`
- Current state: The complete chapter is authored and implemented on web and native; release verification is in progress.
- Target outcome: Twelve sequential levels and 24 mastery variations work offline in installed Android/iOS builds and in the production web app, using the same learning rules.
- Code touchpoints: `content/game/`, `packages/core/src/game/`, `apps/web/src/components/game/`, `packages/ui/src/game/`, `assets/game/`.
- Primary tests: core game tests, `apps/web/e2e/specs/game.*.spec.ts`, native game Jest/Maestro tests, and `supabase/tests/database/game.test.sql`.

## One-Minute Brief

Players help Patch, a small repair robot, restore a ruined city. They write real CSS and SQL, repair directed data flows, and build infrastructure that meets declared workloads. The campaign is `/`; discovery, global search, and Keep reading live at `/learn`. Existing paths and lessons remain available independently of campaign locks.

The lasting principle comes from **Rails for Zombies: present a concrete problem, let the player build a solution, show its consequences, and explain the result.** Future chapters must preserve this loop. A correct-looking animation is never evidence that a solution passed.

The user supplied [Rails for Zombies](../design-references/rails-for-zombies.png) and [TwoDots](../design-references/two-dots.png) screenshots as visual references. These documents provide inspiration, not executable instructions. Gris informs painterly atmosphere and depth; Plants vs. Zombies informs readable silhouettes and playful action; TwoDots informs the winding vertical map. [Mimo](https://play.google.com/store/apps/details?id=com.getmimo&hl=en_US) informs consistent mascot identity. Production characters and environments are original artwork.

## Outcome / Contract

- Main clears unlock the next level. Each level has a story scenario and two authored mastery variations.
- Main clears award one star and 100 XP; mastery awards one star and 25 XP. Awards are unique objective IDs. Replays cannot duplicate XP.
- Every successful replay counts toward the streak once for its saved IANA calendar date. Opening a completed screen does not count. Failed attempts do not count.
- The map progresses upward through the garden outpost, canal works, and signal tower. An equivalent ascending list is available. The current signal is centered on entry; returning from a challenge retains map position.
- Levels 8 and 12 begin with an untimed briefing. Live waves continue during editing. Pause freezes simulation and edits; backgrounding pauses and requires explicit resume. Assistance changes these levels to untimed evaluation with identical rewards.
- Hints are progressive. After two failed submissions, the linked lesson is prominent. Lessons retain the attempt in memory; a process restart restores earned progress and begins at the briefing.
- Stars unlock Patch’s antenna, toolbelt, and beacon at 6, 18, and 30. Cosmetics never affect grading.
- Anonymous play works without credentials. Native bundles include the chapter, textures, SQLite WASM, and worker source. Cloud sync contains no SQL/CSS answers or attempt history.

## Current State

The complete chapter is implemented on web and native. All 36 authored solutions pass in the production browser build. The current game browser lane passes 57 tests, including both live defenses, pause/background, lesson return, keyboard movement, reduced motion, and CSS/SQLite on Chromium and WebKit. After the miniature refinement, core/web coverage passes 364 tests; native Jest coverage passes 74 tests. Coverage floors are preserved.

The release Android APK builds and installs. The original chapter verification passed Expo Doctor 20/20; the mascot pass now reports 19/20 because Expo recommends three newer patches (`expo` 57.0.26, `expo-constants` 57.0.20, `expo-router` 57.0.24). This art change does not alter dependency versions. An independent installed-app check on an Android API 35 ARM64 emulator passes all 36 scenarios offline, including real CSS/SQLite, touch connections, both story defenses live, pause/background/resume, and earned progress across process restarts. Defense mastery scenarios pass in assisted untimed mode. The final saved map shows 36/36 stars and 1,800 XP. Logs, screenshots, the independent check scripts, and a verification summary are retained under `test-results/game-verification/` and `test-results/android-installed-game/`. Maestro 2.8.0 fails before app interaction with DADB transport errors (`device offline` / `device not found`), matching the [upstream issue](https://github.com/mobile-dev-inc/maestro/issues/3451). Its failure reports are retained; the independent check does not close the Maestro release gate.

Production pruning is verified in a disposable install using the actual manifests and Next configuration. HTTP readiness, every district layer, real CSS, and local SQLite pass. The APK check matches decoded texture pixels despite Android resource renaming and verifies embedded worker/WASM bytes. The isolated database migration replay and all 45 pgTAP assertions pass. Final Android/iOS exports include the shared assets and local runner.

The mascot refinement was verified separately: reproducible atlas/thumbnail exports, lint, typecheck, content checks, both coverage suites, production web and Android builds, and four browser smoke/accessibility tests pass. The pruned web artifact serves all 32 thumbnail files; the rebuilt APK contains the revised atlas. Patch and all three enemies were visually checked in the production browser and installed Android API 35 app. The refreshed contact sheet and character kit are saved under `assets/game/previews/`; logs and the installed screenshot are in `test-results/mascot-refinement/`. The full 36-scenario installed journey above predates this art-only refinement.

The September 30 miniature pass adds successful all-level 320px scene captures, reduced-motion pixel stability and resize checks, shared pose bounds for every state/cosmetic, and native measured-container transforms. The updated production web and Android APK build and pass the pruned artifact check, including all transparent miniature exports and the revised atlas. The installed Android app shows the same miniature proportions as web; offline CSS/SQL clears, unlocks and successful expression/opacity changes pass. Evidence is retained under `test-results/miniatures/`. The Maestro CLI is unavailable in this session; the updated smoke flow still requires its device lane.

Installed iOS remains unverified: a fresh Release simulator build fails in ExpoModulesJSI’s `RuntimeScheduler.h` because the compiler rejects its `SWIFT_RETURNS_RETAINED` annotations. This host has Xcode 26.3, below the repository’s documented Expo SDK 57 Xcode 26.4 baseline. The build log is retained under `test-results/game-verification/`; rerun with the supported toolchain. Export and Jest success do not prove installed iOS behavior. Representative physical-device 60 FPS profiling and the complete Android/iOS Maestro lanes remain release requirements.

No production deployment, store submission, hosted migration, or live-data mutation is part of this change.

## Scope

### In Scope

The first chapter, its original asset kit, editable rigs/timelines, local execution, accessible controls, deterministic teaching simulator, optional progress sync, source lessons, and regression lanes.

### Out Of Scope

Multiplayer, leaderboards, purchases, live AI grading, and real-time 3D.

### Assumptions

Simulation capacities are authored teaching assumptions, not production benchmarks. The simulator explicitly models a single client ingress, one balancer tier, API instances, cache-aside, and one selected database tier. It does not infer database replication from multiple database nodes. Population is narrative context; request rate, reuse, freshness, capacity, health, and cost determine success.

## Detailed Behavior

### Chapter

| Level | Mechanic | Main learning objective | Mastery progression |
| --- | --- | --- | --- |
| 1 Courtyard Defense | CSS Grid | Column boundaries | Different target columns |
| 2 Target Lock | SQLite | SELECT and WHERE | Zone predicates, inclusive threat thresholds |
| 3 Open the Gate | Pipes | Request and response | Proxy forwarding/return; audit receipt separated from request |
| 4 First Outpost | System design | Small workload and budget | Small-population availability; burst requiring more API capacity |
| 5 Crossfire | CSS Grid | Rows and spans | Shifted multi-tile targets with protected survivors |
| 6 Threat Scanner | SQLite | Compound conditions | Precedence, explicit null handling |
| 7 Cache Canal | Pipes | Hit, miss, population | Invalidation after a write; invalidate the correct keys |
| 8 Bridge Siege | Live system design | Healthy load distribution | Unequal capacities; simultaneous service failures |
| 9 Rooftop Relay | CSS Grid | Responsive track proportions | Different proportions at 300px and 600px |
| 10 Mixed Horde | SQLite | Join zone evacuation data | Different threat thresholds and target datasets |
| 11 Command Loop | Pipes | Commands and rendering settle | Two editable views; passive status subscriber |
| 12 Restore the Signal | Live system design | Scaling, cache reuse, freshness | Lower reuse and stronger storage; cache outage and fallback capacity |

Each JSON scenario includes an authoring solution for deterministic verification. Runtime evaluators compare resulting behavior, geometry, or returned IDs, not the authored answer string. A solution that satisfies requirements passes even when it omits the author’s chosen optional components.

### UI / UX

Phone navigation is Play, Learn, Paths, Practice, More. More and the desktop/iPad sidebar retain Interviews, Lessons, Languages, and sign-in. Instructions, editors, buttons, results, and navigation use normal accessible UI; canvas contains decorative scenery and actors. Interactive controls have at least 44px/pt targets. Architecture pieces can be arranged by pointer/drag and by tap; web arrow keys move focused components. Tapping two components connects them. Every connection also has a textual removal control.

Ten levels are untimed. Live levels have three eight-second authored waves, seeded sub-second-independent traffic samples, integrity feedback, and unlimited retries. Simulation advances in whole logical seconds; rendering frame rate cannot alter its results. A failed final scenario remains a failed defense even if some integrity is left. Assistance evaluates the base workload and every authored failure wave without a clock.

The target grid is visible before submission. SQL datasets are visible beside the editor. The two-second SQL worker limit includes SQLite initialization; the UI has a separate ten-second runner watchdog. Every level links to a specific local introductory lesson or existing caching material. External source links remain available within the lesson renderer.

### Data Model And Persistence

`content/game/*.json` is canonical. The generated content index is schema version 11 and adds `gameCampaigns`. `GameCampaign` defines ordered levels and districts with landmark references. `GameLevel` owns scenarios, objectives, hints, scene references, restoration details, and lessons. `GameSession` owns transient code, graph input, editing state, logical clock, results, and a single consumable completion event. `EvaluationResult` supplies reasons, textual events, and metrics. Renderer-independent animation types and poses live in core.

`GameProgress` stores unique earned objective IDs and their original completion mode/date, successful calendar dates, an IANA timezone, and the selected cosmetic. Stars, XP, unlocks, and restoration derive from awards. A streak includes today or yesterday and walks back through consecutive dates; a missed day resets it without deleting rewards. Locale time is converted to dates before streak arithmetic, including DST boundaries.

Local writes are serialized. Account caches use separate keys. The anonymous buffer is claimed by one signed-in account; switching accounts cannot upload the prior account’s cached awards. In-flight requests include the expected account identity. Malformed/newer persisted bytes are backed up before replacement; storage failure keeps the active snapshot in memory.

The additive migration creates `user_game_awards`, `user_game_activity_days`, and `user_game_preferences`. Owner-only SELECT RLS plus authenticated merge RPCs prevent direct unvalidated writes. A per-account transaction lock serializes concurrent merges. Awards and days merge by union; the earliest award timestamp/mode survives replay. The first cloud timezone is retained. Cosmetic preferences use the newest preference timestamp. Retry never removes an earned record. These are learning records, not tamper-proof competitive rewards.

### Business Logic

- **CSS:** css-tree parses an allowlisted declaration list. Controlled grid and net elements are laid out by the browser; tracks must remain visible within the container. Geometry is measured directly, because WebKit can suspend animation callbacks in offscreen iframes; rectangles, protected cells, and authored responsive proportions determine success. Declarations cannot add external resources or arbitrary rules.
- **SQL:** sqlite-parser validates one SELECT in the chapter subset. Functions, CTEs, other tables, and write statements are rejected. Pinned sql.js runs inside a disposable, terminable worker with its WASM embedded locally. Fixtures use bound parameters; results are limited to 256 rows. Distinct returned numeric `id` values must equal the expected targets. Joins, aliases, parentheses, ordering, and equivalent predicates are accepted.
- **Pipes:** ports are typed and directed. Each authored event follows its output/input hops. Missing or misdirected delivery identifies the stopped hop. Warm hits and cold misses are separate traces. Write invalidation targets specific keys. Rendering cannot route into the echo adapter.
- **Systems:** routes determine actual reachable instances. Round robin splits equally; capacity-weighted routing handles unequal instances. Only a live balancer with health checks removes failed APIs. Per-instance offered load determines queue growth and modeled latency. Cache operations include lookup, population, and invalidation; misses/writes reach storage. Cache failure falls back to the database. Budget, latency, capacity, freshness, and declared availability all must pass.

A small population can justify a balancer for availability. A large workload can pass without caching if provisioned storage meets its traffic and budget. This is consistent with [load-balancing fundamentals](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html) and [cache-aside’s reuse/consistency tradeoffs](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).

### Art And Animation

The September 30 clarification makes the small figures inside each level the primary miniature artwork. The [in-level miniature sheet](../../assets/game/previews/miniatures-v3.png) shows chibi proportions, stronger face/outline readability, short limbs and distinct enemy silhouettes. Rig v3 and the updated SVGs are used by the actual game renderers. Transparent full-body PNGs at 48/64/96/128px are exported separately from the square portrait icons.

`packages/core/src/game/miniatures.ts` shares layer order, container fitting, animation transforms, contact shadows and success opacity across Pixi and Skia. Both measure the scene container, fit a centered 360×180 composition, and keep Patch close to the enemies’ scale. Initial paused rendering, resize while paused/reduced, and live reduced-motion changes redraw without advancing the animation clock. Paused defense retains its attack pose. Reference games are linked in the asset guide.

The September 29 mascot refinement uses the existing Patch concept sheet as its identity reference. The new [character lineup](../../assets/game/source/characters/lineup-v2.png) and [thumbnail kit](../../assets/game/previews/character-kit-v2.png) define Patch and the three enemy identities. Patch retains cream enamel, an amber-eye teal faceplate, orange fittings, dark joints and pincers. The zombies share its softly shaded, weathered materials while keeping distinct green faces, clothing and silhouettes. Exact built-in imagegen prompts are stored with the art sources.

Four square portrait masters export to PNG/WebP at 64, 128, 256 and 512 pixels through `game:assets`. Rounded-square masks are preferred; backgrounds are opaque and no UI labels are baked in. The manifest includes character names and alt text. These portraits are ready for UI use; installed-game rendering continues to use the shared atlas. SVG production layers, six expressions, enemy sprites and cosmetic art were refined; rig v3 adjusts attachment locations and chibi proportions while retaining the existing animation timelines and simulation behavior.

`assets/game/source/` retains generated painted backgrounds, Patch’s model/expression exploration, editable SVG character parts, six face expressions, three zombie silhouettes, attachments, infrastructure, markers, and effects. Environment layers live under `source/environments/`. Restored overlays add lights and repaired landmarks; partial clears gradually illuminate intermediate details. See the asset README for provenance and prompts.

`patch-rig.json` owns pivots, attachment locations, and keyframes. `AnimationController` supports transition, pause/resume, seek, speed, loop, and attachments. Web uses PixiJS scene objects. Native uses Skia atlases and Reanimated transforms. Both sample the same authored timelines. Initial states are idle, walk, work, attack, reaction, recovery, and celebration. Neither renderer can award success from animation callbacks.

`npm run game:assets` exports the atlas, manifest, district backgrounds, and transparent layers. `npm run game:runtime` bundles the local SQLite worker and dependency notices for both platforms. `npm run game:flows` exports the 36-scenario native journey. The [contact sheet](../../assets/game/previews/contact-sheet.png) combines actual map, coding, and defense scenes. These outputs are committed and must be reproducible. Scenery is loaded by district; offscreen/decorative activity is stopped. Reduced motion disables parallax and decorative movement while retaining outcomes and text. Simulated population is independent of the capped visible actors.

### Failure And Edge Handling

Locked routes explain the preceding clear requirement. Missing graphics do not disable the text editor or grading. Parser errors and timed-out workers produce retryable results. Lesson navigation pauses live attempts; returning never resumes automatically. Process restarts preserve rewards, not code drafts. Cloud failures keep local progress available for retry. Existing learning-path locks/progress are unaffected.

## Code Touchpoints

- `packages/core/src/game/schema.ts`: authored data boundaries.
- `packages/core/src/game/{engine,session,progress,store}.ts`: grading, clock, rewards, and local/remote merge.
- `packages/core/src/game/{sandbox,html}.ts`: structural input validation and shared sandbox document.
- `packages/core/src/game/animation.ts`: pure shared pose sampling and animation controller.
- `scripts/game/`: deterministic atlas/worker/journey exports, contact-sheet capture, and artifact checks.
- `apps/mobile/plugins/with-shared-bundle-inputs.cjs`: Gradle cache inputs for shared UI, core, and assets.
- `apps/web/src/components/game/`: map, scene, editable board, and level UI.
- `packages/ui/src/game/`: native UI, Skia atlas, and district scenery.
- `apps/web/src/app/api/progress/game/route.ts`: account-bound progress API.
- `supabase/migrations/202609290001_create_game_progress.sql`: additive tables, RLS, and merge RPCs.

## Test Plan

Core tests began with failing evaluator/progression contracts. Regression tests also precede account-isolation, single-consumption completion events, unequal load, unavailable balancers, cache capacity, and animation controls. No coverage floor is lowered and no authored game source is excluded from coverage.

- Unit: alternative/wrong solutions; every authored system and pipe variation; deterministic traffic and poses; pause/edit guards; reward replay; DST; account switches; malformed storage; bounded CSS/SQL.
- Integration: schema-v11 generation and references; disposable SQLite runner; actual CSS geometry; API authentication/validation/error handling; asset reproducibility.
- Miniature regression: shared geometry stays inside 240–900px containers for all seven states and every cosmetic; renderers apply the same transforms. Browser coverage captures the crew in all twelve levels at 320px, checks reduced-motion pixel stability and resize; native Jest verifies measured-container transforms and success opacity. Maestro smoke asserts the scene is present.
- Art exports: `scripts/game/assets.test.ts` verifies rig/frame compatibility, transparent nonempty sprites, four portrait identities, every thumbnail size, and exact web copies. `game:check` includes nested thumbnail outputs; the production artifact smoke check serves and validates each variant.
- Web: `game.smoke.spec.ts` first clear and persisted unlock; `game.regression.spec.ts` all 36 scenarios, help return, wrong queries, live pause/background, keyboard, reduced motion.
- Native: Jest shared screens/store/renderer adapters and Android/iOS Maestro touch, keyboard, offline, background/resume, and completion journeys. A bundle export alone does not satisfy the installed-app gate.
- Database: clean migration replay and transactional pgTAP union, duplicate, ordering, account/RLS, malformed-payload, and cosmetic tests.
- Packaging: final production web with production dependencies; APK/iOS bundle texture, worker, and WASM presence; retained CI artifact smoke checks.
- Performance: representative devices target 60 FPS. Reduce decorative activity when needed without changing simulation results. Record measured device/frame evidence before release.

Commands: `npm run game:runtime`, `npm run game:assets`, `npm run content:check`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run mobile:doctor`, `npm run test:db`, `npm run build`, and the browser/device regression lanes. Preserve failed-run reports and traces.

## Open Questions

Release verification still requires the supported iOS toolchain, a working Maestro Android transport, both full installed-device journeys, and physical-device performance measurements. Final verification evidence belongs here before changing status to shipped.

## Decision Log

- 2026-09-30: Interpret thumbnails as in-level full-body chibi miniatures; preserve the earlier portrait kit separately and share scene geometry between renderers.
- 2026-09-29: Implement the user-approved twelve-level plan with 2.5D artwork and Patch; retain Rails for Zombies as the teaching principle.
- 2026-09-29: Use a bounded authored teaching simulator with explicit routing/freshness assumptions. Population alone never prescribes a topology.
- 2026-09-29: Keep local answers transient; make awards idempotent and account scoped. A consumed completion event prevents revisiting a win screen from manufacturing streak activity.

## Documentation Updates

Docs hub, context guide, engineering flow, navigation/discovery/auth contracts, component inventory, owning READMEs, and changelog track the chapter. The source asset directory and `content/game/` are authoring surfaces; generated outputs are not.

## Thread Handoff Prompt

Read `docs/codex-context.md` and `docs/features/restore-the-signal.md`. Verify the game tests and final artifacts against the contract, complete any documented release gates, retain failure evidence, and update current-state claims before calling the chapter shipped.
