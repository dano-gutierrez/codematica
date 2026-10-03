# Character portrait masters

`patch.png`, `shambler.png`, `runner.png` and `armored.png` are the full-resolution square thumbnail designs, generated from the v2 character lineup. Keep these masters unmasked; the quiet backgrounds are opaque.

`npm run game:assets` exports each master to PNG and WebP at 64, 128, 256 and 512 pixels, with names and alt text in `assets/game/generated/thumbnails/manifest.json`. Do not resize or overwrite the masters when adjusting an app's display size. See the [asset guide](../../README.md) for the preferred rounded-square treatment and the [character kit](../../previews/character-kit-v2.png) for size comparisons.
