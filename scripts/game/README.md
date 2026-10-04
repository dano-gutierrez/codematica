# Game build tools

Run commands from the repository root:

- `npm run game:runtime`: bundle pinned sql.js, its WASM bytes, parser, and bounded fixture runner into a local worker; emit the same source for web and native WebView.
- `npm run game:assets`: pack editable SVG parts and convert original painted backgrounds/layers into the shared atlas and local platform textures.
- This command also exports the four portrait masters to square PNG/WebP thumbnails at 64, 128, 256 and 512 pixels, validates source dimensions, and writes the thumbnail manifest.

The build uses direct, pinned development build tools. Runtime libraries belong to the consuming workspace’s direct production dependencies. No graphics engine is imported by core/server code. No remote code execution or credentials are needed for puzzle evaluation. The SQL worker uses a fresh in-memory database and is terminated after a result or timeout.

- `npm run game:flows`: regenerate the native chapter journey from validated solutions. The emitted YAML is JSON-compatible YAML and contains 36 scenarios; do not edit it by hand.
- `npm run game:check`: rebuild workers, atlases, and the native journey and compare hashes. Bundled worker comments retain dependency licenses.
- `npm run game:artifact-smoke -- path/to/app-release.apk`: create a disposable production-only install, start the real Next artifact, run CSS/SQLite, and optionally inspect the native APK for textures and WASM.
- `node scripts/game/capture-contact-sheet.mjs http://127.0.0.1:3128`: capture a running production preview and assemble the repository contact sheet. Finish any build before starting that preview; rebuilding `.next` under a running server can leave it serving stale asset hashes.
- `npm run game:character-preview`: render the four thumbnails, small-size comparisons and assembled editable sprites into `assets/game/previews/character-kit-v2.{html,png}`. It uses local assets and needs no running app server.

`scripts/game/assets.test.ts` checks rig/frame compatibility, nonempty transparent sprites, thumbnail identities/dimensions and byte-identical web copies. The production artifact smoke check fetches every thumbnail variant from the pruned application. `game:check` recursively hashes generated subfolders so thumbnail changes cannot escape reproducibility checks.

Artifact checks retain logs under `test-results/`; they never prune the workspace’s dependencies. Native Maestro syntax follows the official [command reference](https://docs.maestro.dev/reference/commands-available). Live browser tests install Playwright’s clock before navigation, so timers created by the app use the controlled clock from the start.

- `npm run game:miniature-preview -- http://127.0.0.1:3128`: capture real phone/wide scenes and show transparent full-body miniatures at small display sizes in `assets/game/previews/miniatures-v3.{html,png}`.
- `game:assets` exports full-body PNGs under `generated/miniatures/` from the shared idle pose. The asset tests, reproducibility check, and production artifact smoke check cover those exports separately from portrait icons.

`build-map-art.ts` assembles four connected paintings before exporting twelve tiles with identical guard pixels at every seam, three foliage crops, mist, motes and a fifty-position manifest. The normal `game:assets` / `game:check` commands own these exports. Asset tests compare decoded boundary pixels and web/native copies; the production artifact lane verifies every served map asset and expects the statically imported map textures in APKs.

`node scripts/game/capture-map-art.mjs <preview-url>` captures phone, wide, chapter-join, summit and reduced-motion views plus a complete terrain contact sheet. It waits for visible neighbors to decode. The parallax recording goes to ignored `test-results/map-art/parallax.webm`. Do not rebuild a production server's `.next` directory during capture.
