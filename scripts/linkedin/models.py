#!/usr/bin/env python3
"""Manual lifecycle for loopback-only Apple Silicon editorial models. No database access."""
import argparse
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / ".local/linkedin/runtime"
PORTS = {"judge": 8791, "writer": 8793}


def process_start(pid):
    return subprocess.run(["ps", "-p", str(pid), "-o", "lstart="], capture_output=True, text=True, check=False).stdout.strip()


def owned(name):
    try:
        record = json.loads((RUNTIME / f"{name}.json").read_text())
        return record["pid"] if record["started"] and process_start(record["pid"]) == record["started"] else None
    except (OSError, ValueError, KeyError):
        return None


def save(path, value):
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as target:
        json.dump(value, target)


def launch(name, command):
    if owned(name):
        print(f"{name}: already managed here")
        return
    with socket.socket() as sock:
        try:
            sock.bind(("127.0.0.1", PORTS[name]))
        except OSError:
            raise SystemExit(f"Port {PORTS[name]} is already occupied. Reuse that server or stop it through its owner; no process was changed.")
    cache = RUNTIME / "hf-cache"
    (cache / "hub").mkdir(parents=True, exist_ok=True, mode=0o700)
    env = {k: v for k, v in os.environ.items() if k in ("PATH", "HOME", "TMPDIR", "LANG", "LC_ALL")}
    env.update(HF_HOME=str(cache), HF_HUB_OFFLINE="1", HF_HUB_DISABLE_TELEMETRY="1", TOKENIZERS_PARALLELISM="false", PYTHONUNBUFFERED="1")
    with os.fdopen(os.open(RUNTIME / f"{name}.log", os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600), "ab") as log:
        process = subprocess.Popen(command, cwd=ROOT, env=env, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    save(RUNTIME / f"{name}.json", {"pid": process.pid, "started": process_start(process.pid)})
    print(f"{name}: started (PID {process.pid}); use status to check readiness")
    return process


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="action", required=True)
    configure = sub.add_parser("configure")
    for option in ("python", "judge", "writer", "profile"):
        configure.add_argument("--" + option, required=True, type=Path)
    for action in ("start", "stop", "status"):
        sub.add_parser(action).add_argument("--only", choices=PORTS)
    args = parser.parse_args()
    RUNTIME.mkdir(parents=True, exist_ok=True, mode=0o700)
    if args.action == "configure":
        config = {key: str(getattr(args, key).expanduser().resolve(strict=True)) for key in ("python", "judge", "writer", "profile")}
        if not Path(config["python"]).is_file():
            raise SystemExit("--python must name the installed virtual environment's Python executable")
        # Preserve the venv path: resolving its symlink would run the system interpreter.
        config["python"] = str(args.python.expanduser().absolute())
        save(RUNTIME / "config.json", config)
        print("Saved private local model paths. Nothing started.")
        return
    names = [args.only] if args.only else list(PORTS)
    for name in names:
        if args.action == "stop":
            pid = owned(name)
            if pid:
                os.kill(pid, signal.SIGTERM)
                print(f"{name}: stop requested")
            else:
                print(f"{name}: no process owned by this checkout")
        elif args.action == "status":
            try:
                path = "/readyz" if name == "judge" else "/v1/models"
                with urllib.request.urlopen(f"http://127.0.0.1:{PORTS[name]}{path}", timeout=5) as response:
                    json.load(response)
                print(f"{name}: ready ({'managed here' if owned(name) else 'external local process'})")
            except (OSError, ValueError):
                print(f"{name}: unavailable; inspect {RUNTIME / (name + '.log')}")
        else:
            config = json.loads((RUNTIME / "config.json").read_text())
            if name == "judge":
                command = [str(Path(config["python"]).parent / "openjev"), "serve", "--backend", "mlx", "--model", config["judge"], "--profile", config["profile"], "--host", "127.0.0.1", "--port", str(PORTS[name])]
            else:
                command = [config["python"], "-m", "mlx_lm.server", "--model", config["writer"], "--host", "127.0.0.1", "--port", str(PORTS[name]), "--chat-template-args", '{"enable_thinking":false}']
            launch(name, command)


if __name__ == "__main__":
    main()
