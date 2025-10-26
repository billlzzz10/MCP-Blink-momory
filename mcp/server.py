import os
from typing import Any, Dict, List

import httpx
from fastmcp import FastMCP

MEMORY_URL = os.getenv('MEMORY_URL', 'http://127.0.0.1:3000')
DEFAULT_COLLECTION = os.getenv('MEMORY_COLLECTION', 'default')
DEFAULT_QUERY_LIMIT = 5
MAX_QUERY_LIMIT = 50

mcp = FastMCP('blink-memory-bridge')


def _normalize_limit(value: Any) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return DEFAULT_QUERY_LIMIT
    return max(1, min(parsed, MAX_QUERY_LIMIT))


async def _post(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    timeout = int(os.getenv('MEMORY_TIMEOUT', '30'))
    async with httpx.AsyncClient(timeout=timeout) as client:
        # Validate MEMORY_URL to prevent SSRF attacks
        if not MEMORY_URL.startswith(('', '', '', '')):
            raise ValueError("MEMORY_URL must point to localhost for security")
        response = await client.post(f"{MEMORY_URL}{path}", json=payload)
        response.raise_for_status()
        data = response.json()
        if not data.get('ok'):
            raise RuntimeError(data.get('error') or 'memory server error')
        return data['result']


async def _get(path: str, params: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{MEMORY_URL}{path}", params=params)
        response.raise_for_status()
        data = response.json()
        if not data.get('ok'):
            raise RuntimeError(data.get('error') or 'memory server error')
        return data.get('result') or data.get('stats') or data


@mcp.tool()
async def search_memory(collection: str = DEFAULT_COLLECTION, query: str = '', limit: int = DEFAULT_QUERY_LIMIT) -> List[Dict[str, Any]]:
    if not (query and str(query).strip()):
        raise ValueError('query is required')
    normalized_limit = _normalize_limit(limit)
    result = await _post('/query', {
        'collection': collection,
        'query': query,
        'k': normalized_limit,
    })
    return result['results']


@mcp.tool()
async def fetch_memory_document(collection: str = DEFAULT_COLLECTION, document_id: str = '') -> Dict[str, Any]:
    if not (document_id and str(document_id).strip()):
        raise ValueError('document_id is required')
    result = await _get('/doc', {
        'collection': collection,
        'id': document_id,
    })
    return result['item']


@mcp.tool()
async def list_memory_collections() -> List[str]:
    data = await _get('/collections', {})
    if isinstance(data, dict) and 'collections' in data:
        return data['collections']
    if isinstance(data, list):
        return data
    return []


def main() -> None:
    mcp.run()


if __name__ == '__main__':
    main()
