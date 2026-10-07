---
title: Java State And Proxy Contracts — Inspect The Boundary
slug: programming/java-state-and-proxy-contracts
summary: Practice java state and proxy contracts through original source-bound cases; inspect the declared scope and missing evidence.
track: Programming
topic: Java State And Proxy Contracts
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-java23-map", "evidence-jls23-memory", "evidence-jls23-records", "evidence-java23-threadlocal", "evidence-spring-transactions"]
status: published
---

## Make key identity stable

The [Java SE 23 Map contract](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/util/Map.html) warns about keys changed in ways that affect equality. In an original paper trace, a key is inserted with code A and later mutated to code B. Do not infer reliable lookup from object identity alone. An unmodifiable map prevents its own structural mutation; a nested mutable value still needs a separate ownership policy. Test the stable-key requirement rather than memorizing one hash-table implementation.

## Separate ordering from atomic transitions

[JLS 23 chapter 17](https://docs.oracle.com/javase/specs/jls/se23/html/jls-17.html) gives volatile ordering rules; a compound increment still contains multiple actions. Two fictional workers read 4, each computes 5 and each writes 5: one increment is lost. A different trace writes payload data before a volatile ready flag and reads after observing that flag. These exercises ask different questions. A visibility guarantee does not turn the first read-modify-write transition into one atomic operation.

## Inspect referenced values and thread lifetime

[Record component fields](https://docs.oracle.com/javase/specs/jls/se23/html/jls-8.html) are final, but a record holding a mutable list does not freeze that list. In the exercise, another owner appends to the shared list and the record’s visible contents change. Java 23 is not an immutability-by-default language. Separately, [ThreadLocal](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/ThreadLocal.html) belongs to a thread, not a request. If a pooled thread handles Alice then Bob, request cleanup must remove Alice’s context on that same thread, including failure paths. A later get can initialize a new value.

## Name the transaction interception path

The [Spring annotation reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html) describes default proxy interception of external calls; self-invocation bypasses that proxy advice. Draw caller → proxy → service separately from service → its own annotated method. Default rollback covers RuntimeException and Error, not every checked exception. Explicit rules and the 6.2 global ALL_EXCEPTIONS option change the policy. Record configuration and edition before applying this reference to an installed service.

## Keep a six-boundary review sheet

For a fictional order handler, inspect mutable keys, compound state transitions, nested record ownership, pooled-thread cleanup, proxy entry and rollback policy. Change one field or call route at a time and state the violated contract. The checkpoint groups the key and record ownership case into one choice, then checks the other boundaries independently. It executes no JVM, Spring container, Kafka cluster or twenty-question hiring syllabus. Existing [concurrency review](/docs/software-engineering/concurrency-boundaries) supplies related process and synchronization distinctions.

Continue with the [checkpoint](/practice/programming/java-state-and-proxy-contracts-checkpoint).
