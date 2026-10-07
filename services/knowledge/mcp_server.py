import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
import httpx
from knowledge.config import token

mcp = FastMCP("Codematica knowledge")
async def call(path, body=None):
    async with httpx.AsyncClient(timeout=60, follow_redirects=False, trust_env=False) as client:
        response = await client.request("POST" if body is not None else "GET", "http://127.0.0.1:8795" + path, json=body, headers={"Authorization": "Bearer " + token()})
        response.raise_for_status()
        return response.json()
@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True,openWorldHint=False))
async def search_knowledge(query: str, kind: str | None = None, limit: int = 20):
    """Search the complete current non-language catalog using local embeddings and text."""
    from urllib.parse import urlencode
    return await call("/v1/search?" + urlencode({"query": query, "limit": min(100, limit), **({"kind": kind} if kind else {})}))
@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True,openWorldHint=False))
async def get_resource(identifier: str):
    """Read a canonical resource with source hash, path, and full indexed text."""
    from urllib.parse import quote
    return await call("/v1/resources/" + quote(identifier, safe=""))
@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True,openWorldHint=False))
async def get_relationships(identifier: str):
    """Read evidence-backed neighboring curriculum relationships."""
    from urllib.parse import urlencode
    return await call("/v1/relationships?" + urlencode({"identifier": identifier}))
@mcp.tool(annotations=ToolAnnotations(readOnlyHint=False,destructiveHint=False,openWorldHint=False))
async def evaluate_candidate(title: str, body: str, kind: str = "document", existing_id: str | None = None, audience: str | None = None, difficulty: str | None = None):
    """Stage a local assessment. Does not edit, approve, publish, or call hosted models. Poll get_evaluation with the returned ID."""
    return await call("/v1/candidates", {"title": title, "body": body, "kind": kind, **({"existingId": existing_id} if existing_id else {}), **({"audience": audience} if audience else {}), **({"difficulty": difficulty} if difficulty else {})})
@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True,openWorldHint=False))
async def get_evaluation(identifier: str):
    """Read evaluation status and its source-bound recommendation."""
    from urllib.parse import quote
    return await call("/v1/evaluations/" + quote(identifier, safe=""))
if __name__ == "__main__": mcp.run(transport="stdio")
