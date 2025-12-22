# Changelog

## [2.0.0] - 2025-12-22

### 🎯 Major Migration: JavaScript → TypeScript

#### ✅ Added
- **TypeScript Architecture** - Complete migration from JavaScript ES6 modules
- **Express REST API** - Replaced JSON-RPC with standard REST endpoints
- **Type Safety** - Full TypeScript type definitions for all data structures
- **Modern Build System** - TypeScript compiler with source maps and declarations
- **Structured Logging** - Winston-based logging with JSON format
- **Input Validation** - Zod-based schema validation for all endpoints
- **Development Tools** - ESLint, Prettier, Nodemon for better DX

#### 🔄 Changed
- **API Protocol** - From JSON-RPC 2.0 to REST API endpoints
- **Project Structure** - Reorganized to TypeScript best practices
- **Dependencies** - Updated to modern TypeScript-compatible packages
- **Configuration** - Environment-based configuration system
- **Testing** - Jest with TypeScript support

#### ❌ Removed
- **Old JavaScript Files** - Cleaned up legacy ES6 modules
- **JSON-RPC Dependencies** - Removed non-existent packages
- **Old Build System** - Removed Babel and esbuild configurations
- **Legacy Modules** - Cleaned up old `modules/` directory structure

### 🚀 Current Status

#### ✅ Working Features
- REST API server on configurable port
- Health check endpoint (`POST /health`)
- System description endpoint (`POST /describe`)
- Entity creation with mock data (`POST /entities`)
- Graph statistics with mock data (`POST /stats`)
- Semantic search placeholder (`POST /search`)
- Relations creation placeholder (`POST /relations`)

#### 🔄 In Development
- **Data Persistence** - JSON file storage implementation
- **Embedding Service** - OpenAI/HuggingFace integration
- **Auto-tagging** - Content analysis and tag generation
- **Memory0 Service** - Root memory node management
- **Audit Logging** - Operation history tracking
- **Complete Test Suite** - Unit and integration tests

### 📊 Migration Statistics
- **Files Migrated**: 15+ TypeScript files created
- **Old Files Removed**: 10+ JavaScript files cleaned up
- **Dependencies Updated**: 20+ packages modernized
- **API Endpoints**: 6 REST endpoints implemented
- **Type Definitions**: 50+ TypeScript interfaces/types

### 🛠️ Technical Improvements
- **Type Safety**: 100% TypeScript coverage
- **Error Handling**: Centralized error management
- **Logging**: Structured JSON logging with Winston
- **Validation**: Runtime type checking with Zod
- **Build Process**: Fast TypeScript compilation
- **Development**: Hot reload with Nodemon

### 📝 API Changes
```bash
# Old JSON-RPC format
POST /jsonrpc
{"jsonrpc":"2.0","method":"healthCheck","id":1}

# New REST format  
POST /health
# Returns: {"success":true,"data":{...}}
```

### 🔧 Configuration Updates
```bash
# New environment variables
MCP_PORT=7071              # Changed from 7070 (conflict resolution)
MCP_HOST=localhost         # Server binding
MCP_LOG_LEVEL=info         # Logging configuration
EMBEDDING_MODE=mock        # Embedding provider
STORAGE_PATH=./memory      # Data directory
```

---

## [1.x.x] - Previous Versions
Legacy JavaScript implementation with ES6 modules and JSON-RPC protocol.

### Features (Legacy)
- JavaScript ES6 modules
- JSON-RPC 2.0 protocol
- Basic memory management
- File-based storage
- Express server

**Note**: Version 1.x is deprecated. Please migrate to TypeScript 2.0.0+