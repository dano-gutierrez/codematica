import hashlib
import json
import sqlite3
import time
import uuid
from pathlib import Path
from contextlib import contextmanager

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()

class Store:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.path = path
        with self.connect() as db:
            db.executescript("""
              pragma journal_mode=WAL;
              create table if not exists snapshots(id text primary key, data text not null, created real not null);
              create table if not exists active(singleton integer primary key check(singleton=1), snapshot text not null);
              create table if not exists cache(key text primary key, data text not null);
              create table if not exists vectors(key text primary key, data text not null);
              create table if not exists extraction(key text primary key, status text not null, data text, updated real not null);
              create table if not exists jobs(id text primary key, candidate text not null, snapshot_id text, status text not null, report text, error text, reviewed text, updated real not null, attempts integer default 0);
            """)
            if "lease_token" not in [row[1] for row in db.execute("pragma table_info(jobs)")]: db.execute("alter table jobs add column lease_token text")
        path.chmod(0o600)
    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=30)
        db.row_factory = sqlite3.Row
        try:
            with db: yield db
        finally: db.close()
    def snapshot(self):
        with self.connect() as db:
            row = db.execute("select data from snapshots join active on snapshots.id=active.snapshot where singleton=1").fetchone()
            return json.loads(row[0]) if row else None
    def activate(self, snapshot):
        ids = [r["id"] for r in snapshot["resources"]]
        if len(set(ids)) != len(ids) or any(e["source"] not in ids or e["target"] not in ids for e in snapshot["relationships"]):
            raise ValueError("Invalid graph references or duplicate identifiers")
        with self.connect() as db:
            existing = db.execute("select data from snapshots where id=?",(snapshot["id"],)).fetchone()
            if existing and json.loads(existing[0]) != snapshot: raise ValueError("Immutable snapshot differs")
            db.execute("insert into snapshots values(?,?,?) on conflict(id) do nothing", (snapshot["id"], json.dumps(snapshot), time.time()))
            db.execute("insert into active values(1,?) on conflict(singleton) do update set snapshot=excluded.snapshot", (snapshot["id"],))
    def status(self):
        current = self.snapshot()
        if not current: return {"snapshot_id": None, "counts": {}, "semantic_complete": False, "retired": 0}
        resources = current["resources"]
        with self.connect() as db:
            historical = set()
            for row in db.execute("select data from snapshots"):
                historical.update(r["id"] for r in json.loads(row[0])["resources"])
            extraction = {row[0]: (row[1], json.loads(row[2]) if row[2] else {}) for row in db.execute("select key,status,data from extraction")}
            states = {key: value[0] for key,value in extraction.items()}
        keys = [batch_key(batch) for batch in extraction_batches(current)]
        complete = sum(states.get(k) == "complete" for k in keys)
        rejected = sum((extraction.get(k,(None,{}))[1] or {}).get("rejected",0) for k in keys)
        return {"snapshot_id": current["id"], "counts": current["counts"], "exclusions": current["exclusions"], "unresolved": current.get("unresolved", []), "source_revision": current.get("sourceRevision"), "dirty": current.get("dirty"), "semantic_complete": bool(keys) and complete == len(keys), "extracted": complete, "extraction_total": len(keys), "extraction_errors": sum(states.get(k) == "failed" for k in keys), "rejected_evidence": rejected, "retired": len(historical - {r["id"] for r in resources})}
    def resource(self, identifier):
        return next((r for r in (self.snapshot() or {}).get("resources", []) if r["id"] == identifier), None)
    def relationships(self, identifier, provenance=None):
        current = self.snapshot() or {"relationships": [], "resources": []}
        edges = [e for e in current["relationships"] if identifier in [e["source"], e["target"]] and (not provenance or e["provenance"] == provenance)]
        ids = {identifier} | {v for e in edges for v in [e["source"], e["target"]]}
        return {"relationships": edges, "resources": [r for r in current["resources"] if r["id"] in ids]}
    def search(self, query, limit=20, kind=None, vectors=None):
        words = set(query.casefold().split())
        out = []
        for r in (self.snapshot() or {}).get("resources", []):
            if kind and r["kind"] != kind: continue
            terms = set((r["title"] + " " + r["text"]).casefold().split())
            lexical = len(words & terms) / max(1, len(words)) + (1 if query.casefold() in r["title"].casefold() else 0)
            semantic = (vectors or {}).get(r["id"], 0)
            score = lexical * .45 + max(0, semantic) * .55
            if score > 0: out.append({**r, "score": score})
        return sorted(out, key=lambda r: (-r["score"], r["id"]))[:limit]
    def cache_get(self, key):
        with self.connect() as db:
            row = db.execute("select data from cache where key=?", (key,)).fetchone()
            return json.loads(row[0]) if row else None
    def cache_put(self, key, data):
        with self.connect() as db: db.execute("insert or replace into cache values(?,?)", (key, json.dumps(data)))
    def vector_get(self, key):
        with self.connect() as db:
            row = db.execute("select data from vectors where key=?", (key,)).fetchone()
            return json.loads(row[0]) if row else None
    def vector_put(self, key, vector):
        with self.connect() as db: db.execute("insert or replace into vectors values(?,?)", (key, json.dumps(vector)))
    def extraction_get(self, key):
        with self.connect() as db:
            row = db.execute("select status,data from extraction where key=?", (key,)).fetchone()
            return {"status": row[0], "data": json.loads(row[1]) if row[1] else None} if row else {}
    def extraction_put(self, key, status, data=None):
        with self.connect() as db: db.execute("insert or replace into extraction values(?,?,?,?)", (key, status, json.dumps(data), time.time()))
    def new_job(self, candidate):
        identifier = str(uuid.uuid4())
        with self.connect() as db: db.execute("insert into jobs(id,candidate,snapshot_id,status,updated) values(?,?,?,'pending',?)", (identifier, json.dumps(candidate), self.status()["snapshot_id"], time.time()))
        return identifier
    def claim(self):
        with self.connect() as db:
            db.execute("begin immediate")
            db.execute("update jobs set status='failed',error='Local evaluation exhausted retries' where status='running' and updated<? and attempts>=3", (time.time() - 900,))
            db.execute("update jobs set status='pending' where status='running' and updated<? and attempts<3", (time.time() - 900,))
            row = db.execute("select id,candidate from jobs where status='pending' and attempts<3 order by updated limit 1").fetchone()
            if not row: return None
            token = str(uuid.uuid4())
            db.execute("update jobs set status='running',attempts=attempts+1,updated=?,lease_token=? where id=?", (time.time(), token, row[0]))
            return row[0], json.loads(row[1]), token
    def finish(self, identifier, lease_token, report=None, error=None):
        with self.connect() as db:
            updated = db.execute("update jobs set status=?,report=?,error=?,updated=?,lease_token=null where id=? and status='running' and lease_token=? and updated>=?", ("failed" if error else "succeeded", json.dumps(report) if report else None, error, time.time(), identifier, lease_token, time.time()-900))
            if updated.rowcount != 1: raise ValueError("Expired local evaluation lease")
    def job(self, identifier):
        with self.connect() as db:
            row = db.execute("select * from jobs where id=?", (identifier,)).fetchone()
            if not row: return None
            out = dict(row)
            out.pop("lease_token",None)
            for key in ["report", "candidate"]: out[key] = json.loads(out[key]) if out[key] else None
            return out
    def approve(self, identifier, candidate_hash, snapshot_id, decision="accept"):
        with self.connect() as db:
            db.execute("begin immediate")
            row = db.execute("select report,status from jobs where id=?", (identifier,)).fetchone()
            report = json.loads(row[0]) if row and row[0] else None
            active = db.execute("select snapshot from active where singleton=1").fetchone()
            if not report or row[1] != "succeeded" or report["candidate_hash"] != candidate_hash or report["snapshot_id"] != snapshot_id or not active or active[0] != snapshot_id:
                raise ValueError("Stale evaluation; evaluate the current candidate and snapshot again")
            if decision not in ["accept", "reject"]: raise ValueError("Invalid review decision")
            db.execute("update jobs set reviewed=? where id=?", (decision, identifier))
        return report

