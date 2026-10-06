---
title: Distributed Readings — Review The Assumptions
slug: system-design/distributed-reading-reviews
summary: Compare quorum membership, consensus commitment and fan-out latency through selected primary readings and original review cases.
track: System Design
topic: Distributed Contracts
difficulty: practitioner
tags: [distributed-systems, consensus, latency, evidence]
prerequisites: [system-design/scaling-decision-worksheet, software-engineering/product-interview-durable-generation-architecture]
diagramRefs: []
sourceRefs: [dynamo-sosp-2007, raft-extended-2014, tail-at-scale-2013]
status: published
---

## Read for a specific contract

Read selected passages with a question to answer. Record the edition, assumed failures, participants and observable promise before selecting a mechanism. These three readings address different contracts; none supplies a universal architecture ladder. The cases below are original exercises; no distributed cluster or latency benchmark was run. They do not represent an employer's interview or a complete implementation of these papers.

## Name the quorum members

[Dynamo, SOSP 2007](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), sections 4.4–4.6, describes version reconciliation and substitute nodes under failures. Read the participants as well as the numerical quorum. R + W > N does not establish linearizability for Dynamo's sloppy membership and concurrent versions. This is the historical Dynamo paper, not a current DynamoDB API contract.

Original case: nominal owners are A, B and C, with N=3, W=2 and R=2. A and B are unreachable to one client. A write is acknowledged by C and substitute D. Another client's read reaches A and B before repair. The two sets are disjoint despite 2+2>3: they were not subsets of the same three participants. Receiving two replies cannot establish that write's visibility.

Ask which versions return, how concurrent branches are reconciled and when a substitute transfers its hint. A hint is not proof that repair completed. Do not silently replace conflicting application changes with a timestamp winner.

## Commitment needs more than a copy count

[Raft, extended version dated May 20, 2014](https://raft.github.io/raft.pdf), Figure 2 and section 5.4.2, constrains direct majority-based commitment to a current-term entry. Earlier entries become committed through the resulting prefix; election and log rules remain essential.

Original review: a term-4 leader observes three copies of a term-2 entry in a five-server cluster. Reject the statement "three copies alone commit it." Require the current-term rule and the surrounding log/election invariants. Do not infer a safe read merely from a process still calling itself leader.

Section 8 separately discusses client identity/result deduplication and fresh leadership evidence for reads. A committed command does not deduplicate client retries: a lost response can produce another command. Connect this boundary to the [durable retry lesson](/docs/software-engineering/product-interview-durable-generation-architecture). This reading is not a Raft simulator, proof checker or installed consensus service.

## Measure the whole fan-out

[The Tail at Scale, February 2013](https://barroso.org/publications/TheTailAtScale.pdf), its component-variability and short-term adaptation passages, explains why waiting for many leaves amplifies latency outliers. Delayed hedges can reduce waiting while adding work; the paper's measurements belong to its reported workloads.

Original assumption: 100 required leaves each have probability 0.01 of exceeding a chosen deadline. With independent leaf events, the probability that at least one exceeds it is `1 - 0.99^100`, approximately 63.4%. It is not 1%. Under perfectly correlated stalls, the same marginal probabilities can instead produce 1%; independence must be justified.

Review any hedge against shared bottlenecks, deadline, extra-work budget and effect safety. Client cancellation does not prove the server stopped. Do not duplicate a payment just to race responses. Measure end-to-end tails and load under representative contention; isolated leaf percentiles do not establish that result. Reuse the [capacity worksheet](/docs/system-design/scaling-decision-worksheet) for the controlled comparison.

## Write a comparison receipt

For one proposal, fill in these fields:

| Field | Evidence to record |
| --- | --- |
| Required behavior | What a caller may conclude from acceptance, completion or a read |
| Assumptions | Participants, failure model, operation identity and allowed staleness |
| Counterexample | A specific schedule or workload that defeats a stronger claim |
| Experiment | Controlled input, observable result, success threshold and rollback condition |
| Remaining gap | Paper reasoning, local measurement and deployed behavior kept distinct |

Complete the [Distributed Reading Checkpoint](/practice/system-design/distributed-reading-checkpoint). More papers can supply new mechanisms later; a list of titles alone supplies no implementation or evidence of readiness.
