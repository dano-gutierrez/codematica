---
title: Transport Streams And Tunnels — Name The Recovery Boundary
slug: system-design/transport-streams-and-tunnels
summary: Trace application streams, transport ordering, local link addresses and tunnel tradeoffs without claiming universal speed or reliability.
track: System Design
topic: Transport Contracts
difficulty: practitioner
tags: [http, tcp, udp, quic, tunnels]
prerequisites: [system-design/request-identities-and-navigation]
diagramRefs: []
sourceRefs: [boundary-rfc9293, boundary-rfc768, boundary-rfc9113, boundary-rfc9000, boundary-rfc9114, boundary-rfc826, boundary-chrome-push, boundary-dsvpn]
status: published
---

## Distinguish the unit from its delivery promise

[TCP, RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html), provides a reliable ordered byte stream; application message boundaries are separate. [UDP, RFC 768](https://www.rfc-editor.org/rfc/rfc768.html), carries datagrams without guaranteeing delivery or duplicate protection. A protocol built on UDP can add those mechanisms. "Uses UDP" therefore does not establish that the application has no recovery or ordering.

In an original fixture, messages A and B each contain ten bytes. A transport may split or combine their bytes into different segments or frames. A received packet, a complete application message, and a durable application effect are three distinct observations. Tie each acknowledgement in a diagram to the unit and component that produced it.

## Locate head-of-line blocking precisely

[HTTP/2, RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html), interleaves framed exchanges on streams over TCP. This addresses application-layer serialization but retains TCP's ordered-delivery boundary. Suppose bytes belonging to stream A are missing earlier in the shared TCP stream while later bytes for B have arrived. B's HTTP stream does not let TCP deliver around the missing byte range.

[QUIC version 1, RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html), supplies ordered delivery within streams and stream/connection flow control over UDP. [HTTP/3, RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html), maps HTTP onto QUIC. An unrelated stream may progress without waiting for the lost bytes of A, while connection congestion, application dependencies and field-compression dependencies can still constrain work. This is not a guarantee of independent bandwidth or lower latency on every network.

## Keep link identity and endpoint authority separate

For a fictional Ethernet/IPv4 LAN, a workstation sending toward a remote server first reaches its configured router. The frame names a local next-hop link address; it does not authenticate the remote application. [ARP, RFC 826](https://www.rfc-editor.org/rfc/rfc826.html), describes resolving a protocol address to an Ethernet address on the local network. Other links and IPv6 use their own mechanisms.

Draw workstation → router → remote service. Label the LAN frame's destination separately from the server's IP, port, TLS identity and application resource. Link-layer loss recovery, transport recovery and an application retry can coexist. None alone makes an uncertain state-changing request safe to repeat; reuse the [durable operation review](/docs/software-engineering/product-interview-durable-generation-architecture).

## Check negotiated features and tunnel assumptions

A protocol feature in an RFC is not evidence that a particular browser enables it. Chrome's [HTTP/2 server-push removal notice](https://developer.chrome.com/blog/removing-push) records disabling by default in Chrome 106. Pin the actual client and server before promising push behavior, connection limits or an optimization outcome.

The [DSVPN author's README](https://github.com/jedisct1/dsvpn) describes a TCP-restricted use case, a small tunnel and the author's practical congestion-control observations. The author also describes no external dependencies, modern cryptography using formally verified implementations, a shared secret, and platform-specific TUN/privilege requirements. Check those installation requirements against the chosen operating system; a claim about a cryptographic implementation does not independently audit the whole tunnel. Those observations are not a workload-independent performance guarantee. For an inner TCP flow inside a TCP tunnel, record both recovery loops, queue limits, congestion behavior and the permitted outer transport. Do not infer anonymity, authorization, unrestricted routing or universal performance from the VPN label.

## Review an original loss trace

Compare three paper traces: HTTP/2 A loses an earlier TCP byte range; HTTP/3 A loses stream bytes while B's required bytes arrive; an inner TCP flow is carried by a TCP tunnel with an outer loss. For each, identify the affected ordering boundary, missing evidence, and which other work may proceed. Add a shared congestion limit to the second trace and explain why per-stream delivery is not independent capacity.

Complete the [Transport Scope Checkpoint](/practice/system-design/transport-streams-and-tunnels-checkpoint). This exercise performs no capture, tunnel installation or network change, and certifies no transport benchmark. The [request identity lesson](/docs/system-design/request-identities-and-navigation) supplies the application target that these layers carry.
