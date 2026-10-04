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
sourceRefs: [web-cors-mdn, web-fetch-standard, web-csrf-owasp, token-jwt-owasp, token-rest-owasp, rfc-7009-revocation, rfc-9700-refresh]
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

## Separate token validity from current session state

A token can pass cryptographic and claim validation after a session ends: a valid signature does not prove current permission. [OWASP REST Security](https://github.com/OWASP/CheatSheetSeries/blob/6b6a66bae11c9e001c3576bcc3de55cc0dc5e449/cheatsheets/REST_Security_Cheat_Sheet.md) requires verification using trusted configuration and checks such as issuer, audience and validity times. A request still needs the actor/object/operation check described above.

[OWASP's JWT denylist guidance](https://github.com/OWASP/CheatSheetSeries/blob/6b6a66bae11c9e001c3576bcc3de55cc0dc5e449/cheatsheets/JSON_Web_Token_Cheat_Sheet.md) uses an identifier such as verified `iss` plus `jti`. Define the required claims and application/audience scope; a token identifier must be uniquely server-issued in that scope. Because raw-token hashes can miss equivalent valid representations through JWT malleability, identify revocation by verified claims. Short access-token lifetimes reduce an exposure window, but do not establish immediate revocation. Choose an ordinary server-side session if its lifecycle better fits the product.

## Trace revocation to every consumer

[RFC 7009](https://www.rfc-editor.org/rfc/rfc7009.html) distinguishes authorization-server invalidation from propagation to consumers. Its HTTP 200 also covers an invalid submitted token; a 503 means the client must assume the token still exists. Revocation can cascade to related tokens according to server policy: revoking refresh access does not by itself prove every issued access token unusable. Inspect the actual cascade and resource-server enforcement rather than assuming them.

[RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) requires refresh tokens for public clients to be sender-constrained or rotated to detect replay. Rotation retains the token relationship; replay detection can revoke the active refresh token. This protects refresh use, with separate access-token enforcement still needed.

Normal signing-key rotation can retain old verification keys: new signing keys alone do not reject tokens under an old trusted key. Emergency removal of a trusted key affects all tokens relying on it and needs a separate recovery plan; it is not selective session revocation.

## Review the revocation window

Original exercise: an access token expires at time 600. Logout records revocation at time 10; at time 12 an API still has status cached from time 0. This sensitive operation requires current session status. In this exercise, never convert unavailable status into permission. Refuse the operation until current status is established, and record the stale-consumer gap. These are exercise policy and timestamps, not measured propagation or universal availability defaults.

| Change | Evidence required before claiming enforcement |
| --- | --- |
| Logout or compromise | Revoked identity/scope, authoritative update and every consumer's observed version |
| Cached status | Explicit maximum age, invalidation path and behavior when that budget is exceeded |
| Refresh invalidation | Grant/token-family policy plus treatment of already-issued access tokens |
| Signing-key change | Which old keys consumers still trust and when that trust changes |

Trace another issuer with the same `jti`, an unknown status lookup, a failed revocation request and a consumer that missed an event. Specify authorized object access independently. Preserve evidence gaps rather than reporting logout as instantaneous everywhere. This is a review exercise: no token parser, authorization server or revocation endpoint is implemented, and no live credentials or security changes are required.

Complete the [API Boundary Checkpoint](/practice/system-design/api-boundary-checkpoint). When reviewing a diagram or security checklist, identify the exact boundary each mechanism protects before recommending it.
