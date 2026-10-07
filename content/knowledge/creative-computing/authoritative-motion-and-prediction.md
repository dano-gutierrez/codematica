---
title: Authoritative Motion And Prediction — Bound The Guess
slug: creative-computing/authoritative-motion-and-prediction
summary: Practice authoritative motion and prediction through original source-bound cases; inspect the declared scope and missing evidence.
track: Creative Computing
topic: Authoritative Motion And Prediction
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-unity-anticipation"]
status: published
---

## Separate visible motion from accepted state

The [archived Unity anticipation guide](https://github.com/Unity-Technologies/com.unity.multiplayer.docs/blob/c25748c7e67375d3bd4657f389ec5b3bf6aff382/docs/advanced-topics/client-anticipation.md) separates visual and authoritative values and distinguishes anticipation from a complete rollback/replay loop. Our original paper simulation displays a moving marker before its next server update. A smooth marker is a presentation result; it does not independently authorize a hit, collision or reward. Keep server state, displayed state and gameplay authority in separate columns.

## Use one declared time domain

Assume positions in metres and velocities in metres per second, with synchronized exercise timestamps. A sample at t=2.0 has position 10 and velocity 4. At t=2.1, constant-velocity extrapolation gives 10.4. A client receipt timestamp from another clock cannot be subtracted directly from the server timestamp without a declared mapping. Packet delivery delay and sample age are different observations.

## Bound the prediction horizon

The original visual rule clamps prediction age to 0.2 seconds. At t=3.0, the old t=2.0 sample therefore displays at most 10.8, not 14. This limit does not prove the true actor stopped there. It prevents an old sample from moving the visual indefinitely while the next authoritative update is missing. Track stale state visibly; a bound is a chosen presentation policy, not a measured accuracy guarantee.

## Reject stale updates and correct deliberately

Assume monotonically increasing sequence numbers within one session. After accepting sequence 12, sequence 11 cannot overwrite authoritative state. A new session resets this comparison domain explicitly; sequence wraparound requires another policy and is excluded from this finite exercise. When sequence 13 arrives, update authoritative state and interpolate the displayed correction separately. Visual smoothing must not silently delay authoritative collision checks.

## Compare the two trajectories

Write samples, shared time mapping, clamped age, sequence/session identity, authoritative position and displayed correction. For t=2.1 and t=3.0, calculate the two displayed positions above. Next introduce a velocity change that happened after the old sample: mark the prediction error rather than calling constant-velocity movement exact. Complete the checkpoint without running Unity or using private project assets. This original finite model is neither the vendor’s copied implementation nor a complete multiplayer prediction stack.

Continue with the [checkpoint](/practice/creative-computing/authoritative-motion-and-prediction-checkpoint).
