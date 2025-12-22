คำสั่งงานสำหรับ AI Agent: Migration to TypeScript + MCP Standard

🎯 เป้าหมายหลัก

แปลงโปรเจกต์ MCP-Blink-memory จาก JavaScript ES6 เป็น TypeScript + JSON-RPC 2.0 ที่ตรงตามมาตรฐาน MCP

📋 ขั้นตอนการทำงาน

Phase 1: Setup โครงสร้างพื้นฐาน

```
1. สร้างโครงสร้างโฟลเดอร์ใหม่ตามแผนที่กำหนด
2. สร้างไฟล์ configuration ใหม่ทั้งหมด
3. อัปเดต package.json สำหรับ TypeScript
```

คำสั่ง:

```bash
# 1. รัน init.ps1 ที่อัปเดตแล้ว
powershell -ExecutionPolicy Bypass -File init.ps1

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env จาก template
cp .env.example .env
```

Phase 2: สร้าง Type Definitions

```
1. สร้างไฟล์ types หลักใน src/types/
2. อ้างอิงจากโครงสร้างข้อมูลเดิมในโค้ด JavaScript
3. กำหนด interfaces สำหรับ Entity, Observation, Relation
```

ไฟล์ที่ต้องสร้าง:

```
src/types/
├── index.ts              # Export all types
├── rpc.types.ts         # JSON-RPC 2.0 types
├── memory.types.ts      # Entity, Observation, Relation
├── embedding.types.ts   # Vector, Embedding types
├── graph.types.ts       # Graph structure types
└── config.types.ts      # Configuration types
```

ตัวอย่าง rpc.types.ts:

```typescript
export interface JSONRPCRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, any>;
  id: string | number | null;
}

export interface JSONRPCResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: JSONRPCError;
  id: string | number | null;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

export enum RPCErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000
}
```

Phase 3: แปลง Core Modules

```
แปลงแต่ละโมดูลจาก modules/ เป็น src/core/:
1. memory_graph → src/core/memory-graph/
2. embedding_service → src/core/embedding-service/
3. auto_tag_service → src/core/auto-tag-service/
4. memory0_service → src/core/memory0-service/
5. system → src/core/system/
```

หลักการแปลง:

```typescript
// JavaScript ต้นฉบับ (modules/memory_graph/*.js)
export async function createEntities(entities, options) {
  // โค้ดเดิม...
}

// TypeScript แปลงแล้ว (src/core/memory-graph/entity-manager.ts)
import { EntityInput, CreateEntityOptions } from '../../types/memory.types';

export class EntityManager {
  async createEntities(
    entities: EntityInput[], 
    options?: CreateEntityOptions
  ): Promise<Entity[]> {
    // โค้ดเดิม + type annotations
  }
}
```

Phase 4: สร้าง JSON-RPC Server

```
1. สร้าง JSON-RPC 2.0 server ใน src/server/
2. สร้าง handlers สำหรับแต่ละ operation
3. ทำ error handling ตามมาตรฐาน JSON-RPC
```

โครงสร้าง server:

```typescript
// src/server/index.ts
export class MCPBlinkMemoryServer {
  private server: JSONRPCServer;
  
  constructor() {
    this.server = new JSONRPCServer();
    this.registerMethods();
  }
  
  private registerMethods() {
    this.server.addMethod('createEntities', this.handleCreateEntities);
    this.server.addMethod('semanticSearch', this.handleSemanticSearch);
    // ... methods อื่นๆ จาก index.js เดิม
  }
  
  async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    return this.server.receive(request);
  }
}
```

Phase 5: สร้าง Storage Layer

```
1. แปลงการอ่าน/เขียน JSON files เป็น typed classes
2. เพิ่ม validation ด้วย Zod หรือ Joi
3. สร้าง cache management
```

ตัวอย่าง memory-store.ts:

```typescript
import { Entity, Observation, Relation } from '../types/memory.types';
import fs from 'fs/promises';
import path from 'path';

export class MemoryStore {
  private filePath: string;
  
  constructor(filePath: string = './memory/memory_store.json') {
    this.filePath = filePath;
  }
  
  async load(): Promise<{
    entities: Entity[];
    relations: Relation[];
  }> {
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data);
  }
  
  async saveEntities(entities: Entity[]): Promise<void> {
    const data = await this.load();
    data.entities.push(...entities);
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }
}
```

