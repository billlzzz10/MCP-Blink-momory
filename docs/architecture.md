# MCP Blink Memory Architecture

## System Overview

MCP Blink Memory TypeScript Edition is a knowledge graph memory system built with:
- **TypeScript** for type safety
- **Express.js** for REST API
- **Node.js** runtime environment
- **JSON file storage** (to be implemented)

## Architecture Layers

```
┌─────────────────────────────────────────┐
│              REST API Layer             │
│         (Express.js Routes)             │
├─────────────────────────────────────────┤
│            Handler Layer                │
│    (Entity, Search, Graph, System)     │
├─────────────────────────────────────────┤
│           Business Logic                │
│         (Core Modules)                  │
├─────────────────────────────────────────┤
│           Storage Layer                 │
│        (JSON File Persistence)         │
└─────────────────────────────────────────┘
```

## Current Implementation

### ✅ Server Layer (`src/server/`)
- **MCPBlinkMemoryServer** - Main Express server
- **Router** - Route definitions and middleware
- **ErrorHandler** - Centralized error handling
- **Handlers** - API endpoint implementations

### ✅ Type System (`src/types/`)
- **rpc.types.ts** - API request/response types
- **memory.types.ts** - Entity, Observation, Relation types
- **embedding.types.ts** - Vector and embedding types

### ✅ Utilities (`src/utils/`)
- **Logger** - Winston-based structured logging
- **Config** - Environment variable management
- **Validator** - Zod-based input validation

### 🔄 Core Modules (`src/core/`) - To Be Implemented
- **Memory Graph** - Entity and relation management
- **Embedding Service** - Vector embeddings (OpenAI/HuggingFace)
- **Auto-tag Service** - Automatic content tagging
- **Memory0 Service** - Root memory node management
- **System** - Health checks and diagnostics

### 🔄 Storage Layer (`src/storage/`) - To Be Implemented
- **Memory Store** - JSON file persistence
- **Lineage Logger** - Audit trail logging
- **Cache Manager** - Embedding and tag caching

## Data Flow

```
HTTP Request → Router → Handler → Validator → Core Logic → Storage → Response
```

### Current Flow (Mock Implementation)
1. **HTTP Request** arrives at Express server
2. **Router** matches endpoint and calls handler
3. **Handler** validates input using Zod schemas
4. **Mock Logic** generates sample responses
5. **JSON Response** sent back to client

### Target Flow (Full Implementation)
1. **HTTP Request** arrives at Express server
2. **Router** matches endpoint and calls handler
3. **Handler** validates input and calls core services
4. **Core Services** process business logic
5. **Storage Layer** persists/retrieves data
6. **Response** with real data sent to client

## API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/health` | POST | System health check | ✅ Working |
| `/describe` | POST | System capabilities | ✅ Working |
| `/entities` | POST | Create entities | ✅ Mock |
| `/search` | POST | Semantic search | ✅ Mock |
| `/relations` | POST | Create relations | ✅ Mock |
| `/stats` | POST | Graph statistics | ✅ Mock |

## Configuration

### Environment Variables
- `MCP_PORT` - Server port (default: 7070)
- `MCP_HOST` - Server host (default: localhost)
- `MCP_LOG_LEVEL` - Logging level (default: info)
- `EMBEDDING_MODE` - Embedding provider (mock/openai/huggingface)
- `STORAGE_PATH` - Data storage directory

### TypeScript Configuration
- **Target**: ES2020
- **Module**: CommonJS
- **Strict Mode**: Enabled
- **Source Maps**: Enabled
- **Declarations**: Generated

## Development Workflow

```bash
# Development cycle
npm run dev          # Start with hot reload
# Make changes to TypeScript files
# Server automatically restarts
npm run build        # Compile for production
npm start           # Run compiled version
```

## Testing Strategy

### Current Tests
- Basic server instantiation
- Simple integration tests

### Planned Tests
- Unit tests for each core module
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Performance tests for large datasets

## Deployment Considerations

### Production Setup
- Compile TypeScript to JavaScript
- Use process manager (PM2)
- Configure logging to files
- Set up health monitoring
- Implement backup strategy for JSON files

### Scaling Options
- Horizontal scaling with load balancer
- Database migration (PostgreSQL/MongoDB)
- Caching layer (Redis)
- Microservices architecture