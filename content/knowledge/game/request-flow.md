---
title: "Request Flow and Feedback Loops"
slug: game/request-flow
summary: "A practical introduction for Restore the Signal challenges."
track: System Design
topic: Data flow
difficulty: foundation
tags: [game, foundations, practice]
prerequisites: []
diagramRefs: []
status: published
---

## Follow an event in both directions

A gate requests a permit from a service. The service reads storage and returns a result. A one-way audit sink can record an event, but cannot replace the service that answers it.

## Cache-aside

Read the cache first. On a miss, read authoritative storage and populate the cache. A write changes storage and invalidates the corresponding cached entry. Real distributed systems also need a consistency policy for races and failed invalidation.

## Commands and rendering

A user action sends a command to a state owner. The state owner publishes a value for views to render. Rendering must not emit another user command. Several views may share a state owner without forming an endless echo.

Pipe colors and labels identify signal types. A response is different from a request, and a render event is different from a command. Connect the labeled ports and inspect where the event stops.

See [cache-aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).
