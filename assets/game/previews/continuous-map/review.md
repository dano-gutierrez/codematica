# Continuous campaign map: art and UX review

Reviewed with the `improve-game-ux` skill on October 3, 2026. Inputs: actual 412px phone and 1440px desktop web screenshots, complete terrain contact sheet, renderer/export code. The established painterly 2.5D style is the review baseline; pixel-specific criteria are interpreted as consistent painted scale, edges and material transitions. Animation timing is **not assessed**; its score reflects still implications and the three depth compositions. The locally captured scrolling video is evidence for later motion review, not proof of physical-device FPS.

## First review

**Score: 73/100**

- Art cohesion: **17/20**. The city, woodland and summit share stone, amber lighting and muted teal foliage.
- Terrain craft: **6/15**. Chapter blending extrapolates boundary rows into long streaks; inner scrolling exposes blank strips.
- World composition: **11/15**. The walking route is legible, but the blank endings interrupt the climb.
- Characters: **13/15**. Patch's existing chibi identity and crew scale are preserved; this pass changes scenery.
- Animation: **10/15, not assessed**. Separate overlay depths are visible in stills; cadence and feel require motion review.
- Variety and life: **8/10**. Pumps, greenhouses, woodland platforms and crystal terraces add distinct landmarks.
- UI: **8/10**. Cream level labels read clearly, but the dotted route continues beyond the last node.

### Top fixes

1. **Problem:** a blank strip appears below the garden and above the canal after automatic centering.
   **Why:** `scrollIntoView` scrolls inside the district's hidden overflow, moving all its children.
   **Fix:** use clip overflow for world/district/scenery; assert zero district scroll and matching parent/scenery geometry in a browser.
   **Expected gain:** terrain +3, composition +1.
2. **Problem:** the highlands/city chapter join stretches buildings into vertical stripes.
   **Why:** repeated boundary rows destroy masonry and vegetation silhouettes.
   **Fix:** crossfade aligned overlapping source rows, assemble once, then cut shared-guard tiles. Verify every adjacent guard is pixel-identical.
   **Expected gain:** terrain +4, composition +1.
3. **Problem:** the dotted route hangs below Courtyard Defense into the workshop margin.
   **Why:** it implies another destination outside the campaign terrain.
   **Fix:** hide the final connector in each authored district.
   **Expected gain:** UI +1.
4. **Problem:** the same densely compressed foliage border appears every panel.
   **Why:** it exposes the modular construction and crowds the central route.
   **Fix:** export three separate crops from the tall transparent master; retain the clear center, preload nearby terrain, and freeze all overlay depths for reduced motion.
   **Expected gain:** variety +1, animation implications +1.

### Do NOT touch

- Patch and the existing zombie silhouettes, palette and rigs.
- Cream pills, large level hit targets, ordinary accessible controls and the list option.
- The twelve authored levels, their hints, solutions, awards and unlock rules.

### Next review checks

- Center and scroll through garden/canal/tower plus all three chapter joins without blank strips or stretched rows.
- Read labels at phone size and compare three depth offsets; toggle reduced motion during the session.
- Confirm exactly fifty art positions and only twelve playable controls; inspect the complete terrain for repetition.

## Follow-up review

**Score: 85/100 (+12)**

- Art cohesion: **17/20**. Side scenery, foreground leaves and warm motes share the existing material palette.
- Terrain craft: **13/15**. All eleven tile boundaries share identical pixels; chapter joins retain recognizable terrain. Some overlap areas still soften masonry.
- World composition: **13/15**. A continuous quiet route climbs through side landmarks; future territory has return controls.
- Characters: **13/15**. Existing characters and gameplay scenes retain their established identity.
- Animation: **11/15, not assessed**. Three restrained depths read clearly, terrain stays fixed, and reduced motion removes transforms. Device cadence remains unverified.
- Variety and life: **9/10**. Woodland, glasshouse and summit landmarks extend the campaign without repeating a district painting.
- UI: **9/10**. Nodes remain above scenery, dangling connectors are gone, and the list is visually ascending.

### Delta

All four first-review fixes are implemented. Nearby terrain now preloads, visible-neighbor decoding is part of capture, and offscreen overlay updates stop. Centering no longer scrolls a district internally. The shorter map's saved offsets are discarded once through a versioned session key; switching to the list retains the preceding map offset. Native uses measured positions and the same bounded offsets without modulo jumps. No visual regression was identified in the captured phone or wide view; installed native appearance has not been assessed in this pass.

### Remaining improvements, in priority order

1. **Problem:** masonry at the three painting overlaps is softer than the uninterrupted districts.
   **Why:** an overlap can blend two distinct stones, even with exact tile continuity.
   **Next fix:** hand-author dedicated transition paintings when developing those chapters, using the adjoining stone courses and route width as constraints.
   **Potential gain:** terrain +1–2.
2. **Problem:** parallax cadence has no current installed-device measurement.
   **Why:** browser screenshots, Jest and Metro exports cannot establish native frame pacing.
   **Next fix:** record the same climb on installed Android/iOS builds; profile texture residency and UI-thread frame intervals before release.
   **Potential gain:** animation assessment, not an assumed score increase.

### Do NOT touch

Keep the fixed terrain/shared guard export contract, three restrained overlay families, empty centers, twelve-level progression and accessible list. Future scenery must remain a preview until real scenarios are authored.

### Next review checks

- Run installed Android/iOS reduced-motion and long-scroll journeys, including background/return.
- Inspect the three overlap regions at native device scale before authoring more levels.
- Measure physical-device texture residency and frame pacing; reduce effects without changing gameplay.

## Evidence and reproduction

- [First phone capture](initial-phone.png), [first canal capture](initial-canal.png), [first chapter join](initial-join.png).
- [Final phone](final-phone.png), [final canal](final-canal.png), [final chapter join](final-join.png), [summit preview](final-summit.png), [wide view](final-wide.png), [reduced motion](final-reduced.png).
- [Complete continuous terrain](terrain-contact-sheet.png).
- Run `node scripts/game/capture-map-art.mjs <preview-url>`. Motion recording and validation logs live in ignored `test-results/map-art/`.

Validation includes shared panel/offset tests, decoded guard comparisons, exact public copies, web centering/scroll/list/keyboard/reduced-motion regressions, native derived-depth/container/preference tests, both aggregate coverage gates, production artifact texture checks and both Metro export asset checks. Installed-device and physical-performance evidence remain pending. Exact imagegen prompts are in `assets/game/source/map/prompts-v1.json`.
