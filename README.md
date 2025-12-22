MCP Blink Memory - TypeScript Edition

https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white
https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white
https://img.shields.io/badge/License-MIT-blue.svg
https://img.shields.io/npm/v/mcp-blink-memory?color=CC3534&logo=npm
https://img.shields.io/badge/JSON--RPC-2.0-4B8BBE?logo=json&logoColor=white

Model Context Protocol (MCP) Compatible Knowledge Graph Memory System - ระบบจัดการความจำแบบกราฟความรู้สำหรับ AI agents ที่ตรงตามมาตรฐาน MCP ใช้ JSON-RPC 2.0 สำหรับ communication รองรับ semantic search, auto-tagging และ lineage tracking ด้วย TypeScript

✨ คุณสมบัติหลัก

· 🏗️ MCP Standard Compliance - ตรงตามมาตรฐาน Model Context Protocol ด้วย JSON-RPC 2.0
· 🧠 Knowledge Graph Core - จัดการ entities, relations, observations ในรูปแบบกราฟที่ยืดหยุ่น
· 🔍 Semantic Search - ค้นหาด้วย vector embeddings (OpenAI, HuggingFace, Mock)
· 🏷️ Auto-Tagging - สร้าง tags อัตโนมัติจากเนื้อหา (รองรับภาษาไทยและอังกฤษ)
· 📜 Audit-Ready Lineage - บันทึกประวัติการดำเนินการทุกขั้นตอนแบบตรวจสอบได้
· 🌱 Root Memory Node - จัดการ memory node หลัก (#0) สำหรับ system baseline
· ⚡ TypeSafe Architecture - พัฒนาด้วย TypeScript สำหรับ type safety ที่ดีขึ้น
· 💾 Persistent Storage - ใช้ JSON files สำหรับ data persistence
· 🌍 Multi-Language - รองรับการประมวลผลภาษาไทยและอังกฤษ

🏗️ สถาปัตยกรรมระบบ (ใหม่)

```
MCP Blink Memory - TypeScript Architecture
│
├── src/
│   ├── server/                        # 🎯 MCP JSON-RPC 2.0 Server
│   │   ├── index.ts                  # MCP Server หลัก
│   │   ├── router.ts                 # Route methods ไปยัง handlers
│   │   ├── error-handler.ts          # JSON-RPC error formatting
│   │   └── handlers/                 # JSON-RPC Request Handlers
│   │       ├── entity.handler.ts     # createEntities(), deleteEntities()
│   │       ├── search.handler.ts     # semanticSearch(), searchByTag()
│   │       ├── graph.handler.ts      # createRelations(), getGraphStats()
│   │       └── system.handler.ts     # healthCheck(), selfDescribe()
│   │
│   ├── core/                         # 📦 Core Business Logic
│   │   ├── memory-graph/             # 🧠 Knowledge Graph Core
│   │   ├── embedding-service/        # 🔗 Text Embeddings (OpenAI/HuggingFace)
│   │   ├── auto-tag-service/         # 🏷️ Automatic Tagging System
│   │   ├── memory0-service/          # 🌱 Root Memory Management
│   │   └── system/                   # ⚙️ System Utilities
│   │
│   ├── types/                        # 📐 TypeScript Type Definitions
│   │   ├── rpc.types.ts             # JSON-RPC 2.0 Types
│   │   ├── memory.types.ts          # Entity, Observation, Relation Types
│   │   ├── embedding.types.ts       # Vector, Embedding Types
│   │   └── graph.types.ts           # Graph Structure Types
│   │
│   ├── storage/                      # 💾 Persistent Data Management
│   │   ├── memory-store.ts          # Main Knowledge Graph Storage
│   │   ├── lineage-logger.ts        # Audit Trail Logger
│   │   └── cache-manager.ts         # Embedding & Tag Cache
│   │
│   ├── utils/                        # ⚙️ Utility Functions
│   │   ├── logger.ts                # Structured Logging
│   │   ├── validator.ts             # Input Validation
│   │   └── config.ts                # Environment Configuration
│   │
│   └── index.ts                      # 🚀 Application Entry Point
│
├── dist/                             # 📦 Compiled JavaScript (หลัง build)
│
├── schemas/                          # 🏗️ JSON Schemas สำหรับ Validation
│   ├── entity.schema.json
│   ├── observation.schema.json
│   └── rpc-request.schema.json
│
├── memory/                           # 💾 Persistent Storage Files
│   ├── memory_store.json             # Main entities & relations
│   ├── lineage_log.json              # Operation history (audit trail)
│   ├── embedding_cache.json          # Vector embeddings cache
│   └── tag_cache.json                # Tag cache
│
├── config/                           # ⚙️ Configuration
│   └── mcp-config.yaml               # MCP Server Configuration
│
├── examples/                         # 📚 Usage Examples
│   ├── client-javascript.js          # JavaScript Client Example
│   ├── client-python.py              # Python Client Example
│   └── curl-requests.sh              # cURL Examples
│
└── tests/                            # 🧪 Test Suites
    ├── unit/
    ├── integration/
    └── e2e/
```

🚀 เริ่มต้นใช้งาน

ข้อกำหนดเบื้องต้น

· Node.js ≥ 18.0.0
· npm ≥ 9.0.0 หรือ yarn ≥ 1.22.0
· TypeScript ≥ 5.0 (ติดตั้งอัตโนมัติผ่าน dependencies)
· Git (สำหรับ clone repository)

ติดตั้ง

```bash
# Clone repository
git clone https://github.com/your-org/mcp-blink-memory.git
cd mcp-blink-memory

# ติดตั้ง dependencies
npm install

# Build TypeScript project
npm run build

# หรือสำหรับ development mode
npm run dev
```

Environment Variables

```bash
# MCP Server Configuration
MCP_PORT=7070                          # Port สำหรับ MCP Server
MCP_HOST=localhost                     # Host สำหรับ MCP Server
MCP_LOG_LEVEL=info                     # log level: debug, info, warn, error

# Embedding configuration
EMBEDDING_MODE=mock                    # mock, openai, huggingface
OPENAI_API_KEY=sk-...                  # สำหรับ OpenAI embeddings
HUGGINGFACE_API_KEY=hf-...             # สำหรับ HuggingFace embeddings
EMBEDDING_DIMENSIONS=384               # Vector dimensions

# Tagging configuration
TAG_MODE=advanced                      # basic, advanced, ml
TAG_LANGUAGE=th                        # th, en

# Storage configuration
STORAGE_PATH=./memory                  # Path สำหรับ data storage
ENABLE_AUDIT_LOG=true                  # เปิด/ปิด audit logging
```

📖 การใช้งาน

1. เริ่ม MCP Server

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm run build
npm start

# หรือระบุพอร์ตที่ต้องการ
MCP_PORT=8080 npm start
```

2. การเชื่อมต่อผ่าน JSON-RPC 2.0

ตัวอย่างการเรียกใช้ผ่าน cURL:

```bash
# Health check
curl -X POST http://localhost:7070/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "healthCheck",
    "params": {},
    "id": 1
  }'

