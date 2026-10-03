# Restore the Signal artwork

Original Codematica art for Patch and the first chapter. Source files remain editable. Generated outputs are committed for offline native builds.

- `source/{garden,canal,tower}.png`: original painted district backgrounds generated with the ImageGen skill on 2026-09-29.
- `source/patch-model-sheet.png`: Patch proportions and expression concept exploration.
- `source/characters/lineup-v2.png`: refined Patch, Shambler, Runner and Armored identity reference; exact built-in imagegen prompts are in `source/characters/prompts-v2.json`.
- `source/portraits/`: four original square portrait masters. These are the thumbnail artwork, with quiet backgrounds and no baked-in labels or corner masks.
- `source/*.svg`: production character parts, six expressions, shambler/runner/armored silhouettes, attachments, devices, markers, and effects.
- `source/patch-rig.json`: pivots, layer order, attachment anchors, and seven animation timelines. Frame channels are explicitly named in the file.
- `source/environments/`: editable middle/foreground silhouettes and restored machinery/light overlays.
- `previews/`: captured map, coding and defense scenes plus an HTML/PNG contact sheet; regenerate against a built production preview with `scripts/game/capture-contact-sheet.mjs`.
- `generated/`: reproducible atlas, Pixi-compatible manifest, and district WebP exports. Do not edit these by hand.
- `generated/miniatures/`: transparent full-body PNGs at 48, 64, 96 and 128 pixels, sampled from the actual shared idle pose. These are the in-level character miniatures.
- `generated/thumbnails/`: PNG and WebP portraits at 64, 128, 256 and 512 pixels, plus a manifest with names and alt text. The same files are copied to `apps/web/public/game/thumbnails/`; PNG variants are ready for static native imports when a UI consumes them.

Run `npm run game:assets` from the repository root. The same atlas is consumed by PixiJS and native Skia. Export uses pinned Sharp. Keep stable frame names; the manifest maps names to rectangles so atlas packing changes do not change rig definitions.

Run `npm run game:character-preview` after exporting to rebuild the [character kit](previews/character-kit-v2.png). It shows the four portraits at large and small sizes and the actual editable game characters. `npm run game:check` covers nested thumbnail exports as well as the atlas and workers.

## In-level miniatures

The September 30 correction defines “thumbnail” as the small full-body figures inside each level. Production SVGs now use chibi proportions: large faces, short limbs, thicker outlines and larger eyes. Patch and the enemies share a ground line, contact shadows and comparable visible heights. Portrait icons remain a separate asset category.

`packages/core/src/game/miniatures.ts` supplies the same frame order, positions, poses and success opacity to Pixi and Skia. Each scene measures its own container and fits a centered 360×180 composition; figures do not grow with a desktop window. Reduced motion retains static expressions, resize updates and readable outcomes. Paused scenes still render their initial placement and cosmetic changes.

Run `npm run game:miniature-preview -- http://127.0.0.1:3128` against a finished production build to regenerate the [miniature sheet](previews/miniatures-v3.png). It shows full-body figures at 32/48/64/96px display sizes and captures the real phone and wide game scenes. `game:assets` also exports their transparent PNGs under `generated/miniatures/`.

Visual references: [Link’s Awakening](https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/The-Legend-of-Zelda-Link-s-Awakening-1514327.html) and [World of Final Fantasy](https://www.jp.square-enix.com/WOFF/sp/character/). Our interpretation uses their readable miniature proportions while preserving the original Patch and zombie identities. No reference-game artwork is included.

## Character identity and portrait treatment

The original Patch concept sheet remains the identity anchor. The game artwork uses a cream enamel shell, deep teal faceplate, two amber light eyes, orange fittings, dark articulated joints, a belly maintenance hatch and pincers. A short stock antenna is part of the silhouette; the earned antenna is an additional receiver attachment. Six face expressions and all seven animation timelines remain available. Rig v3 shortens the torso and limbs, enlarges the head, and adjusts cosmetic anchors for the in-level silhouette.

The enemies share warm outlines, soft shading and visibly repaired materials. Their skin and exposed faces distinguish them from Patch:

- **Shambler:** rounded head, sleepy uneven eyes, ochre scarf and patched teal work jacket.
- **Runner:** narrower head, swept tuft, orange hooded vest and a springy stance.
- **Armored:** broad silhouette, exposed green face, cream/orange helmet and salvaged plates.

Use rounded-square thumbnail masks, with roughly 24% corner radius. Keep the unmasked square masters so UI can choose its own crop. Preserve the face and eyes at small sizes; use the 128px export for a 64pt control on a 2x display. The portrait backgrounds are intentionally opaque. Raster portraits provide painted identity artwork; editable SVG parts provide the small animated game characters. The thumbnail kit does not replace store icons or change gameplay rules.

The lineup and portraits were generated with the built-in imagegen tool, using the existing Patch sheet and then the resulting lineup as references. SVG production parts were refined directly to retain editable geometry, pivots and rig control. Full prompt text and output paths are retained in `source/characters/prompts-v2.json`.

The refined atlas was visually checked in the production web app and an installed Android API 35 release build. Portraits were inspected at 32, 48 and 64px display sizes. Automated checks cover every export dimension, atlas compatibility, byte-identical web copies, reproducibility, and pruned production packaging. The [feature contract](../../docs/features/restore-the-signal.md) records current verification and native release gaps.

## Generation prompts

The painted assets were generated as original portrait 2:3 game scenery with no text, UI, or existing characters. Garden: an overgrown courtyard outpost, soft sage vegetation, warm maintenance lights, a clear winding path and layered ruins. Canal: misty blue/teal waterways, old pump machinery, bridges and warm lamps, with a clear central route. Tower: a dusk lavender signal tower with ruined roofs, warm circuitry and a route climbing toward a quiet beacon. Shared direction: painterly 2.5D, readable foreground shapes, depth through silhouettes and mist, no gore.

Patch’s model sheet prompt described an original compact cream/orange/teal maintenance robot, front/side/three-quarter views, six expressive face displays, articulated arms, repair tools, and antenna/toolbelt/beacon attachments. Production SVG parts and explicit timelines interpret that concept as controllable artwork; the concept raster is not an animation rig.

Reference screenshots in `docs/design-references/` are for design discussion only and are not bundled as production game art. The asset kit contains no copied game characters or textures. Third-party runtime licenses belong to their packages (`pixi.js`, Skia, Reanimated, sql.js, and their bundled SQLite notices).
