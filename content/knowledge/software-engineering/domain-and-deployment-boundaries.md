---
title: Domain And Deployment Boundaries — Model The Invariant
slug: software-engineering/domain-and-deployment-boundaries
summary: Practice domain and deployment boundaries through original source-bound cases; inspect the declared scope and missing evidence.
track: Software Engineering
topic: Domain And Deployment Boundaries
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-ddd-reference"]
status: published
---

## Define the business words in one context

The [DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) distinguishes bounded contexts, identity-bearing entities, value objects and aggregates. For this original workshop, Booking means an accepted room/date allocation, while Quote means a price offer that can expire. A separate billing context uses Invoice. Write those meanings before deciding whether three classes should become three services. An identical word in another team’s model needs an explicit translation, not an assumed shared meaning.

## Choose identity or value for the case

In the fictional model, Booking B17 retains identity when its guest contact changes. A Money value is specified by currency and amount; equal components represent the same value under this exercise’s policy. Two bookings with the same room/date are not therefore one entity. Choose equality and lifecycle rules deliberately. Database row IDs are implementation evidence, not an explanation of the domain’s reason to preserve identity.

## Put the invariant behind one owner

The original rule says total allocated seats within Event E must never exceed capacity. Its aggregate owner receives a requested allocation and checks the whole transition before accepting it. Reading capacity once and checking two independently committed child updates is insufficient: both can observe one remaining seat and each allocate it. Naming a root object does not implement transactional consistency. State the storage and concurrency boundary that protects the invariant.

## Keep deployment and dependency axes separate

Draw one executable containing booking and billing modules, then draw two executables with a versioned boundary. Either arrangement still needs clear business ownership. Layers describe dependency responsibilities; events describe communication; processes describe deployment and failure boundaries. A message emitted after acceptance is not automatically evidence that another context completed billing. Avoid classifying MVC, event flow and service count as interchangeable rungs on one ladder.

## Review a boundary change with a counterexample

Propose moving allocation children into separate services. Trace the two competing one-seat requests and identify how the invariant survives, or reject the proposal until that mechanism exists. Next add a billing failure and distinguish accepted booking from failed invoice delivery. Complete the checkpoint using this explicitly fictional consistency policy. No DDD book, architecture catalog, database transaction or complete distributed application is reproduced. The [durable generation architecture](/docs/software-engineering/product-interview-durable-generation-architecture) provides related outcome and delivery boundaries.

Continue with the [checkpoint](/practice/software-engineering/domain-and-deployment-boundaries-checkpoint).
