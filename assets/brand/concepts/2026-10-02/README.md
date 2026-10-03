# Logo and favicon directions — October 2, 2026

Status: refined direction approved for use on October 2, 2026. The user chose option 1's simpler large icon and option 5's medium icon and freestanding favicon. The six original directions remain below for reference.

## Selected refinement

[Open the refined board](05-outpost-refined-v2.png). The large icon is now a simple Patch head inspired by option 1, with the circular badge, wrench and heavy distressing removed. Option 5's medium icon, freestanding favicon and lettering are retained as the design references. The original boards remain untouched.

This is an ivory-backed presentation board. Production exports now have real transparency and have been inspected at browser sizes; see the [production asset guide](../../README.md). The generated revision was visually checked for the simplified main silhouette, retained right-side icon designs, and correct Codematica lettering.

[refinement-v2.json](refinement-v2.json) records the exact built-in imagegen edit prompt and input roles. The original six prompts remain in `prompts.json`.

## Original directions

| Option | Direction | What to compare |
| --- | --- | --- |
| 1 | Flat Patch | Clean geometry, friendly face, bold silhouette |
| 2 | Clay Companion | Soft sculptural surfaces and a toy-like mascot |
| 3 | Pixel Signal | Deliberate pixel clusters and retro game typography |
| 4 | Paper Garden | Layered paper shapes and crafted storybook warmth |
| 5 | Outpost Stamp | Screenprinted repair-workshop badge and slab lettering |
| 6 | Circuit Monogram | Minimal C/robot symbol and technical typography |

Open `comparison.png` for the overview or `gallery.html` for larger individual boards. Individual PNGs are named with their option number. The favicon studies communicate the direction; they are not final `.ico` files or verified pixel-hinted 16px assets.

Rebuild the gallery after installing the repository development dependencies with `node assets/brand/concepts/2026-10-02/build-gallery.mjs`. It uses the declared Playwright test dependency; set `BRAND_BROWSER_CHANNEL=chrome` to use an installed Chrome browser. A bundled runtime can supply `BRAND_PLAYWRIGHT_MODULE=playwright` and its package path through `NODE_PATH`.

Generated with the built-in imagegen tool. `prompts.json` records every exact prompt and the identity reference. The existing portrait is a reference, not an edit target. The six boards preserve the original generated output without cropping or retouching.

The approved direction is now integrated into web and native identity surfaces. The [production asset guide](../../README.md) owns transparent raster masters, reproducible exports and validation. This folder preserves the design exploration.
