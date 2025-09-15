# Memory System API Documentation

This document outlines the API endpoints for the new memory system.

## Memory Endpoints

### `POST /memory/put`

Stores a single memory item.

**Request Body:**
A `Memory item` JSON object. See schema below.

**Example:**
```json
{
  "type": "note",
  "scope": "document",
  "text": "This is a summary of the first three paragraphs.",
  "docHash": "base64url_encoded_hash_of_document",
  "tags": ["summary", "draft1"]
}
```

### `POST /memory/batch_put`

Stores multiple memory items in a single call.

**Request Body:**
```json
{
  "items": [
    { "type": "note", "scope": "chat", "text": "User is asking about pricing." },
    { "type": "decision", "scope": "board", "text": "Decided to use the new API." }
  ]
}
```

### `POST /memory/search`

Performs a hybrid search using both keyword (BM25) and vector (cosine similarity) search.

**Request Body:**
```json
{
  "query": "information about the new API",
  "topK": 5,
  "filters": {
    "scope": ["document", "chat"],
    "tags": ["api", "decision"],
    "docHash": "base64url_encoded_hash_of_document"
  },
  "hybrid": { "bm25": 0.5, "cosine": 0.5 }
}
```

## Cache Endpoints

### `POST /cache/get`

Retrieves an item from the cache.

**Request Body:**
```json
{
  "key": "model:docHash:promptHash",
  "scope": "document"
}
```

### `POST /cache/set`

Adds or updates an item in the cache.

**Request Body:**
A `Cache record` JSON object. See schema below.

**Example:**
```json
{
  "key": "gpt4o:docHashABC:prompt123",
  "scope": "document",
  "output": { "text": "This is the generated summary." },
  "usage": { "tokens_in": 250, "tokens_out": 150 },
  "ttl_ms": 3600000
}
```

### `POST /cache/evict`

Evicts items from the cache. Can evict by a single key, a prefix, or clear an entire scope.

**Request Body:**
```json
{
  "scope": "document",
  "prefix": "gpt4o:docHashABC"
}
```

## Runlog Endpoint

### `POST /runlog/put`

Stores a single run log entry, representing one step in an AI's operation.

**Request Body:**
A `Runlog` JSON object. See schema below.

**Example:**
```json
{
  "phase": "generate",
  "model": "gpt-4o",
  "tokens_in": 250,
  "tokens_out": 150,
  "latency_ms": 1850,
  "status": "ok",
  "message": "Generated summary for document."
}
```

## Stats Endpoint

### `POST /stats/query`

Retrieves aggregated statistics about the system's operation.

**Request Body:**
```json
{
  "type": "token_usage"
}
```
**Valid `type` values:** `token_usage`, `cache_performance`, `phase_latency`.

---

## Data Schemas

### Memory Item Schema
```json
{
  "id": "string (ulid)",
  "type": "note|decision|summary|citation|plan|state",
  "scope": "chat|document|editor|board|workspace",
  "text": "string",
  "rich": { "doc": {}, "board": [] },
  "docHash": "string (base64url)",
  "editorHash": "string (base64url)",
  "boardHash": "string (base64url)",
  "tags": ["string"],
  "links": [{"type":"ref","targetId":"ulid","weight":0.8}],
  "vectors": {"embeddingModel":"str","vec":[0.1, ...]},
  "meta": {
    "model":"str","tool":"str","mcpTool":"str",
    "tokens_in":123,"tokens_out":456,
    "latency_ms":3210,"status":"ok|error","error":""
  },
  "createdAt": 1736960000000
}
```

### Cache Record Schema
```json
{
  "key": "string (model:docHash:promptHash)",
  "scope": "chat|document|editor",
  "output": {},
  "usage": {"tokens_in":123,"tokens_out":456},
  "ttl_ms": 600000,
  "createdAt": 1736960000000,
  "size": 20480,
  "version": "v1"
}
```

### Runlog Schema
```json
{
  "id":"string (ulid)",
  "phase":"retrieve|generate|apply|tool|cache_hit|cache_store|error",
  "model":"string","mcpTool":"string",
  "tokens_in":100,"tokens_out":250,
  "latency_ms":1800,
  "status":"ok|error",
  "message":"string",
  "createdAt":1736960000000
}
```