# สร้าง entities
curl -X POST http://localhost:7070/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "createEntities",
    "params": {
      "entities": [
        {
          "name": "AI Research Lab",
          "type": "organization",
          "observations": [
            "Laboratory focused on artificial intelligence research",
            "Located in Bangkok, Thailand"
          ]
        }
      ],
      "options": {
        "autoTag": true,
        "linkToMemory0": true
      }
    },
    "id": 2
  }'
```

ตัวอย่าง JavaScript Client:

```javascript
import { MCPBlinkMemoryClient } from 'mcp-blink-memory/client';

const client = new MCPBlinkMemoryClient('http://localhost:7070');

// Health check
const health = await client.healthCheck();
console.log('Server status:', health);

// สร้าง entities
const result = await client.createEntities([
  {
    name: "AI Research Lab",
    type: "organization",
    observations: [
      "Laboratory focused on artificial intelligence research",
      "Located in Bangkok, Thailand"
    ]
  }
], { autoTag: true });

console.log(`Created ${result.count} entities`);
```

ตัวอย่าง TypeScript Client:

```typescript
import { MCPBlinkMemoryClient, EntityInput } from 'mcp-blink-memory';

const client = new MCPBlinkMemoryClient({
  endpoint: 'http://localhost:7070/jsonrpc',
  timeout: 30000
});

// สร้าง entities พร้อม auto-tagging
const entities: EntityInput[] = [
  {
    name: "AI Research Lab",
    type: "organization",
    observations: [
      "Laboratory focused on artificial intelligence research and development",
      "Located in Bangkok, Thailand",
      "Specializes in natural language processing and computer vision"
    ],
    metadata: {
      founded: 2020,
      employees: 25,
      website: "https://ai-lab.th"
    }
  }
];

const response = await client.createEntities(entities, {
  autoTag: true,
  linkToMemory0: true
});

