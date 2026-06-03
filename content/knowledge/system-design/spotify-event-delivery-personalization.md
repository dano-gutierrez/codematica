---
title: Spotify Event Delivery And Personalization
slug: system-design/spotify-event-delivery-personalization
summary: A source-backed case study of how Spotify isolates listen events, delivers durable data, and feeds analytics and personalization workflows.
track: System Design
topic: Real Systems
difficulty: senior
tags:
  - real-systems
  - event-delivery
  - personalization
  - data-platforms
prerequisites:
  - publish-subscribe systems
  - ETL pipelines
  - analytics warehouses
diagramRefs:
  - system-design/spotify-event-delivery-personalization
  - system-design/streaming-feedback-blueprint
caseStudyFlowRef: system-design/spotify-event-delivery-personalization
status: published
---

## Core System Pressure

Spotify needs to understand listening behavior, ads, playlists, crashes, royalties, A/B tests, artist launches, and product metrics. The same event infrastructure supports personalization surfaces such as Discover Weekly, business-critical reporting, and artist-facing analytics.

Spotify's public engineering posts describe a migration from a Kafka-based event delivery system to a GCP-based design using Cloud Pub/Sub. The important system-design choice is early isolation: each event type gets its own Pub/Sub topic, ETL process, and final storage location. That lets noisy event types degrade independently instead of blocking the whole data platform.

## Architecture Map

The high-level shape is:

- Clients and services emit typed events.
- Event Service parses and recognizes event types, then rejects malformed or unknown events.
- Cloud Pub/Sub carries isolated topics for each event type.
- Dedicated ETL jobs close immutable hourly buckets and deliver data to durable storage.
- Cloud Storage and BigQuery serve analysts, data scientists, product managers, and engineers.
- Dataflow appears in the sensitive-data processing path, and Spotify's newer lakehouse direction uses BigLake and Iceberg-compatible access.
- Analytics and feature pipelines feed discovery, ads, product experiments, royalties, and artist insights.

## Streaming Path

Spotify's GCP event delivery system prioritizes event-type isolation. Public posts describe over 500 distinct event types, each with independent topics, ETL, storage configuration, priorities, and SLOs. The strictest SLOs are still hours, not milliseconds, because this pipeline is primarily reliable event delivery for downstream data consumers rather than per-request online serving.

This is a useful contrast with Uber. Uber needs many marketplace decisions in seconds. Spotify's event delivery system emphasizes durable, isolated, audited delivery so data consumers can trust the closed buckets they read later.

## Batch And Warehouse Path

Spotify's ETL path writes durable data to Cloud Storage and BigQuery. The older Pub/Sub export post explains the bucket-closing problem: late events, deduplication, and hourly immutability must be handled so downstream jobs see consistent data.

The modern lakehouse direction is also public. Google Cloud quotes Spotify using BigLake and BigLake metastore to build an Iceberg-based platform where data is accessible from BigQuery, Dataflow, and open-source Iceberg-compatible engines. The architecture lesson is that warehouse convenience and open table formats can coexist when the platform standardizes metadata and access.

## ML And Product Feedback Loop

The event delivery system makes personalization measurable and repeatable. Listening behavior and product interactions become data products that can feed discovery surfaces, daily mixes, ad targeting, A/B analysis, and artist-facing analytics.

Spotify's own 2019 Event Delivery post reports more than 500 distinct event types, more than 350 TB of raw event data daily, and more than 8M events per second at peak. Those numbers are enough to make the design point: isolation, schema ownership, and operational SLOs matter before model sophistication.

## Failure Modes

- A popular feature can create a sudden event-volume spike that exhausts quotas or delays delivery.
- If event types are not isolated, a noisy low-priority stream can delay royalty or core metric data.
- Late events can make hourly buckets inconsistent unless closing and deduplication are explicit.
- Sensitive fields can leak unless schemas carry privacy annotations and storage policies.
- Cost can grow faster than product traffic when teams instrument more events than they can use.

## Design Takeaways

- Isolate event types early when teams have different ownership, volume, and business impact.
- Make bucket closing and deduplication part of the data contract.
- Prefer liveness over global blocking when delayed data from one stream should not stop all others.
- Use managed services where they remove undifferentiated work, but expect to hit scale-specific edges.
- Track event production cost because easy instrumentation can become waste.

## References

- [Spotify's Event Delivery: Life in the Cloud](https://engineering.atspotify.com/2019/11/spotifys-event-delivery-life-in-the-cloud)
- [Reliable Export of Cloud Pub/Sub Streams to Cloud Storage](https://engineering.atspotify.com/2017/04/26/reliable-export-of-cloud-pubsub-streams-to-cloud-storage/)
- [BigLake Metastore Now Supports Iceberg REST Catalog](https://cloud.google.com/blog/products/data-analytics/biglake-metastore-now-supports-iceberg-rest-catalog)
- [Big Data Processing at Spotify: The Road to Scio](https://engineering.atspotify.com/2017/10/big-data-processing-at-spotify-the-road-to-scio-part-1)
