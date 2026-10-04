---
title: Video Delivery — Separate Transfer, Protection And Resume
slug: system-design/video-delivery-boundaries
summary: Review segment deadlines, protected media observations and playback-state recovery without treating a CDN or cache name as proof of correctness.
track: System Design
topic: Delivery Contracts
difficulty: practitioner
tags: [video, buffering, cdn, drm, recovery]
prerequisites: [system-design/cache-invalidation, software-engineering/product-interview-durable-generation-architecture]
diagramRefs: []
sourceRefs: [video-hls-rfc8216, video-eme-2017, video-android-drm, video-android-secure-window, video-netflix-browser-requirements]
status: published
---

## Separate the delivery contracts

A video design has several independent questions: can the next media segment arrive before the player needs it, can the device present the protected content, and can the application recover the user's accepted playback state? A component diagram alone answers none of them.

[HTTP Live Streaming, RFC 8216](https://www.rfc-editor.org/rfc/rfc8216.html), August 2017, describes media playlists, segments and variant streams. A master playlist can advertise alternatives; the client's variant-switching algorithm is outside the RFC's scope. Multiple encodings do not by themselves guarantee stable playback.

A CDN can serve eligible cached segments closer to viewers. Review cache keys, authorization, freshness, eviction, missed prewarming and origin fallback with the existing [cache contract](/docs/system-design/cache-invalidation). In particular, a CDN cache hit does not prove uninterrupted playback or remove license, control-plane and client-link constraints.

## Calculate a segment deadline

Original case: a two-second media segment has a constant encoded rate of 4 megabits/second. Its size is 8 megabits. Assume sustained payload throughput of 2 megabits/second, no parallel outstanding transfer, and no extra request or decode overhead: 8 megabits takes 4 seconds. If the player has half a second of usable buffer when it requests the needed next segment, that buffer cannot bridge the wait. Real overhead can make this worse.

State units and assumptions before changing the architecture. Compare a lower-rate compatible variant and buffer/admission policy; then measure startup delay, stalls, quality changes, segment transfer time, cache misses and origin demand. Do not report a fictional release-night request count as a benchmark, or a prewarmed cache as evidence that every viewer has enough bandwidth.

## Observe protection at its own boundary

[Encrypted Media Extensions](https://www.w3.org/TR/2017/REC-encrypted-media-20170918/), the September 18, 2017 W3C Recommendation, describes discovery and interaction with key systems and license/key exchange. EME is an API, not a particular DRM system; application authentication and authorization remain separate. Its key statuses distinguish output restrictions from usable keys. Output may be restricted or downscaled according to policy, and downscaling is optional. Do not promise an automatic quality fallback.

[Android MediaDrm](https://developer.android.com/reference/android/media/MediaDrm) documents both software and hardware security levels, including the API level 28 constants. Record the actual scheme, reported level and device capability instead of asserting that all decrypted video always stays in hardware-only memory. Output protection such as negotiated HDCP is another boundary; inspect the reported connection and applicable policy.

[Android's secure-window guidance](https://developer.android.com/security/fraud-prevention/activities) describes `FLAG_SECURE` and blank captures of protected windows. Therefore, a blank screenshot does not prove hardware-only decoding: capture policy and decoder security are distinct observations. This review does not change capture protection or retrieve protected frames.

The [Netflix browser requirements](https://help.netflix.com/en/node/30081), checked on 2026-10-04, list conditional platform/browser maxima: Chrome on qualifying Windows systems can reach Ultra HD, while its Mac entry reaches Full HD. A universal browser-720p rule is incorrect. Actual playback also depends on the stated device and service requirements; a maximum is not a guarantee for every title or configuration.

## Preserve playback state deliberately

A per-user/video cache value helps lookup, but a cache acknowledgement is not a durable resume contract. Define the authorized account/content/session scope, accepted revision, persistence and replication policy, replay handling and recovery behavior. Link accepted updates to the [durable transition and retry contract](/docs/software-engineering/product-interview-durable-generation-architecture).

Original case: revision 21 records position 2400; a delayed revision 20 reports 2390. Prevent the stale update from overwriting the accepted revision. A later authorized seek backward can be intentional, so taking the largest position is not a general ordering rule. Specify conflicts between concurrent playback sessions separately. Test recovery from the last accepted revision under the declared storage failure model before claiming a named cache preserves position.

## Write a delivery review receipt

Record the content/playlist version, payload units and deadline calculation, eligible variants, cache/origin assumptions, device/key/output observations, accepted playback revision and unresolved evidence. Distinguish measured results from the original hypothetical cases. These are sourced review exercises: no streaming service, DRM bypass or failure injection was run.

Complete the [Video Delivery Checkpoint](/practice/system-design/video-delivery-checkpoint).
