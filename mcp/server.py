"""
MCP bridge for mcp-memory: exposes `search` and `fetch` over SSE.
Env:
  BASE_URL=http://localhost:7070
  DEFAULT_COLLECTION=notes
"""
import os, logging, httpx
from typing import Dict, Any, List
from fastmcp import FastMCP

log = logging.getLogger("mcp-bridge")
logging.basicConfig(level=logging.INFO)

BASE_URL = os.getenv("BASE_URL", "http://localhost:7070").rstrip("/")
DEFAULT_COLLECTION = os.getenv("DEFAULT_COLLECTION", "notes")

mcp = FastMCP(name="mcp-memory", instructions="Vector-store search and fetch over MCP")

@mcp.tool()
async def search(query: str, collection: str = DEFAULT_COLLECTION, k: int = 5, **_) -> Dict[str, List[Dict[str, Any]]]:
    if not query or not query.strip():
        return {"results": []}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{BASE_URL}/query", json={"collection": collection, "query": query, "k": k})
        r.raise_for_status()
        data = r.json().get("result", [])
    results = []
    for i, it in enumerate(data):
        results.append({
            "id": str(it.get("id", i)),
            "title": it.get("metadata", {}).get("title") or f"Document {it.get('id', i)}",
            "url": f"{BASE_URL}/doc?collection={collection}&id={it.get('id')}"
        })
    return {"results": results}

@mcp.tool()
async def fetch(id: str, collection: str = DEFAULT_COLLECTION, **_) -> Dict[str, Any]:
    if not id:
        raise ValueError("id required")
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{BASE_URL}/doc", params={"collection": collection, "id": id})
    if r.status_code == 404:
        raise ValueError("not found")
    r.raise_for_status()
    doc = r.json()["doc"]
    return {
        "id": str(doc.get("id")),
        "title": doc.get("title") or f"doc:{id}",
        "text": doc.get("text") or "",
        "url": doc.get("url") or f"{BASE_URL}/doc?collection={collection}&id={id}",
        "metadata": doc.get("metadata") or {}
    }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    log.info(f"Starting MCP SSE on {host}:{port} → backing {BASE_URL}")
    mcp.run(transport="sse", host=host, port=port)
