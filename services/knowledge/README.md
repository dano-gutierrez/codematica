# Local knowledge runtime

This isolated Python service owns the Graphiti/Neo4j adapter, local embeddings, extraction checkpoints, staged evaluations and authenticated loopback REST/MCP interfaces. Markdown and JSON remain canonical. No web or native entrypoint imports this runtime.

Install/start/index/status commands and failure handling are in [the runbook](../../docs/runbooks/knowledge-evaluator.md); the [feature contract](../../docs/features/knowledge-evaluator.md) covers inventory, evidence, admin isolation and LinkedIn binding. `requirements.lock` and the Compose image digest are the reproducible runtime pins. Bulk extraction uses Graphiti's Qwen client plus source-validated node/episode/edge persistence; `Graphiti.add_episode` is a separate compatibility pilot path.

Private state lives under `.local/knowledge/`, excluded from Git. Tests use fake transports and isolated SQLite files; real compatibility and benchmark commands are explicit operator actions. The runtime never activates a hosted-provider fallback.

Retrieval combines BM25 lexical ranking with local embeddings. Source metadata is searchable evidence; it does not establish the contents of a linked book. Placement choices are paths or units, and insertion points must belong to the selected container. An unknown placement may identify an existing resource to update, but cannot invent an insertion order. The store and evaluation tests cover generic long-document noise, punctuation, source evidence, path/unit membership and unknown placement.
