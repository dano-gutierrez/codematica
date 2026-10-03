# Third-Party Data Notices

## KanjiVG kana stroke geometry

The 109 published hiragana/katakana stroke models derive from KanjiVG at commit `70a0b7ae0c18ceb5cb358274b029cce0234a43bc`. Copyright (C) 2009/2010/2011 Ulrich Apel and contributors. These stroke geometries and adaptations are distributed under [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Preserve this attribution, license link, and the per-character source URLs when distributing or modifying the data.

Codematica samples the ordered SVG paths at intervals no greater than 1.5 SVG units, converts the 109×109 viewBox to normalized 0–100 coordinates, and rounds to two decimal places. Curved rendering and beginner grading use these local points; no upstream request occurs in the app. Other character metadata and authored kanji models retain their existing provenance.

- [KanjiVG project](https://kanjivg.tagaini.net/)
- [Pinned source and license](https://github.com/KanjiVG/kanjivg/tree/70a0b7ae0c18ceb5cb358274b029cce0234a43bc)

## JMdict

The generated offline Japanese IME dictionary derives from the Electronic Dictionary Research and Development Group's JMdict project through the `scriptin/jmdict-simplified` common-English distribution. JMdict data is used under its attribution/share-alike license. The pinned input is release `3.6.2+20260803141815`, SHA-256 `5000cdc6a1bc1e3a9aa1cd65fc398e784d952f377aa145b2d84151c073b2653a`.

- https://www.edrdg.org/jmdict/j_jmdict.html
- https://github.com/scriptin/jmdict-simplified

## Open Anki JLPT Decks

The N5 alignment seed is derived from `jamsinclair/open-anki-jlpt-decks`, MIT licensed, pinned at commit `9b20cfa8d59e56018702543aa9060cb72a263692`. The repository credits the earlier Tanos JLPT list; Codematica does not describe this list as official JLPT content.

- https://github.com/jamsinclair/open-anki-jlpt-decks
