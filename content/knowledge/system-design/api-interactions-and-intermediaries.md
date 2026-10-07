---
title: API Interactions And Intermediaries — Select A Contract
slug: system-design/api-interactions-and-intermediaries
summary: Compare resource, query, RPC, channel and callback requirements while separating proxy roles, admission, authorization and durable effects.
track: System Design
topic: API Contracts
difficulty: practitioner
tags: [api, graphql, grpc, proxies, authorization]
prerequisites: [system-design/request-identities-and-navigation, system-design/routing-decision-lab]
diagramRefs: []
sourceRefs: [boundary-rfc9110, boundary-graphql-security, boundary-grpc-core, boundary-rfc6455, boundary-fielding-rest]
status: published
---

## Compare requirements before API labels

A fictional library has a cacheable book representation, a client-selected reading dashboard, a typed internal scoring operation, a live collaboration channel and a later delivery notification. These are different interaction requirements; a list of "API styles" is not one mutually exclusive taxonomy.

[Fielding's REST chapter](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) describes architectural constraints, including stateless requests and a uniform interface. JSON over HTTP alone does not establish those constraints. GraphQL describes query/schema execution rather than requiring one transport. [gRPC's core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/) define services and unary/client/server/bidirectional streaming methods. [WebSocket, RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html), supplies a channel with its own framing; it does not define your durable document-edit semantics. A webhook is an application callback contract; its [authenticity and replay review](/docs/system-design/webhook-authenticity-and-replay) remains necessary.

## Name whose behalf an intermediary represents

[RFC 9110, section 3.7](https://www.rfc-editor.org/rfc/rfc9110.html), distinguishes a client-chosen forward proxy from a gateway/reverse proxy representing an origin service. The same process can perform different roles for different requests. Load balancing selects among eligible destinations; an API gateway may additionally enforce configured policy or translate interactions. These functions can coexist rather than being successive generations of the same architecture.

Draw a client-selected office proxy, an origin-facing gateway and two service instances. Label where TLS ends, which principal each hop sees, who supplies trusted identity and which service checks book permission. Hiding one address does not promise anonymity. A healthy selected instance still cannot bypass the resource's authorization or repair an overloaded shared database.

## Bound work and authority separately

The [GraphQL security guide](https://graphql.org/learn/security/) separates transport security from demand control, such as trusted operations and query limits. Selecting only two fields does not establish that the resolver reads only two cheap values or that the user owns those resources. A small response can require an expensive join or many nested lookups.

For the dashboard fixture, define permitted book IDs, maximum requested items, nested expansion limits, deadline and rejection behavior. Test an authorized cheap query, an unauthorized book with the same shape, and an authorized query that exceeds the work budget. Admission and authorization protect different contracts; one successful request does not prove either rule exists.

## Preserve uncertainty after a deadline

An original scoring trace has: server updates result version 8; response is delayed; client deadline expires. The gRPC lifecycle documentation distinguishes local success decisions and notes that cancellation does not roll back earlier changes. Mark the client outcome uncertain. Retrying needs a stable operation identity and reconciliation or another demonstrated idempotency contract, rather than "binary protocol means exactly once".

For a stream or callback, also record subscription ownership, bounded buffering, reconnect cursor, duplicate delivery and current authorization. A connected channel does not prove all messages arrived, and a HTTP 200 acknowledgement does not define an application's durable outcome. Reuse the existing traffic and webhook lessons instead of duplicating those state contracts here.

## Keep the selection receipt testable

Fill five columns for each library interaction: consumer requirement, chosen application contract, transport/compatibility, authority/work bound, and effect/recovery evidence. Explain why a cacheable representation and an internal bidirectional stream need different reviews without calling either universally faster or safer. SOAP, MQTT and AMQP require their own concrete protocol/client contracts; this worksheet is not a full implementation catalog of every named technology.

Complete the [API Interaction Checkpoint](/practice/system-design/api-interactions-and-intermediaries-checkpoint). This is original paper design practice; no SDK, proxy configuration, live callback or private data is sent to an external service.
