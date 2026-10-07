---
title: Sampled Surfaces And Time — Separate Geometry From Shading
slug: creative-computing/sampled-surfaces-and-time
summary: Practice sampled surfaces and time through original source-bound cases; inspect the declared scope and missing evidence.
track: Creative Computing
topic: Sampled Surfaces And Time
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-blender-scene-time", "evidence-blender-position"]
status: published
---

## Define a surface on paper

The [Position node](https://docs.blender.org/manual/en/5.2/modeling/geometry_nodes/geometry/read/position.html) supplies position information for geometry operations. For this original exercise, explicitly choose local coordinates and the height function z = A sin(2π(x/λ − f t)). Set amplitude A=0.5 metres, wavelength λ=4 metres and frequency f=1 per second. These are fictional parameters. A colour image of water does not independently establish displaced vertices, topology or simulated fluid motion.

## Name seconds and sample times

The [Scene Time node](https://docs.blender.org/manual/en/5.2/modeling/geometry_nodes/input/scene/scene_time.html) exposes seconds and a frame value that may be fractional. This exercise separately defines frame 0 at t=0 and 24 frames per second, so frame 6 means t=0.25. That mapping is an authored assumption, not a universal Blender frame-origin claim. Feeding a raw frame count into the frequency term changes units. Keep the actual scene time source and chosen origin explicit.

## Check two points before animating

At x=0,t=0 the height is 0. At x=1,t=0 the phase is π/2 and height is 0.5. At x=1,t=0.25 the phase returns to 0 and height is 0. These three values are a small independent reference for the fictional formula. They do not show that a particular node graph implements it. A sign reversal changes travel direction; compare another timestamp instead of judging only one still frame.

## Separate sampling, normals and material

For a regular point spacing of 1 metre, this wavelength has four intervals per cycle. Coarsening to 2 metres leaves only two and can miss the intended shape between points. Geometry detail, normal computation, material transparency and lighting are separate decisions. A reflective shader can suggest ripples without moving geometry, while a displaced mesh can still have poor shading. Record which operation generated each visible effect.

## Preserve an original scene receipt

Write coordinate space, A/λ/f units, time origin, point spacing, formula samples and the operations that affect geometry versus appearance. For the checkpoint, compare the explicit three-point table and explain which parameter changes displacement. This lesson uses no downloaded assets or copied water scene, does not reproduce a full tutorial and makes no claim about physical fluid conservation. Blender installation and rendered animation are separate activities; the current practice is an original paper model.

Continue with the [checkpoint](/practice/creative-computing/sampled-surfaces-and-time-checkpoint).
