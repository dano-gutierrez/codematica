---
title: "CSS Grid Defense"
slug: game/css-grid-defense
summary: "A practical introduction for Restore the Signal challenges."
track: Front-End Development
topic: Grid layout
difficulty: foundation
tags: [game, foundations, practice]
prerequisites: []
diagramRefs: []
status: published
---

## Place the net

A grid track sits between two numbered lines. `grid-column: 2 / 4` covers columns 2 and 3. The final line is excluded.

```css
grid-column: 2 / span 2;
grid-row: 2 / 3;
```

`span 2` covers two tracks. `grid-template-columns: 1fr 2fr 1fr` gives the middle track twice the space of its neighbors. The proportions hold when the container grows.

## Check the result

Inspect both ends of the net, not just its starting point. Survivor tiles must stay uncovered. In the rooftop challenge, also check the narrow and wide previews.

Read the [MDN grid guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts).
