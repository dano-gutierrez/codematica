import argparse
import asyncio
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from .config import ROOT, STATE, token, EMBED_MODEL, EMBED_REVISION
from .store import Store, extraction_resources, extraction_batches

def compose(*args):
    subprocess.run(["docker", "compose", "--env-file", str(STATE / "neo4j.env"), "-f", str(ROOT / "services/knowledge/compose.yaml"), *args], check=True)

async def index(args):
    from .models import Embeddings
    from .graph import GraphBackend
    store = Store(STATE / "state.sqlite")
    snapshot = json.loads(Path(args.file).read_text())
    embeddings = Embeddings(store)
    graph = GraphBackend(store, embeddings)
    try:
        await graph.project(snapshot)
        store.activate(snapshot)
        print(json.dumps(store.status()), flush=True)
        if args.extract:
            for i, resource in enumerate(extraction_batches(snapshot)):
                try: await graph.extract_batch(resource)
                except Exception as e: print(json.dumps({"resources": [r["id"] for r in resource], "error": type(e).__name__}), flush=True)
                if i % 5 == 0: print(json.dumps({"progress": i + 1, **store.status()}), flush=True)
                if args.limit and i + 1 >= args.limit: break
        status=store.status();print(json.dumps(status), flush=True)
        if args.extract and not args.limit and not status["semantic_complete"]: raise SystemExit("Semantic extraction incomplete; rerun to retry the visible gaps")
    finally: await graph.close()

def owned():
    try:
        record = json.loads((STATE / "service.json").read_text())
        start = subprocess.check_output(["ps", "-p", str(record["pid"]), "-o", "lstart="], text=True).strip()
        return record["pid"] if start and start == record["started"] else None
    except (OSError, ValueError, subprocess.CalledProcessError): return None

def main():
    parser = argparse.ArgumentParser(description="On-demand Codematica knowledge service")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ["setup", "start", "stop", "status", "serve"]: sub.add_parser(name)
    idx = sub.add_parser("index"); idx.add_argument("file"); idx.add_argument("--extract", action="store_true"); idx.add_argument("--limit", type=int)
    args = parser.parse_args()
    STATE.mkdir(parents=True, exist_ok=True, mode=0o700)
    if args.command == "setup":
        import secrets
        path = STATE / "neo4j.env"
        if not path.exists():
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w") as f: f.write("KNOWLEDGE_NEO4J_PASSWORD=" + secrets.token_urlsafe(32) + "\n")
        token()
        from huggingface_hub import snapshot_download
        snapshot_download(EMBED_MODEL, revision=EMBED_REVISION, local_dir=STATE / "embedding-model", allow_patterns=["*.json", "*.txt", "*.safetensors", "1_Pooling/*"], ignore_patterns=["onnx/*", "openvino/*"])
        compose("up", "-d", "--wait")
    elif args.command == "index": asyncio.run(index(args))
    elif args.command == "serve":
        import uvicorn
        uvicorn.run("knowledge.api:app", host="127.0.0.1", port=8795, access_log=False)
    elif args.command == "start":
        if owned(): print("Knowledge service already managed here"); return
        import socket
        with socket.socket() as sock: sock.bind(("127.0.0.1", 8795))
        compose("up", "-d", "--wait")
        env = {key: value for key, value in os.environ.items() if key in ["HOME", "PATH", "TMPDIR", "LANG", "PYTHONPATH", "KNOWLEDGE_STATE", "KNOWLEDGE_OPENJEV_URL", "KNOWLEDGE_QWEN_URL", "CODEMATICA_INFERENCE_LOCK"]}
        env.update(HF_HUB_OFFLINE="1", PYTHONUNBUFFERED="1")
        with os.fdopen(os.open(STATE / "service.log", os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600), "ab") as log:
            process = subprocess.Popen([sys.executable, str(ROOT / "services/knowledge/run.py"), "serve"], env=env, stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
        started = subprocess.check_output(["ps", "-p", str(process.pid), "-o", "lstart="], text=True).strip()
        (STATE / "service.json").write_text(json.dumps({"pid": process.pid, "started": started}))
        print("Started local knowledge service on 127.0.0.1:8795; check status for readiness")
    elif args.command == "stop":
        pid = owned()
        if pid: os.kill(pid, signal.SIGTERM)
        compose("stop")
        print("Stopped this service and its database; persistent data retained")
    else:
        import urllib.request
        request = urllib.request.Request("http://127.0.0.1:8795/v1/status", headers={"Authorization": "Bearer " + token()})
        try:
            with urllib.request.urlopen(request, timeout=10) as r: print(json.dumps(json.load(r)))
        except OSError: print(json.dumps({"running": False, **Store(STATE / "state.sqlite").status()}))

if __name__ == "__main__": main()
