# Local knowledge runtime

This isolated Python service owns the Graphiti/Neo4j adapter, local embeddings, extraction checkpoints, staged evaluations and authenticated loopback REST/MCP interfaces. Markdown and JSON remain canonical. No web or native entrypoint imports this runtime.

Install/start/index/status commands and failure handling are in [the runbook](../../docs/runbooks/knowledge-evaluator.md); the [feature contract](../../docs/features/knowledge-evaluator.md) covers inventory, evidence, admin isolation and LinkedIn binding. `requirements.lock` and the Compose image digest are the reproducible runtime pins. Bulk extraction uses Graphiti's Qwen client plus source-validated node/episode/edge persistence; `Graphiti.add_episode` is a separate compatibility pilot path.

Private state lives under `.local/knowledge/`, excluded from Git. Tests use fake transports and isolated SQLite files; real compatibility and benchmark commands are explicit operator actions. The runtime never activates a hosted-provider fallback.

The TypeScript exporter keeps source records and local companions separate. Published document/exercise companions inherit the source node’s explicit unit position and scoped skills, matching the reader’s route. Missing or draft companions leave the source node as the external reading target.

Retrieval combines BM25 lexical ranking with local embeddings. Source metadata is searchable evidence; it does not establish the contents of a linked book. Placement choices are paths or units, and insertion points require explicit authored membership in the selected unit or the selected path’s units. Game/reference path tags and inferred edges cannot establish order. An unknown placement may identify an existing resource to update, but cannot invent an insertion order. The store and evaluation tests cover generic long-document noise, punctuation, source evidence, path/unit membership and unknown placement.

The catalog suite reuses one real parser result and deep-clones it per case. Mutation-isolation assertions protect draft companions and synthetic exercises; graph identities and fingerprints are still computed independently.