from .config import VERSIONS
EXTRACTION_VERSION = digest([VERSIONS["graphiti"], VERSIONS["writer_weights"], VERSIONS["extraction_prompt"]])
def extraction_resources(snapshot):
    section_parents = {r.get("parentId") for r in snapshot["resources"] if r["kind"] == "section"}
    return [r for r in snapshot["resources"] if r["kind"] in ["section", "exercise", "interview-question", "solution", "flashcard", "post", "game-campaign", "game-level", "game-scenario"] or (r["kind"] == "document" and r["id"] not in section_parents)]
def extraction_key(resource): return digest([EXTRACTION_VERSION, resource["id"], resource["hash"], resource["text"]])

def extraction_batches(snapshot):
    """Pack small sections together; do not extract question solutions twice."""
    parents = {r["id"] for r in snapshot["resources"] if r["kind"] == "interview-question"}
    resources = [r for r in extraction_resources(snapshot) if not (r["kind"] == "solution" and r.get("parentId") in parents)]
    batches, current, size = [], [], 0
    for r in resources:
        for offset in range(0, len(r["text"]), 5000):
            part = {**r, "text": r["text"][offset:offset+5000], "offset": offset}
            if current and (size + len(part["text"]) > 5000 or r["visibility"] != current[0]["visibility"]):
                batches.append(current); current, size = [], 0
            current.append(part); size += len(part["text"])
    if current: batches.append(current)
    return batches

def batch_key(batch): return digest([EXTRACTION_VERSION, "bounded-pass-v3", [(r["id"], r["hash"], r["offset"], r["text"]) for r in batch]])
