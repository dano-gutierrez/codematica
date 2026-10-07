import asyncio
import hmac
import logging
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from pydantic import ConfigDict, field_validator
from .config import STATE, token
from .store import Store
from .models import Embeddings, LocalModels
from .evaluate import evaluate
from .graph import inferred_projection

class Candidate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=10, max_length=100000)
    kind: Literal["document", "section", "path", "unit", "skill", "exercise", "interview-collection", "interview-question", "solution", "diagram", "feed", "flashcard", "source", "concept", "post", "game-campaign", "game-level", "game-scenario", "interview-preparation"] = "document"
    audience: str | None = Field(default=None,max_length=1000)
    difficulty: str | None = Field(default=None,max_length=100)
    preferredPath: str | None = Field(default=None,max_length=300)
    existingId: str | None = Field(default=None,max_length=500)
    revisionId: str | None = Field(default=None,max_length=100)
    @field_validator("title","body")
    @classmethod
    def meaningful(cls,value,info):
        if len(value.strip()) < (10 if info.field_name=="body" else 1): raise ValueError("Candidate text must be meaningful")
        return value

def create_app(store=None, embeddings=None, models=None):
    store = store or Store(STATE / "state.sqlite")
    embeddings, models = embeddings or Embeddings(store), models or LocalModels(store)
    async def worker():
        while True:
            claimed = store.claim()
            if claimed:
                identifier, candidate, lease_token = claimed
                try:
                    async with asyncio.timeout(600): report = await evaluate(store, embeddings, models, candidate)
                    store.finish(identifier, lease_token, report)
                except Exception:
                    logging.exception("Local evaluation failed")
                    try: store.finish(identifier, lease_token, error="Local evaluation failed; inspect private service logs and model readiness.")
                    except ValueError: logging.warning("An expired local worker result was discarded")
            else: await asyncio.sleep(1)
    @asynccontextmanager
    async def lifespan(app):
        task = asyncio.create_task(worker())
        yield
        task.cancel()
        try: await task
        except asyncio.CancelledError: pass
    async def authorized(authorization: str = Header(default="")):
        if not hmac.compare_digest(authorization, "Bearer " + token()): raise HTTPException(401, "Local API token required")
    app = FastAPI(title="Codematica local knowledge", lifespan=lifespan, dependencies=[Depends(authorized)])
    @app.get("/v1/status")
    def status(): return {"running": True, **store.status()}
    @app.get("/v1/search")
    async def search(query: str, kind: str | None = None, limit: int = 20):
        scores = await asyncio.to_thread(embeddings.similarities, query)
        return store.search(query, min(100, max(1, limit)), kind, scores)
    @app.get("/v1/resources/{identifier:path}")
    def resource(identifier: str):
        result = store.resource(identifier)
        if result is None: raise HTTPException(404, "Resource not found")
        return {**result,"sections":[r for r in store.snapshot()["resources"] if r.get("parentId")==identifier],"relationships":store.relationships(identifier)["relationships"]}
    @app.get("/v1/relationships")
    def relationships(identifier: str, provenance: str | None = None):
        projection = inferred_projection(store) or {"relationships":[],"resources":[]}
        edges = [e for e in projection["relationships"] if identifier in [e["source"],e["target"]] and (not provenance or e["provenance"]==provenance)]
        ids = {identifier}|{v for e in edges for v in [e["source"],e["target"]]}
        return {"relationships":edges,"resources":[r for r in projection["resources"] if r["id"] in ids]}
    @app.post("/v1/candidates", status_code=202)
    def submit(candidate: Candidate): return {"id": store.new_job(candidate.model_dump(exclude_none=True)), "status": "pending"}
    @app.get("/v1/evaluations/{identifier}")
    def report(identifier: str):
        job = store.job(identifier)
        if not job: raise HTTPException(404, "Evaluation not found")
        return job
    @app.get("/v1/projection")
    def projection(): return inferred_projection(store)
    return app

app = create_app()
