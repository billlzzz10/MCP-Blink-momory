# MCP Blink Memory API Documentation

## Overview
REST API endpoints for the MCP Blink Memory TypeScript Edition knowledge graph system.

**Base URL**: `http://localhost:7071`

## System Endpoints

### `POST /health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-22T03:39:36.043Z",
    "version": "2.0.0",
    "uptime": 39.56
  }
}
```

### `POST /describe`
Get system capabilities and information.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "MCP Blink Memory",
    "version": "2.0.0",
    "description": "Knowledge Graph Memory System with MCP Support",
    "capabilities": {
      "tools": [...]
    }
  }
}
```

## Entity Endpoints

### `POST /entities`
Create new entities in the knowledge graph.

**Request Body:**
```json
{
  "entities": [
    {
      "name": "AI Research Lab",
      "type": "organization",
      "observations": ["Laboratory focused on AI research"],
      "metadata": {}
    }
  ],
  "options": {
    "autoTag": true,
    "linkToMemory0": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "entity_1766374782313_0",
      "name": "AI Research Lab",
      "type": "organization",
      "observations": [
        {
          "id": "obs_1766374782313_0",
          "content": "Laboratory focused on AI research",
          "createdAt": "2025-12-22T03:39:42.313Z"
        }
      ],
      "autoTags": [],
      "createdAt": "2025-12-22T03:39:42.313Z",
      "updatedAt": "2025-12-22T03:39:42.313Z"
    }
  ]
}
```

## Search Endpoints

### `POST /search`
Semantic search for entities.

**Request Body:**
```json
{
  "query": "artificial intelligence research",
  "options": {
    "topK": 5,
    "threshold": 0.3,
    "tagFilter": ["ai", "research"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

## Graph Endpoints

### `POST /relations`
Create relations between entities.

**Request Body:**
```json
{
  "relations": [
    {
      "from": "AI Research Lab",
      "to": "Dr. Smith",
      "relationType": "employs",
      "properties": {
        "role": "researcher",
        "since": "2020"
      }
    }
  ]
}
```

### `POST /stats`
Get knowledge graph statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "entities": 0,
    "relations": 0,
    "observations": 0,
    "tags": 0,
    "lastUpdated": "2025-12-22T03:39:48.329Z"
  }
}
```

## Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `500` - Internal Server Error

## Current Implementation Status
- ✅ REST API endpoints
- ✅ Basic entity creation (mock data)
- ✅ Health check and stats
- 🔄 Semantic search (placeholder)
- 🔄 Data persistence (not implemented)
- 🔄 Auto-tagging (not implemented)
- 🔄 Relations (mock responses)