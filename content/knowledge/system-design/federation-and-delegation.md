---
title: Federation And Delegation — Keep The Sessions Separate
slug: system-design/federation-and-delegation
summary: Practice federation and delegation through original source-bound cases; inspect the declared scope and missing evidence.
track: System Design
topic: Federation And Delegation
difficulty: practitioner
tags: [evidence-review, contracts, original-practice]
prerequisites: []
diagramRefs: []
sourceRefs: ["evidence-oidc-core", "evidence-pkce", "evidence-oauth-security"]
status: published
---

## Draw two application sessions

The fictional identity provider recognizes Nora. Application A then creates its own local session, while Application B has no local session yet. Shared sign-in can make the second login easier; it does not make both applications’ cookies one credential. Record issuer session, client transaction, local session and resource access as different objects. Signing out of A proves only the configured A-session change unless wider logout evidence exists.

## Bind the returned identity to the client

[OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html) specifies issuer, audience, expiry and applicable nonce checks. For this exercise, a trusted verifier has already checked the signature; our client additionally requires the expected issuer, its registered audience, unexpired time and a matching nonce it sent. A correctly signed token for another client still fails this policy. Sending no nonce does not make one universally mandatory in every Core code-flow deployment; the exercise deliberately chooses to send and require it.

## Protect the authorization-code transaction

[PKCE](https://www.rfc-editor.org/rfc/rfc7636.html) binds the code exchange to a verifier, and [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) requires PKCE for public clients, recommends it for confidential clients, and specifies downgrade protection. In the fictional transaction, A sends an S256 challenge and later presents its corresponding verifier. A code stolen without that verifier must not be redeemable under this contract. A verifier received for a transaction with no recorded challenge must be rejected, not treated as an upgrade after the fact.

## Authorize the requested object independently

A valid identity and an accepted code exchange do not establish Nora’s permission to edit Invoice I9. The resource handler checks current membership and action scope for that invoice. In the original table, Nora can read I9 but cannot refund it; a generic signed-in flag would collapse these outcomes. The [API boundary lesson](/docs/system-design/cors-csrf-and-authorization) supplies related object-level access checks.

## Preserve the four receipts

Write expected issuer/client, transaction-bound challenge/nonce, local session identity and the exact requested resource action. Change the audience, expire the token, reuse another transaction’s nonce or request an unauthorized refund: each fails for its own reason. Keep provider-session reuse distinct from local-session creation. Complete the checkpoint without parsing real tokens or contacting an identity provider; a paper review is not a production OIDC implementation.

Continue with the [checkpoint](/practice/system-design/federation-and-delegation-checkpoint).
