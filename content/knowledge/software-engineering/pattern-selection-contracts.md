---
title: Design Patterns — Preserve Contracts Before Adding Indirection
slug: software-engineering/pattern-selection-contracts
summary: Choose a change axis, preserve substitution behavior, adapt units explicitly and review shared lifetimes through original cases.
track: Software Engineering
topic: Design Patterns
difficulty: practitioner
tags: [design-patterns, contracts, composition, lifetime]
prerequisites: [software-engineering/concurrency-boundaries]
diagramRefs: []
sourceRefs: [backend-fowler-polymorphism, backend-dotnet-di-lifetimes]
status: published
---

## Choose the change axis

A pattern names a recurring design relationship; pattern counts are not a seniority standard. Identify what changes independently, who calls it and which behavior must remain stable. A small conditional over a closed, stable set can be simpler than a family of interchangeable objects.

Martin Fowler's [Replace Conditional with Polymorphism catalog entry](https://refactoring.com/catalog/replaceConditionalWithPolymorphism.html) illustrates dispatching type-specific behavior through objects. Use it as a selected refactoring reference, not an instruction to replace every conditional. The original cases below copy none of its code.

## Preserve the substitution contract

Original quote-review case: two shipping policies accept the same validated package description and return the same documented quote shape. A Strategy-like boundary lets the caller select policy while keeping accepted input, result units and failure behavior stable.

Every substitute must preserve accepted inputs, results and errors across every implementation and caller. A substitute that silently returns zero when dimensions are invalid violates that contract. Creation through a factory does not by itself repair the violation or justify additional abstraction. Add comparative cases for each implementation before calling a change behavior-preserving.

## Adapt units without hiding failures

An Adapter-like boundary translates an existing interface into the caller's required contract. Original case: a provider supplies the decimal string 12.50 and currency USD; the caller needs integer cents and a currency code. Under that explicit decimal/unit contract, 12.50 USD becomes 1250 cents.

Validate currency, precision, rounding and missing/error states. A string conversion that drops currency or turns unknown input into zero hides failure. This is a paper representation exercise, not a payment parser or currency-conversion implementation. Do not confuse format conversion with authorization.

## Wrap one call without changing its outcome

A Decorator-like composition can add behavior around an operation while keeping the caller's interface. Original logging case: invoke the underlying operation once, preserve its returned value or propagated exception, and record the declared observation.

In particular, a logging wrapper must not turn an exception into success or secretly repeat an effect. Instrumentation itself can fail; state its failure policy separately instead of assuming it cannot affect the call. Adding wrappers also changes ordering and lifetime obligations, so test the composed caller, not just each isolated wrapper.

## Own shared state and lifetimes

Microsoft's [dependency-injection guidelines](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines), selected Thread safety and Recommendations sections, separate container construction/resolution safety from service-instance synchronization. Singleton lifetime is not an automatic correctness guarantee: one construction does not make shared state thread-safe.

Review who owns disposal and which request/tenant state may be shared. Review scope: a request-scoped dependency must not become global by accident. Make dependencies explicit so tests can substitute them without leaving state in a global registry; relate shared transitions to the [concurrency review](/docs/software-engineering/concurrency-boundaries).

Record the change axis, current simple alternative, input/output/error contract, ownership/lifetime and comparative test evidence. These are selected original contract cases; no complete design-pattern catalog or installed framework was tested. Complete the [Pattern Selection Checkpoint](/practice/software-engineering/pattern-selection-checkpoint).
