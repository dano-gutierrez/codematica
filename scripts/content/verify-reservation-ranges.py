"""Verify authored room-date SQL in a disposable, local-only PostgreSQL container."""
from pathlib import Path
import hashlib
import json
import os
import re
import select
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]
IMAGE = "postgres@sha256:e38411452a464af89e5adadb8d223bf53b898d47d6ef918b2d58c08707350449"
HEADING = "## Protect room dates with an overlap constraint"


def run(args, **kwargs):
    return subprocess.run(args, text=True, capture_output=True, timeout=30, **kwargs)


def verify():
    document = (ROOT / "content/knowledge/system-design/fair-admission-and-reservations.md").read_text()
    assert document.count(HEADING) == 1, "Missing unique canonical room-date section"
    section = document.split(HEADING)[1].split("\n## ")[0]
    blocks = re.findall(r"^```sql\n(.*?)^```$", section, re.MULTILINE | re.DOTALL)
    assert len(blocks) == 3, "Expected setup, claim and guarded expiry fences"
    setup, claim, expire = blocks
    assert claim.count("'range-a'") == 1
    contender = claim.replace("'range-a'", "'range-b'").replace("'2026-10-10'", "'2026-10-11'").replace("'2026-10-12'", "'2026-10-13'")
    host = os.environ.get("DOCKER_HOST", "")
    assert not host or host.startswith("unix://"), "Lab requires a local Docker socket"
    context = run(["docker", "context", "inspect", "--format", "{{.Endpoints.docker.Host}}"])
    assert context.returncode == 0 and context.stdout.strip().startswith("unix://"), "Remote Docker contexts are not supported"
    name = "codematica-room-ranges-" + uuid.uuid4().hex
    base = ["docker", "exec", "-i", name, "psql", "-XAtq", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"]
    processes = []

    def query(statement):
        return run(base, input="SET statement_timeout = '10s';\n" + statement)

    def sql(statement):
        result = query(statement)
        assert result.returncode == 0, result.stderr
        return result.stdout.strip().splitlines()

    def rejected(statement, state):
        result = query(statement)
        assert result.returncode != 0 and f"ERROR:  {state}:" in result.stderr, result.stderr or result.stdout

    def reset():
        sql("TRUNCATE lab_room_holds;")

    def insert(key, room, stay, state="held"):
        # Every argument is a fixed test fixture, never candidate/user SQL.
        return f"INSERT INTO lab_room_holds (hold_id,room_id,stay,state,expires_tick) VALUES ('{key}',{room},{stay},'{state}',200) RETURNING hold_id;"

    try:
        started = run(["docker", "run", "--detach", "--rm", "--pull=never", "--name", name, "--network=none", "--tmpfs", "/var/lib/postgresql/data", "--env", "POSTGRES_HOST_AUTH_METHOD=trust", IMAGE])
        assert started.returncode == 0, started.stderr
        inspected = run(["docker", "inspect", name])
        assert inspected.returncode == 0, inspected.stderr
        container = json.loads(inspected.stdout)[0]
        assert container["HostConfig"]["NetworkMode"] == "none"
        assert not container["HostConfig"]["PortBindings"] and not container["HostConfig"]["Binds"]
        assert "/var/lib/postgresql/data" in container["HostConfig"]["Tmpfs"]
        assert all(mount["Type"] == "tmpfs" for mount in container["Mounts"])
        deadline = time.monotonic() + 25
        while True:
            entrypoint = run(["docker", "exec", name, "cat", "/proc/1/comm"])
            ready = run(["docker", "exec", name, "pg_isready", "-U", "postgres"])
            if entrypoint.returncode == 0 and entrypoint.stdout.strip() == "postgres" and ready.returncode == 0:
                break
            assert time.monotonic() < deadline, "Disposable database did not become ready"
            time.sleep(0.1)
        version = sql("SHOW server_version;")[0]
        assert version.startswith("17."), version
        sql(setup)
        sql(claim)
        overlap = "daterange('2026-10-11','2026-10-13','[)')"
        for state in ["held", "confirmed"]:
            rejected(insert("overlap", 7, overlap, state), "23P01")
        assert sql(insert("adjacent", 7, "daterange('2026-10-12','2026-10-14','[)')")) == ["adjacent"]
        assert sql(insert("other-room", 8, overlap)) == ["other-room"]
        # Invalid dates/room/state cannot bypass exclusion through NULL or empty values.
        for stay in ["'empty'::daterange", "daterange(NULL,'2026-10-12')", "daterange('2026-10-10',NULL)", "daterange('-infinity','2026-10-12')", "daterange('2026-10-10','infinity')"]:
            rejected(insert("invalid", 9, stay), "23514")
        rejected(insert("invalid", 9, "NULL"), "23502")
        rejected(insert("invalid", "NULL", overlap), "23502")
        rejected(insert("invalid", 9, overlap, "unknown"), "23514")
        rejected(insert("invalid", 9, overlap).replace("'held'", "NULL"), "23502")
        rejected(insert("invalid", 9, overlap).replace("'invalid'", "NULL"), "23502")
        rejected(insert("invalid", 9, overlap).replace(",'held',200", ",'held',NULL"), "23502")
        rejected("INSERT INTO lab_room_holds VALUES ('invalid',9," + overlap + ",'held',200,NULL);", "23502")
        rejected(claim, "23505")
        assert sql("SELECT count(*) FROM lab_room_holds;") == ["3"]
        reset()
        sql(claim)
        rejected(contender, "23P01")  # No automatic time-driven state transition.
        assert sql(expire) == ["range-a"]
        assert sql("SELECT state,version FROM lab_room_holds;") == ["expired|1"]
        assert sql(contender) == ["range-b"]
        assert sql(expire) == []
        rejected("UPDATE lab_room_holds SET state='held' WHERE hold_id='range-a';", "23P01")
        assert sql("SELECT hold_id,state,version FROM lab_room_holds ORDER BY hold_id;") == ["range-a|expired|1", "range-b|held|0"]
        # Independently challenge every guard of the canonical expiry transition.
        for field, value in [("hold_id", "'other'"), ("state", "'confirmed'"), ("version", "1"), ("expires_tick", "101")]:
            reset()
            sql(claim)
            sql(f"UPDATE lab_room_holds SET {field}={value};")
            before = sql("SELECT hold_id,state,version,expires_tick FROM lab_room_holds;")
            assert sql(expire) == [], field
            assert sql("SELECT hold_id,state,version,expires_tick FROM lab_room_holds;") == before, field
        reset()
        sql(claim)
        sql("UPDATE lab_room_holds SET expires_tick=99;")
        assert sql(expire) == ["range-a"]

        for outcome in ["COMMIT", "ROLLBACK"]:
            reset()
            owner = subprocess.Popen(base, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)
            processes.append(owner)
            owner.stdin.write(("SET statement_timeout='10s'; BEGIN; " + claim + " SELECT 'OWNER_READY';\n").encode())
            for expected in [b"range-a", b"OWNER_READY"]:
                assert select.select([owner.stdout], [], [], 10)[0], "Owner did not acquire the interval"
                assert owner.stdout.readline().strip() == expected
            other = subprocess.Popen(base, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            processes.append(other)
            other.stdin.write("SET application_name='room-range-contender'; SET statement_timeout='10s'; " + contender)
            other.stdin.close()
            other.stdin = None
            deadline = time.monotonic() + 8
            while sql("SELECT count(*) FROM pg_stat_activity WHERE application_name='room-range-contender' AND wait_event_type='Lock';") != ["1"]:
                assert other.poll() is None, "Contender finished before owner resolution"
                assert time.monotonic() < deadline, "Contender did not wait on the conflicting transaction"
                time.sleep(0.05)
            assert sql("SELECT count(*) FROM lab_room_holds;") == ["0"]
            owner.stdin.write((outcome + ";\n").encode())
            owner.stdin.close()
            assert owner.wait(timeout=10) == 0
            stdout, stderr = other.communicate(timeout=15)
            if outcome == "COMMIT":
                assert other.returncode != 0 and "ERROR:  23P01:" in stderr, stderr
                assert sql("SELECT hold_id FROM lab_room_holds;") == ["range-a"]
            else:
                assert other.returncode == 0 and stdout.strip() == "range-b", stderr
                assert sql("SELECT hold_id FROM lab_room_holds;") == ["range-b"]
        return {"image": IMAGE, "server_version": version, "markdown_sha256": hashlib.sha256(document.encode()).hexdigest(), "network": "none", "storage": "tmpfs", "checks": ["held/confirmed overlap", "adjacency", "different rooms", "invalid ranges and fields", "explicit expiry and reactivation", "expiry guard partitions", "concurrent commit rejection", "concurrent rollback acquisition"]}
    finally:
        for process in processes:
            if process.poll() is None:
                process.kill()
                process.wait(timeout=10)
            for stream in [process.stdin, process.stdout, process.stderr]:
                if stream is not None:
                    stream.close()
        removed = run(["docker", "rm", "--force", name])
        assert removed.returncode == 0 or "No such container" in removed.stderr, removed.stderr
        remaining = run(["docker", "container", "ls", "--all", "--quiet", "--filter", f"name=^{name}$"])
        assert remaining.returncode == 0 and not remaining.stdout.strip(), "Disposable lab container survived cleanup"


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