console.log(`Created ${response.data.length} entities with tags:`);
response.data.forEach(entity => {
  console.log(`- ${entity.name}: ${entity.autoTags?.join(', ') || 'no tags'}`);
});
```

3. Semantic Search - ค้นหาด้วยความหมาย

```typescript
// ค้นหาด้วย semantic similarity
const searchResults = await client.semanticSearch(
  "artificial intelligence research in Thailand",
  {
    topK: 5,
    threshold: 0.3,
    tagFilter: ['ai', 'research', 'thailand']
  }
);

console.log('Semantic Search Results:');
searchResults.data.forEach((result, index) => {
  console.log(`${index + 1}. ${result.entity.name} (similarity: ${result.similarity.toFixed(3)})`);
  console.log(`   Tags: ${result.matchedTags.join(', ')}`);
  console.log(`   Observations: ${result.observations
    .map(o => o.content.substring(0, 50) + '...')
    .join('; ')}`);
});
```

4. Graph Operations

```typescript
// สร้าง relations ระหว่าง entities
const relationResult = await client.createRelations([
  {
    from: "AI Research Lab",
    to: "Dr. Somchai AI",
    relationType: "employs",
    properties: { role: "lead researcher", since: "2020" }
  }
]);

console.log(`Created ${relationResult.count} relations`);

