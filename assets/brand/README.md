# Codematica brand concepts

The user approved the [refined October 2 board](concepts/2026-10-02/05-outpost-refined-v2.png): option 1's simpler large Patch head with option 5's medium icon, freestanding favicon and lettering. Web and native identity surfaces now use these assets.

## Source and exports

- `concepts/`: original concepts and approved refinement, preserved unchanged.
- `source/approved-transparent.png`: original alpha board; still supplies the unchanged wordmark and tiny favicon.
- `source/approved-transparent-v3.png`: revised large head with the two thin lines above its left eyebrow removed. The logo export pairs this head with the original lettering.
- `source/launcher-foreground-v2.png`: matching medium head with the same line cleanup and its cream outline; the operating system supplies the launcher mask. The original foreground is retained for reference.
- `source/prompts.json`: exact background-extraction prompts and input roles.
- `source/eyebrow-cleanup-prompts.json`: exact built-in imagegen prompts for the requested line removal.
- `generated/`: large PNG logo, separate head and wordmark, and opaque launcher master.
- [preview.html](preview.html) / [preview.png](preview.png): actual-size light/dark favicons, header, transparency, splash and launcher-mask checks.

These are raster masters. They preserve the approved artwork; they are not editable vector paths or a replacement for the game character rigs.

Run `npm run brand:assets` to reproducibly crop, size and package the checked-in alpha artwork with the existing build-only Sharp dependency. Run `npm run brand:check` to verify byte-for-byte freshness, transparency and native launcher constraints. `npm run brand:preview` captures the review sheet with Playwright Chromium.

The opaque launcher is flattened directly from its transparent square. Compositing onto an opaque square first causes a few one-step color-rounding differences between ARM and x64. Direct flattening keeps all 20 exports byte-identical on macOS ARM and Linux x64 with the pinned Sharp build.

The export command updates `apps/web/public/brand/`, Next's `favicon.ico` and `apple-icon.png`, `apps/mobile/assets/{icon,adaptive-icon,splash}.png`, and `packages/ui/src/assets/brand/`. Do not hand-edit these copies. It never calls an image-generation service.

See [the brand contract](../../docs/features/brand-identity.md) for integration and verification. Browser favicons have true alpha; native launcher icons use the approved teal backdrop. Native launcher/splash changes take effect in a new native build.
