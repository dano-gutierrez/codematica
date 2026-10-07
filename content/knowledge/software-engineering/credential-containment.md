---
title: Credential Containment — Act On Verified Scope
slug: software-engineering/credential-containment
summary: Practice credential containment through original source-bound cases; inspect the declared scope and missing evidence.
track: Software Engineering
topic: Credential Containment
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-google-containment", "evidence-google-service-accounts"]
status: published
---

## Separate the observation from the suspected cause

A fictional build service unexpectedly deletes test objects. Record the timestamps, affected objects, principal, credential form and still-active operations. Preserve known evidence without putting credential values in the incident log. [Google’s response guidance](https://docs.cloud.google.com/docs/security/compromised-credentials) includes urgent revocation or disablement where appropriate; continuity work does not justify an absolute rule to keep harmful access active.

## Trace the principal and its consumers

The [service-account guidance](https://docs.cloud.google.com/iam/docs/best-practices-service-accounts) distinguishes the account as an access-controlled resource from the identity acting on other resources. In this paper inventory, Build A and Release B both use Account R, while a scheduled report impersonates R. A key name identifies a credential, not necessarily the person who used it. List workload owners, issuance paths and alternate credentials before claiming a complete dependency map.

## Choose containment with incident authority

For the exercise, the incident owner has authorized stopping the destructive build and revoking its leaked persistent key. This reduces that route immediately. A second worker holds a previously issued short-lived token: deleting the persistent key alone is not evidence that its token is now unusable. Check the relevant token lifetime and permission propagation separately. If destruction continues, the authorized owner may need broader containment even when it interrupts legitimate consumers.

## Recover consumers without recreating the leak

The fictional dependency sheet lists CI secrets, deployment configuration, infrastructure state, scheduled jobs and owner acknowledgements. Restore one consumer through its approved identity path, verify its minimal operation, and keep the old secret out of commits and learning notes. Success on Build A says nothing about Release B until B’s own operation is checked. A dependency search with zero results is scoped evidence, not proof that no unmanaged consumer exists.

## Close with separate recovery receipts

Record containment time, denied old path, restored consumer identities, remaining tokens and evidence gaps. An accepted rotation request is not confirmed recovery; green application tests are not an access revocation test. Keep investigation, containment, restoration and unknown impact distinct. This checkpoint uses fictional authorized decisions and performs no credential, IAM or production mutation. Connect it to the [API authorization review](/docs/system-design/cors-csrf-and-authorization) when reviewing consumer access.

Continue with the [checkpoint](/practice/software-engineering/credential-containment-checkpoint).