// อ่าน graph stats
const stats = await client.getGraphStats();
console.log(`Graph stats: ${stats.entities} entities, ${stats.relations} relations`);
```

🔌 MCP Integration

ใช้กับ Claude Desktop

1. เพิ่ม configuration ใน Claude Desktop:

```json
{
  "mcpServers": {
    "blink-memory": {
      "command": "node",
      "args": [
        "/path/to/mcp-blink-memory/dist/index.js"
      ],
      "env": {
        "MCP_PORT": "7070",
        "EMBEDDING_MODE": "mock"
      }
    }
  }
}
```

ใช้กับ Cline/VSCode

1. ติดตั้ง MCP Blink Memory extension
2. ตั้งค่าใน .cline/mcp.json:

```json
{
  "mcpServers": {
    "blink-memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["mcp-blink-memory", "serve"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

📁 โครงสร้างไฟล์ใหม่

```
mcp-blink-memory/
├── package.json                      # 📦 Dependencies & scripts (อัปเดตแล้ว)
├── tsconfig.json                     # ⚙️ TypeScript configuration
├── package-lock.json                 # 🔒 Lock file
│
├── src/                              # 🎯 Source Code (TypeScript)
│   ├── index.ts                      # Application entry point
│   ├── server/                       # MCP JSON-RPC 2.0 Server
│   ├── core/                         # Core business logic
│   ├── types/                        # TypeScript type definitions
│   ├── storage/                      # Persistent data management
│   └── utils/                        # Utility functions
│
├── dist/                             # 📦 Compiled JavaScript (หลัง build)
│   ├── index.js                      # Compiled entry point
│   ├── server/                       # Compiled server code
│   └── ...                           # Other compiled modules
│
├── schemas/                          # 🏗️ JSON Schemas for validation
│   ├── entity.schema.json
│   ├── rpc-request.schema.json
│   └── ...
│
├── memory/                           # 💾 Data storage
│   ├── memory_store.json             # 🧠 Main knowledge graph
│   ├── lineage_log.json              # 📜 Operation history
│   ├── embedding_cache.json          # 🔗 Vector cache
│   └── tag_cache.json                # 🏷️ Tag cache
│
├── config/                           # ⚙️ Configuration
│   └── mcp-config.yaml               # MCP server configuration
│
├── examples/                         # 📚 Usage examples
│   ├── client-javascript.js          # JavaScript client
│   ├── client-python.py              # Python client
│   ├── client-typescript.ts          # TypeScript client
│   └── curl-requests.sh              # cURL examples
│
├── tests/                            # 🧪 Test suites
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests
│
├── docs/                             # 📖 Documentation
│   ├── api-reference.md              # API Reference
│   ├── mcp-integration.md            # MCP Integration Guide
│   ├── migration-guide.md            # Migration from v1 to v2
│   └── changelog.md                  # Version history
│
└── .github/                          # 🤝 GitHub Integration
    ├── workflows/                    # CI/CD pipelines
    │   ├── ci.yml                    # Continuous Integration
    │   ├── release.yml               # Release automation
    │   └── test.yml                  # Test automation
    └── dependabot.yml                # Dependencies updates
```

⚙️ Configuration

MCP Server Configuration (config/mcp-config.yaml)

```yaml
server:
  port: 7070
  host: "0.0.0.0"
  logLevel: "info"
  cors:
    enabled: true
    origin: "*"

features:
  semanticSearch:
    enabled: true
    defaultTopK: 10
    defaultThreshold: 0.3
  autoTagging:
    enabled: true
    defaultLanguage: "th"
    minConfidence: 0.5
  auditLogging:
    enabled: true
    maxLogSize: "100MB"
    retentionDays: 30

storage:
  memoryStorePath: "./memory/memory_store.json"
  lineageLogPath: "./memory/lineage_log.json"
  cacheDirectory: "./memory/cache"
  backup:
    enabled: true
    interval: "24h"
    maxBackups: 7
```

Environment Variables

Variable Description Default Required
MCP_PORT Port สำหรับ MCP Server 7070 No
MCP_HOST Host สำหรับ binding localhost No
MCP_LOG_LEVEL Log level info No
EMBEDDING_MODE Embedding provider mock No
OPENAI_API_KEY OpenAI API key - OpenAI mode
HUGGINGFACE_API_KEY HuggingFace API key - HuggingFace mode
STORAGE_PATH Path สำหรับ data storage ./memory No
ENABLE_AUDIT_LOG เปิด/ปิด audit logging true No

🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode สำหรับ development
npm run test:watch
```

Test Examples

```typescript
// tests/integration/mcp-server.test.ts
import { MCPBlinkMemoryServer } from '../src/server';
import { JSONRPCRequest } from '../src/types/rpc.types';

describe('MCP Server Integration', () => {
  let server: MCPBlinkMemoryServer;

  beforeAll(async () => {
    server = new MCPBlinkMemoryServer();
    await server.start();
  });

  test('should handle health check request', async () => {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'healthCheck',
      params: {},
      id: 1
    };

    const response = await server.handleRequest(request);
    expect(response.jsonrpc).toBe('2.0');
    expect(response.result).toHaveProperty('status', 'healthy');
    expect(response.result).toHaveProperty('timestamp');
  });

  test('should create entities via JSON-RPC', async () => {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'createEntities',
      params: {
        entities: [{
          name: 'Test Entity',
          type: 'test',
          observations: ['Test observation']
        }]
      },
      id: 2
    };

    const response = await server.handleRequest(request);
    expect(response.result).toHaveProperty('success', true);
    expect(response.result.data).toHaveLength(1);
  });
});
```

🔧 Development

Scripts

Script Description
npm run build Compile TypeScript to JavaScript
npm start Start the MCP server
npm run dev Development mode with hot reload
npm test Run all tests
npm run lint Lint TypeScript code
npm run format Format code with Prettier
npm run validate Validate project structure
npm run docs Generate API documentation
npm run clean Clean build artifacts

Code Style

· TypeScript Strict Mode - ใช้ strict type checking
· ESLint + Prettier - สำหรับ code consistency
· Async/Await - สำหรับ asynchronous operations
· Error Handling - Structured error handling with custom error types
· Logging - Structured logging with context
· Testing - Test coverage ≥ 80%

Available JSON-RPC Methods

Method Parameters Description
healthCheck - ตรวจสอบสถานะระบบ
createEntities entities[], options สร้าง entities ใหม่
getEntity entityId ดึงข้อมูล entity
updateEntity entityId, updates อัปเดต entity
deleteEntity entityId ลบ entity
addObservations entityId, observations[], options เพิ่ม observations
semanticSearch query, options ค้นหาด้วย semantic similarity
searchByTag tags[], options ค้นหาด้วย tags
createRelations relations[], options สร้าง relations
getGraphStats - ดึงสถิติ graph
getLineage entityId, depth ดึง lineage history
selfDescribe - ดึง system description

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

· OpenAI - สำหรับ embedding models
· HuggingFace - สำหรับ open-source NLP models
· Model Context Protocol - สำหรับ protocol standard
· TypeScript - สำหรับ type-safe development experience
· JSON-RPC - สำหรับ standardized communication protocol

🔄 Migration Guide

สำหรับผู้ใช้เวอร์ชันเก่า (JavaScript ES6 Modules) โปรดดู Migration Guide สำหรับรายละเอียดการย้ายมาใช้เวอร์ชัน TypeScript นี้

---

MCP Blink Memory - Building transparent, auditable, and type-safe AI memory systems for the future.

API Documentation | Migration Guide | Contribute