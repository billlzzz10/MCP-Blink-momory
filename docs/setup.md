# MCP Blink Memory Setup Guide

## Prerequisites
- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- TypeScript ≥ 5.0 (installed via devDependencies)

## Installation

```bash
# Clone repository
git clone https://github.com/your-org/mcp-blink-memory.git
cd mcp-blink-memory

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Environment Configuration

Create `.env` file:
```bash
# Server Configuration
MCP_PORT=7071
MCP_HOST=localhost
MCP_LOG_LEVEL=info

# Embedding configuration (not implemented yet)
EMBEDDING_MODE=mock
EMBEDDING_DIMENSIONS=384

# Tagging configuration (not implemented yet)
TAG_MODE=advanced
TAG_LANGUAGE=th

# Storage configuration (not implemented yet)
STORAGE_PATH=./memory
ENABLE_AUDIT_LOG=true
```

## Running the Server

```bash
# Production mode
npm start

# Development mode (with hot reload)
npm run dev

# Custom port
set MCP_PORT=8080 && npm start
```

## Testing the API

```bash
# Health check
curl -X POST http://localhost:7071/health

# Create entity
curl -X POST http://localhost:7071/entities \
  -H "Content-Type: application/json" \
  -d '{"entities":[{"name":"Test Lab","type":"organization","observations":["AI research"]}]}'

# Get stats
curl -X POST http://localhost:7071/stats
```

## Development Commands

```bash
npm run build        # Compile TypeScript
npm run dev          # Development with hot reload
npm test             # Run tests
npm run lint         # Lint TypeScript code
npm run format       # Format code with Prettier
npm run clean        # Clean build artifacts
```

## Project Structure

```
src/
├── server/          # Express REST API server
│   ├── handlers/    # API endpoint handlers
│   ├── index.ts     # Main server class
│   ├── router.ts    # Route definitions
│   └── error-handler.ts
├── types/           # TypeScript type definitions
├── utils/           # Utilities (logger, config, validator)
├── core/            # Core business logic (empty - to be implemented)
├── storage/         # Data persistence (empty - to be implemented)
└── index.ts         # Application entry point
```

## Current Status

### ✅ Implemented
- TypeScript project structure
- Express REST API server
- Basic entity creation (mock)
- Health check and system info
- Graph statistics (mock)
- Logging and configuration
- Input validation

### 🔄 To Be Implemented
- Data persistence (JSON files)
- Semantic search with embeddings
- Auto-tagging service
- Relations between entities
- Memory0 root node management
- Audit logging
- Complete test suite

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 7070
netstat -ano | findstr :7070

# Use different port
set MCP_PORT=7071 && npm start
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

### Dependencies Issues
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```