Phase 6: แปลง index.js หลัก

```
1. index.js เก่า → src/index.ts (entry point ใหม่)
2. เปลี่ยนจาก export functions โดยตรง → start JSON-RPC server
3. เพิ่ม CLI commands สำหรับการใช้งาน
```

src/index.ts:

```typescript
import { MCPBlinkMemoryServer } from './server';
import { loadConfig } from './utils/config';
import { logger } from './utils/logger';

async function main() {
  const config = loadConfig();
  const server = new MCPBlinkMemoryServer(config);
  
  await server.start();
  logger.info(`MCP Server running on ${config.host}:${config.port}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { MCPBlinkMemoryServer };
```

Phase 7: สร้าง Tests

```
1. แปลง tests เดิมเป็น TypeScript
2. สร้าง tests ใหม่สำหรับ JSON-RPC
3. เพิ่ม integration tests
```

ตัวอย่าง test:

```typescript
// tests/integration/mcp-server.test.ts
import { MCPBlinkMemoryServer } from '../src/server';

describe('MCP Server', () => {
  let server: MCPBlinkMemoryServer;
  
  beforeEach(() => {
    server = new MCPBlinkMemoryServer();
  });
  
  test('should handle createEntities request', async () => {
    const request = {
      jsonrpc: '2.0',
      method: 'createEntities',
      params: {
        entities: [{ name: 'Test', type: 'test' }]
      },
      id: 1
    };
    
    const response = await server.handleRequest(request);
    expect(response.jsonrpc).toBe('2.0');
    expect(response.result).toHaveProperty('success', true);
  });
});
```

🔧 คำสั่งเฉพาะสำหรับ Dev Tool AI Agent

1. อ่านและวิเคราะห์โค้ดเดิม

```json
{
  "action": "analyze_legacy_code",
  "targets": [
    "modules/memory_graph/*.js",
    "modules/embedding_service/*.js",
    "modules/auto_tag_service/*.js",
    "modules/memory0_service/*.js",
    "modules/system/*.js",
    "index.js"
  ],
  "output": "analysis_report.json",
  "analyze": [
    "function_signatures",
    "data_structures",
    "dependencies",
    "async_patterns",
    "error_handling"
  ]
}
```

2. สร้าง TypeScript Interfaces

```json
{
  "action": "generate_typescript_interfaces",
  "source": "analysis_report.json",
  "output_dir": "src/types/",
  "rules": {
    "convert_jsdoc_to_types": true,
    "infer_types_from_usage": true,
    "strict_null_checks": true,
    "generate_validation_schemas": true
  }
}
```

3. แปลง JavaScript เป็น TypeScript

```json
{
  "action": "convert_js_to_ts",
  "files": [
    "modules/memory_graph/entity.js -> src/core/memory-graph/entity-manager.ts",
    "modules/memory_graph/relation.js -> src/core/memory-graph/relation-manager.ts",
    "modules/embedding_service/*.js -> src/core/embedding-service/",
    "modules/auto_tag_service/*.js -> src/core/auto-tag-service/",
    "modules/memory0_service/*.js -> src/core/memory0-service/",
    "modules/system/*.js -> src/core/system/"
  ],
  "conversion_rules": {
    "add_type_annotations": true,
    "convert_callbacks_to_async_await": true,
    "add_error_handling": true,
    "use_classes_for_modules": true,
    "preserve_function_names": true
  }
}
```

4. สร้าง JSON-RPC Handlers

```json
{
  "action": "create_rpc_handlers",
  "source_functions": [
    "createEntities",
    "addObservations", 
    "semanticSearch",
    "createRelations",
    "getGraphStats",
    "healthCheck",
    "selfDescribe"
  ],
  "output_dir": "src/server/handlers/",
  "template": "jsonrpc_wrapper",
  "config": {
    "error_wrapping": true,
    "request_validation": true,
    "response_formatting": true,
    "logging": true
  }
}
```

5. สร้างตัวอย่างการใช้งาน

```json
{
  "action": "create_examples",
  "types": [
    "javascript_client",
    "typescript_client", 
    "python_client",
    "curl_examples",
    "claude_mcp_integration"
  ],
  "output_dir": "examples/",
  "include": [
    "create_entities",
    "semantic_search",
    "graph_operations",
    "error_handling"
  ]
}
```

📁 ลำดับการทำงานที่แนะนำ

วัน 1-2: Setup และ Types

1. รัน init.ps1 สำหรับโครงสร้างใหม่
2. สร้างไฟล์ TypeScript configuration
3. สร้างไฟล์ type definitions หลัก

วัน 3-5: แปลง Core Modules

1. แปลง memory-graph module ก่อน (สำคัญที่สุด)
2. แปลง embedding-service
3. แปลง auto-tag-service
4. แปลง memory0-service
5. แปลง system utilities

วัน 6-7: สร้าง JSON-RPC Server

1. สร้าง server core
2. สร้าง handlers สำหรับแต่ละ function
3. ทำ error handling และ logging

วัน 8-9: ทดสอบและปรับปรุง

1. Compile และแก้ไข type errors
2. สร้าง unit tests
3. สร้าง integration tests
4. ทดสอบกับ MCP clients

วัน 10: Documentation

1. อัปเดต README.md
2. สร้าง API documentation
3. สร้าง migration guide

🚨 จุดที่ต้องระวัง

1. การแปลง Asynchronous Code

```typescript
// ❌ เก่า (callback)
function getData(callback) {
  fs.readFile('data.json', 'utf8', callback);
}

