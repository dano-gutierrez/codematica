# Brand exports

`npm run brand:assets` packages the approved raster artwork for web and native. `npm run brand:check` recomputes all exports in memory and compares checked-in bytes, then verifies transparency and launcher constraints. CI runs the check before building.

`npm run brand:preview` captures `assets/brand/preview.html`; install Playwright Chromium first. The export pipeline uses the root's pinned Sharp development dependency. No image-generation or image-processing package is added to app runtime imports.

Production serving is checked by `scripts/game/artifact-smoke.mjs`, including every brand URL, metadata image and web manifest after an isolated production-only dependency install.

See `assets/brand/README.md` for source ownership and `docs/features/brand-identity.md` for the contract.
