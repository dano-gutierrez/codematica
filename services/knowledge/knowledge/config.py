import os
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[3]
STATE = Path(os.getenv("KNOWLEDGE_STATE", ROOT / ".local/knowledge"))
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
EMBED_REVISION = "5c38ec7c405ec4b44b94cc5a9bb96e735b38267a"
VERSIONS = {"embedding": f"{EMBED_MODEL}@{EMBED_REVISION}", "graphiti": "0.30.2", "rubric": "curriculum-overlap-v2", "explanation_prompt": "evidence-summary-v2", "extraction_prompt": "graphiti-concepts-v2", "writer_weights": "mlx-community/Qwen3-14B-4bit@a4d9b2df59d2c150bef02fcbe0d91046b7ca33a4", "judge_weights": "openjev/openjev-MLX-4bit@c59bf1eed7d8de0eb88105a0d5517c9b4a858e16", "licenses": "Graphiti/Neo4j/BGE/Qwen: Apache-2.0/GPL-3.0/MIT/Apache-2.0; OpenJev weights: CC-BY-NC-4.0"}

def loopback(value):
    url = urlparse(value)
    if url.scheme != "http" or url.hostname not in ["127.0.0.1", "::1"] or url.username or url.password or url.query or url.fragment or url.path not in ["", "/"]:
        raise ValueError("Inference endpoints must be loopback HTTP origins")
    return value.rstrip("/")

JUDGE = loopback(os.getenv("KNOWLEDGE_OPENJEV_URL", "http://127.0.0.1:8791"))
WRITER = loopback(os.getenv("KNOWLEDGE_QWEN_URL", "http://127.0.0.1:8793"))
os.environ["GRAPHITI_TELEMETRY_ENABLED"] = "false"
os.environ["EMBEDDING_DIM"] = "384"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

def token():
    path = STATE / "api-token"
    if not path.exists():
        import secrets
        STATE.mkdir(parents=True, exist_ok=True, mode=0o700)
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as f: f.write(secrets.token_urlsafe(32))
    return path.read_text().strip()
