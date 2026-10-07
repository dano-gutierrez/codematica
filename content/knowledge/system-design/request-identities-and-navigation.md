---
title: Request Identities And Navigation — Trace The Actual Target
slug: system-design/request-identities-and-navigation
summary: Separate an identifier, its HTTP target, connection reuse and rendering evidence through an original navigation trace.
track: System Design
topic: Request Identity
difficulty: practitioner
tags: [uri, http, navigation, evidence]
prerequisites: [game/request-flow]
diagramRefs: []
sourceRefs: [boundary-rfc3986, boundary-rfc8141, boundary-rfc9110, boundary-rfc9112]
status: published
---

## Split the identifier before following it

Use the fictional address `https://library.example:8443/books/7?edition=2#notes`. Its scheme is `https`, authority is `library.example:8443`, path is `/books/7`, query is `edition=2`, and fragment is `notes`. The final path segment is not an additional universal component called "resource". These boundaries follow [RFC 3986, sections 3–3.5](https://www.rfc-editor.org/rfc/rfc3986.html).

A URI identifies; successful retrieval is a separate question. A URL supplies a locating mechanism, while a URN uses a naming scheme; neither promises that a representation is currently reachable. Read the selected naming distinction in [RFC 8141](https://www.rfc-editor.org/rfc/rfc8141.html). A displayed address is also not evidence that its host is trusted or that its content may be accessed by this user.

## Derive the target from the chosen request form

For this exercise, assume a direct HTTP/1.1 GET to the origin. The origin-form target is `/books/7?edition=2`; the Host field is `library.example:8443`. Keep `#notes` out of the HTTP target. [RFC 9112, section 3.2](https://www.rfc-editor.org/rfc/rfc9112.html) distinguishes origin, absolute, authority and asterisk forms. A forward proxy, CONNECT or server-wide OPTIONS changes the relevant form; do not reuse one request-line sketch for every interaction.

Write both the original address and derived target on the review sheet. If the request instead names `/home`, the diagram has changed the requested resource. A server-side redirect can explain a later target, but that response must appear in the trace. Do not silently repair a mismatch by guessing that the server "knows what we meant".

## Record reuse instead of assuming a fresh connection

An original trace has these observations: a valid cached DNS answer exists; an eligible secured connection is already available; the client sends the target above on it; the origin returns a response. A second trace has no usable connection and must establish one. [RFC 9110, sections 4.3 and 7.1](https://www.rfc-editor.org/rfc/rfc9110.html) ties access and authority to the target and permits connection reuse under the applicable rules.

These traces have different setup costs. Neither proves that every navigation performs a fresh DNS lookup, TCP handshake and TLS negotiation. A cache hit, service worker, redirect, proxy or negotiated HTTP version also needs its own observed branch. Record only the branches actually evidenced; the [transport review](/docs/system-design/transport-streams-and-tunnels) explains why one TCP diagram cannot describe HTTP/3.

## Separate the response from the displayed page

Continue the fictional trace with a successful HTML response, an image request that fails, and script-driven loading that remains pending. "HTML arrived" is supported; "the whole page is ready" is not. Split timings into target resolution, connection setup or reuse, response headers/body, and the application's own ready condition. The request-flow map is a useful starting point, not a universal browser scheduler specification.

For a sensitive view, record which operation enforced the current user's permission and whether caches are correctly scoped. Encryption to an authenticated endpoint and authorization to a particular book are separate obligations. A screenshot of a finished page cannot independently prove either the earlier request target or the permission check.

## Preserve a bounded navigation receipt

Complete this original worksheet before the checkpoint: identifier and components; method and request form; exact target and authority; protocol; reuse/cache evidence; redirects; failure stage; application-ready evidence. Change only the fragment and predict which part of this direct HTTP target stays identical. Then change the query and identify the changed target. Finally, remove the reusable connection observation and mark setup unknown rather than inventing a measurement.

Complete the [Request Identity Checkpoint](/practice/system-design/request-identities-and-navigation-checkpoint). The paper trace does not contact a website, capture packets or implement a browser. Related intermediary and authorization contracts belong in [API interaction review](/docs/system-design/api-interactions-and-intermediaries).
