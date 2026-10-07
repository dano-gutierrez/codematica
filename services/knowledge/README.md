# Local knowledge runtime

This isolated Python service owns the Graphiti/Neo4j adapter, local embeddings, extraction checkpoints, staged evaluations and authenticated loopback REST/MCP interfaces. Markdown and JSON remain canonical. No web or native entrypoint imports this runtime.

Install/start/index/status commands and failure handling are in [the runbook](../../docs/runbooks/knowledge-evaluator.md); the [feature contract](../../docs/features/knowledge-evaluator.md) covers inventory, evidence, admin isolation and LinkedIn binding. `requirements.lock` and the Compose image digest are the reproducible runtime pins. Bulk extraction uses Graphiti's Qwen client plus source-validated node/episode/edge persistence; `Graphiti.add_episode` is a separate compatibility pilot path.

Private state lives under `.local/knowledge/`, excluded from Git. Tests use fake transports and isolated SQLite files; real compatibility and benchmark commands are explicit operator actions. The runtime never activates a hosted-provider fallback.

For an alternate private runtime, set `KNOWLEDGE_STATE` for both API and MCP processes. The stdio smoke explicitly forwards this directory to its child; the MCP SDK's default environment does not retain arbitrary variables. No hosted or Supabase credentials are forwarded.

The TypeScript exporter keeps source records and local companions separate. Published document/exercise companions inherit the source node’s explicit unit position and scoped skills, matching the reader’s route. Missing or draft companions leave the source node as the external reading target.

Retrieval combines BM25 lexical ranking with local embeddings. Source metadata is searchable evidence; it does not establish the contents of a linked book. Placement choices are paths or units, and insertion points require explicit authored membership in the selected unit or the selected path’s units. Game/reference path tags and inferred edges cannot establish order. An unknown placement may identify an existing resource to update, but cannot invent an insertion order. The store and evaluation tests cover generic long-document noise, punctuation, source evidence, path/unit membership and unknown placement.

The catalog suite reuses one real parser result and deep-clones it per case. Mutation-isolation assertions protect draft companions and synthetic exercises; graph identities and fingerprints are still computed independently.

The v5 action rubric treats missing examples, exercises and corrections that share an existing lesson’s core objective as updates. A separate resource needs a distinct objective. Decision-cache identity preserves question and option order because the local judge’s letter readout depends on prompt layout; reordered probes must obtain new readouts. Probabilities remain uncalibrated and existing review holds stay in place.

Qwen extraction retries once against the original source and schema, with a compact validation note. It never forwards malformed assistant output into that retry. The `bounded-fresh-json-repair-v3` cache version distinguishes this transport policy; successful source-bound batch checkpoints remain reusable. The 3,000-token cap, finish-reason check, schema validation and verbatim evidence checks remain enforced. For the concepts/relationships schema, the retry prompt requests one concept, no relationships and a quote under 80 characters. The model may still fail these requests; repeated failure remains a visible coverage gap.

Qwen explanations are labeled as unverified interpretations of selected passages. Any nonempty `missing_material` list contains gap proposals, requires `needs_review`, and directs the reviewer to the complete matched resources. Complete extraction does not prove absence from bounded excerpts. Report metadata records `selected-passages-review-v1`; model prompts and inference cache identities remain unchanged. Exact text matches still bypass model explanation.