// ✅ ใหม่ (async/await)
async function getData(): Promise<any> {
  return fs.promises.readFile('data.json', 'utf8')
    .then(data => JSON.parse(data));
}
```

2. การจัดการ Error

```typescript
// ❌ เก่า
try {
  // code
} catch (error) {
  console.error(error);
}

// ✅ ใหม่ (JSON-RPC compatible)
try {
  // code
} catch (error) {
  throw {
    code: -32603,
    message: 'Internal error',
    data: { originalError: error.message }
  };
}
```

3. การแปลง Object Structures

```typescript
// ❌ เก่า (untyped)
const entity = {
  name: 'Test',
  type: 'person',
  observations: []
};

// ✅ ใหม่ (typed)
const entity: Entity = {
  id: generateId(),
  name: 'Test',
  type: 'person' as EntityType,
  observations: [],
  createdAt: new Date(),
  updatedAt: new Date()
};
```

🔍 Validation Checklist

หลังแปลงเสร็จแต่ละโมดูล ให้ตรวจสอบ:

· TypeScript compiles without errors
· All exports มี type annotations
· Async functions มี return type Promise<>
· Error handling เป็น JSON-RPC format
· Tests pass
· No any types (ถ้าเป็นไปได้)

ก่อนส่งมอบ:

· MCP manifest.json ถูกต้อง
· JSON-RPC server สามารถรับ request ได้
· Semantic search ยังทำงานได้
· Auto-tagging ยังทำงานได้
· Root memory linking ยังทำงานได้
· Audit logging ยังทำงานได้

📞 เมื่อพบปัญหา

ถามคำถามเหล่านี้:

1. โค้ดเดิมใช้ pattern อะไรที่ควรเก็บไว้?
2. มี side effects อะไรที่ต้องรักษาไว้?
3. Performance considerations อะไรบ้าง?
4. ต้องการ backward compatibility แค่ไหน?

บันทึกการตัดสินใจ:

```typescript
// DECISION_LOG.md
// [วันที่] [โมดูล] [ปัญหา] [การแก้ไข]
// 2025-12-21: memory-graph: 如何处理circular references? → ใช้ weak references
// 2025-12-21: embedding-service: ต้องการcache strategy? → ใช้LRU cache
```

---

คำสั่งเริ่มต้นสำหรับ Agent:

```
เริ่มทำงานจาก Phase 1: Setup โครงสร้างพื้นฐาน
1. สร้างไฟล์ init.ps1 ใหม่ตาม template ด้านบน
2. รัน init.ps1 เพื่อสร้างโครงสร้าง
3. รายงานผลการสร้างไฟล์
4. ดำเนินการ Phase 2 ต่อไป
```

ต้องการให้เริ่มดำเนินการขั้นตอนไหนก่อนครับ?