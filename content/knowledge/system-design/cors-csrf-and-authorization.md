---
title: CORS, CSRF And Authorization — Three Different Checks
slug: system-design/cors-csrf-and-authorization
summary: Trace whether a browser request is sent, whether its response is readable and whether the server should allow the operation; distinguish CORS from CSRF and object authorization.
track: System Design
topic: API Security
difficulty: practitioner
tags: [cors, csrf, authorization, browser-security, api]
prerequisites: []
diagramRefs: []
sourceRefs: [web-cors-mdn, web-fetch-standard, web-csrf-owasp]
status: published
---

## Ask three questions about the request

For an API operation, separate transport from permission:

1. Did the browser send the request?
2. Can the calling page read the response?
3. Does the server permit this authenticated actor to perform this operation on this object?

[MDN's CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) describes browser-enforced response sharing. Some requests need a successful preflight; safelisted requests can be sent without one. A blocked response therefore does not establish that the server did nothing. CORS also does not restrict a server-to-server client in the same way.

## Trace a concrete failure

In this original exercise, `app.example.test` operates a user's account API. The user opens another site while signed in. Assume the browser's actual cookie policy permits the relevant session cookie on the cross-site request; do not assume that for every browser or SameSite setting.

The other page makes a `fetch` POST with `credentials: "include"`, `Content-Type: application/x-www-form-urlencoded` and no other headers that require preflight. The API accepts the session cookie, changes a preference and returns a response without permitting that page's origin. The requesting script cannot read the response, but the preference can already have changed.

Draw the timeline: request sent, cookie policy applied, server authentication, operation accepted, response sent, browser response-sharing check. Put the mutation at the server step. A browser console CORS error belongs to the response-reading observation and does not undo the preceding operation.

The [Fetch standard](https://fetch.spec.whatwg.org/#http-cors-protocol) specifies CORS request and response processing. Requests using methods or headers outside the safelist generally require preflight; successful preflight is still not authorization to a particular account object. Cached preflight results and the concrete request shape matter when interpreting a trace.

## Place each protection at its boundary

[OWASP's CSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) addresses unwanted authenticated state changes. Use the framework's supported protection, appropriate CSRF tokens or supported origin/Fetch Metadata checks, with SameSite as part of the chosen defense. Keep state changes out of GET operations. A token design still needs correct validation and integration; an XSS flaw can undermine CSRF defenses.

Authentication establishes an actor. Authorization checks whether that actor may change the requested object and operation. A valid session or allowed origin does not grant ownership of every object ID. If a user changes `/accounts/own/preferences` to another account's identifier, the server must independently reject unauthorized access even from the legitimate app.

| Observation | What it establishes | What it does not establish |
| --- | --- | --- |
| Preflight rejected | Browser cannot continue that preflighted request | Every other request shape is blocked |
| Response blocked by CORS | That page cannot read the response through the checked browser API | No state change occurred |
| Session authenticated | The server recognized an actor | The actor owns the requested object |
| CSRF check passed | The request passed the chosen anti-forgery check | Object authorization or input validity |

## Run a review exercise

For each of these cases, mark request-sent, response-readable and operation-authorized as separate observations:

- A safelisted credentialed `fetch` POST accepted by the API, with a response blocked by CORS.
- A custom-header request whose preflight fails before the state-changing request is sent.
- An allowed-origin request with valid CSRF proof but another user's object ID.

Acceptance: the first may mutate state despite unreadable response; the second does not send that guarded operation; the third still needs an object authorization rejection. State the cookie and request assumptions in your answer. Validate only with inert local fixtures or an explicitly authorized test environment, using server logs as well as browser observations.

Complete the [API Boundary Checkpoint](/practice/system-design/api-boundary-checkpoint). When reviewing a diagram or security checklist, identify the exact boundary each mechanism protects before recommending it.
