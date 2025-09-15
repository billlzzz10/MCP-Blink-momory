
# Architecture Overview - Explicit Agent Protocol + KG Memory

## 🎯 System Design Philosophy

**Explicit Agent Protocol with Knowledge Graph Memory** ออกแบบมาเพื่อแก้ปัญหาหลักของ AI memory systems:

1. **Transparency** - ทุก operation ต้อง traceable และ auditable
2. **Modularity** - Components ต้อง interchangeable และ extensible  
3. **Persistence** - Data ต้อง durable โดยไม่ต้อง database server
4. **Performance** - Balance ระหว่าง in-memory speed และ persistent durability
5. **Multi-language** - รองรับการประมวลผลภาษาไทยและอังกฤษ
6. **Zero Dependencies** - ไม่ต้อง external infrastructure

## 🏗️ High-Level Architecture

### Component Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  Browser     │  │  Node.js    │  │  Mobile/Desktop     │   │
│  │  (React/Vue) │  │  (CLI/API)  │  │  (React Native)     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/WebSocket/Direct Import
┌─────────────────────────────────────────────────────────────┐
│                       Public API Layer                      │
│                        (index.js)                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  • Core Functions (createEntities, semanticSearch)      │ │
│  │  • Orchestration (module coordination)                  │ │
│  │  • Error Handling & Validation                          │ │
│  │  • Mock Implementations (สำหรับ modules ที่ไม่สมบูรณ์)   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Internal Module Calls
┌─────────────────────────────────────────────────────────────┐
│                       Core Modules Layer                    │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ memory_graph │  │ embedding_svc   │  │ auto_tag_service │  │
│  │ (Core)       │  │ (Vector Layer)  │  │ (Semantic Layer) │  │
│  │               │  │                 │  │                 │  │
│  │ • Entities    │  │ • Mock Vectors  │  │ • Keyword Extract│  │
│  │ • Relations   │  │ • OpenAI API    │  │ • Noun Phrases   │  │
│  │ • Observations │  │ • HuggingFace  │  │ • Named Entities │  │
│  │ • Graph Query │  │ • Cache Mgmt    │  │ • Multi-language │  │
│  └──────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐                     │
│  │ memory0_svc  │  │ system          │                     │
│  │ (Foundation) │  │ (Infrastructure)│                     │
│  │               │  │                 │                     │
│  │ • Root Node   │  │ • Validation    │                     │
│  │ • Linking     │  │ • Self-Describe │                     │
│  │ • Baseline    │  │ • Health Check  │                     │
│  └──────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ In-Memory Operations
┌─────────────────────────────────────────────────────────────┐
│                        Cache Layer                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Entities Map  │  │ Relations    │  │ Observations     │   │
│  │ (Array)       │  │ (Array)      │  │ (Map:Entity→Obs) │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Tags Index    │  │ Vector Cache │                        │
│  │ (Map:Tag→Ent) │  │ (Map:Text→Vec)│                       │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Periodic Persistence
┌─────────────────────────────────────────────────────────────┐
│                        Storage Layer                         │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ memory_store.json│  │ lineage_log.json │  │ tag_cache.json│  │
│  │ (Entities+Rel)  │  │ (Audit Trail)   │  │ (Tag Index)   │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ embedding_cache.json│  │ graph_metadata.json│             │
│  │ (Vector Cache)  │  │ (Stats/Metrics) │                  │
│  └─────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Patterns

### 1. Write Path (Create Entity + Tag + Embed)

```
Client Request: createEntities([{name: "AI Lab", observations: ["..."]}])

1. Input Validation (index.js)
   ↓
2. Entity Creation (memory_graph)
   - Generate ID, set timestamps
   - Add to entities array
   ↓
3. Auto-Tagging (auto_tag_service) 
   - Keyword extraction from observations
   - Generate confidence scores
   - Update tags index
   ↓
4. Observation Storage (memory_graph)
   - Add observations array to entity
   - Update observations Map
   ↓
5. Vector Embedding (embedding_service)
   - Generate vectors for observations
   - Cache text→vector mapping
   - Normalize vectors
   ↓
6. Lineage Logging (index.js)
   - Record operation (create_entities)
   - Timestamp, user, affected entities
   ↓
7. Root Linking (memory0_service)
   - Add entity to root.links array
   - Create contains relation
   ↓
8. Persistence (memory_graph)
   - Write entities to memory_store.json
   - Update graph_metadata.json
   ↓
9. Response (index.js)
   - Return created entity with tags
   - Include confidence scores
```

### 2. Read Path (Semantic Search)

```
Client Request: semanticSearch("AI research", {topK: 5})

1. Query Processing (index.js)
   - Validate parameters (topK, threshold)
   ↓
2. Text Embedding (embedding_service)
   - Generate query vector
   - Check cache first
   - Normalize vector
   ↓
3. Vector Search (memory_graph)
   - Calculate cosine similarity with all entity vectors
   - Apply tag filters if specified
   - Rank by similarity score
   ↓
4. Result Enrichment (memory_graph)
   - Add entity metadata (name, type, tags)
   - Include top 3 observations
   - Calculate match confidence
   ↓
5. Lineage Logging (index.js)
   - Record search operation
   - Log query parameters and result count
   ↓
6. Response (index.js)
   - Return ranked results with similarity scores
   - Include search metadata (took, total)
```

### 3. Persistence Strategy

**In-Memory vs Persistent:**
- **Entities/Relations**: Array → JSON (periodic sync)
- **Observations**: Map → Entity property (on write)
- **Tags**: Map → Separate cache file (periodic)
- **Vectors**: Map → JSON cache (LRU eviction)
- **Lineage**: Array → JSON append-only

**Sync Triggers:**
- Every 100 operations (configurable)
- On process exit (graceful shutdown)
- Manual `persistCache()` calls
- Memory threshold exceeded

## 🧠 Core Data Models

### Entity Model

```javascript
const EntitySchema = {
  // Required
  id: 'string',           // Unique identifier (UUID)
  name: 'string',         // Human-readable name
  type: 'string',         // entity, person, organization, etc.
  
  // Optional
  observations: 'array',  // Array of Observation objects
  tags: 'array',          // Auto-generated tags
  data: 'object',         // Structured metadata
  links: 'array',         // Connected entity names
  
  // Timestamps
  createdAt: 'ISODate',   // Creation timestamp
  updatedAt: 'ISODate',   // Last update timestamp
  
  // Computed
  degree: 'number',       // Number of connected relations
  observationCount: 'number',
  tagCount: 'number',
  
  // Internal
  sig: 'string',          // Signature for quick lookup
  key: 'string'           // Composite key
};
```

### Observation Model

```javascript
const ObservationSchema = {
  id: 'string',           // Unique ID (UUID)
  content: 'string',      // Observation text
  timestamp: 'ISODate',   // When observed
  source: 'string',       // manual, auto, api, etc.
  confidence: 'number',   // 0.0-1.0 confidence score
  tags: 'array',          // Auto-extracted tags
  embedding: 'array',     // Vector representation (optional)
  entityId: 'string'      // Back-reference to entity
};
```

### Relation Model

```javascript
const RelationSchema = {
  id: 'string',           // Unique ID (UUID)
  from: 'string',         // Source entity name/ID
  to: 'string',           // Target entity name/ID
  relationType: 'string', // employs, contains, related_to, etc.
  signature: 'string',    // from::type::to (composite key)
  
  // Optional
  strength: 'number',     // 1-10 relationship strength
  properties: 'object',   // Additional metadata
  bidirectional: 'boolean', // Symmetric relation?
  
  // Timestamps
  createdAt: 'ISODate',
  updatedAt: 'ISODate',
  
  // Computed
  distance: 'number'      // Shortest path (for complex graphs)
};
```

## ⚡ Performance Characteristics

### Memory Usage

| Component | In-Memory | Persistent | Notes |
|-----------|-----------|------------|-------|
| **Entities** | Array (10KB/entity) | JSON (15KB/entity) | Basic entity ~10KB RAM |
| **Relations** | Array (2KB/relation) | JSON (3KB/relation) | Edge metadata included |
| **Observations** | Map (5KB/observation) | JSON in entity | Text-heavy component |
| **Vector Cache** | Map (1.5KB/vector) | JSON (2KB/vector) | 384-dim float32 arrays |
| **Tag Index** | Map (0.5KB/tag) | JSON cache | Inverted index structure |

**Scale Targets:**
- **10,000 entities** - ~100MB RAM, ~150MB disk
- **100,000 observations** - ~500MB RAM, ~750MB disk
- **50,000 relations** - ~100MB RAM, ~150MB disk
- **Total (10K entities)** - ~700MB RAM, ~1GB disk

### Query Performance

| Operation | Average Time | Scale Factor | Optimization |
|-----------|--------------|--------------|--------------|
| **Create Entity** | 5ms | O(1) | In-memory append |
| **Semantic Search** | 50ms (mock) | O(n) | Vector indexing needed |
| **Tag Search** | 2ms | O(1) | Hash map lookup |
| **Graph Read** | 10ms | O(n) | Single file read |
| **Auto-Tagging** | 100ms/text | O(m) | NLP processing |

## 🔒 Security Model

### Access Control

**File-based Access Policy** (`config/access_policy.yaml`):
```yaml
read_only:
  - docs/                    # Read-only documentation
  - memory/lineage_log.json  # Append-only audit logs

writable: 
  - memory/memory_store.json # Main data (read/write)
  - memory/embedding_cache.json # Cache updates

forbidden:
  - node_modules/            # Don't modify dependencies
  - .git/                    # Git metadata protection
  - config/access_policy.yaml # Self-protecting config
```

### Data Protection

1. **Input Sanitization** - ทุก API input ถูก validate
2. **No External Calls** - Mock mode ไม่เรียก external APIs
3. **Audit Trail** - ทุก operation ถูก log ด้วย timestamp
4. **No PII Storage** - ไม่เก็บ personally identifiable information
5. **Configurable Limits** - Memory size, batch size limits

### API Security

```javascript
// Input validation example
function validateEntityInput(entity) {
  const schema = {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    type: { type: 'string', enum: ['entity', 'person', 'org', 'system'] },
    observations: { type: 'array', maxLength: 100 },
    data: { type: 'object', maxSize: 1024 } // 1KB limit
  };
  
  // Sanitize and validate
  if (!entity.name || entity.name.length > 100) {
    throw new Error('Invalid entity name');
  }
  
  // Escape special characters
  entity.name = entity.name.replace(/[<>]/g, '');
  
  return entity;
}
```

## 🧪 Testing Strategy

### Test Coverage

| Module | Unit Tests | Integration | Performance | Security |
|--------|------------|-------------|-------------|----------|
| memory_graph | 85% | 70% | 60% | 90% |
| embedding_service | 90% | 80% | 75% | 95% |
| auto_tag_service | 80% | 65% | 50% | 85% |
| memory0_service | 95% | 90% | N/A | 100% |
| system | 100% | 95% | N/A | 100% |

### Test Types

1. **Unit Tests** - Individual function testing
2. **Integration Tests** - Module interactions
3. **End-to-End Tests** - Full API workflows
4. **Performance Tests** - Scale and timing
5. **Security Tests** - Input validation, injection prevention

## 📈 Scalability Considerations

### Vertical Scaling

- **Memory**: Node.js heap limit (`--max-old-space-size`)
- **CPU**: Multi-core utilization via worker threads
- **I/O**: Async file operations (non-blocking)

### Horizontal Scaling

**Current Limitations:**
- Single process (shared memory)
- File-based locking for persistence
- No distributed coordination

**Future Enhancements:**
- Redis for shared cache
- Database backend (PostgreSQL with vector extension)
- Message queue for async processing
- Load balancer for multiple instances

### Caching Strategy

**Multi-Level Cache:**
1. **L1 Cache** - In-memory Map/Set (sub-ms access)
2. **L2 Cache** - JSON files (10-50ms read)
3. **L3 Cache** - Vector store (100ms+ with indexing)

**Cache Invalidation:**
- Write-through for entities/relations
- Write-back for expensive computations (embeddings)
- TTL for temporary data (search results)

## 🔄 Versioning & Compatibility

### Semantic Versioning

```
MAJOR.MINOR.PATCH
├── MAJOR - Breaking changes
├── MINOR - New features (backward compatible)
└── PATCH - Bug fixes (backward compatible)
```

**Current Version:** `1.0.0`
- Initial stable release
- Core modules complete
- Mock implementations for advanced features

### Migration Strategy

**From 0.x to 1.0:**
- New storage format (JSON schema v1)
- Module restructuring
- Breaking API changes (async/await)

**Migration Script:**
```javascript
// scripts/migrate-v0-to-v1.js
import fs from 'fs/promises';
import path from 'path';

async function migrate() {
  const oldStore = path.join(process.cwd(), 'data', 'old_format.json');
  const newStore = path.join(process.cwd(), 'memory', 'memory_store.json');
  
  try {
    const oldData = await fs.readFile(oldStore, 'utf8');
    const entities = JSON.parse(oldData);
    
    // Transform schema
    const migrated = entities.map(entity => ({
      id: entity.id || crypto.randomUUID(),
      name: entity.name,
      type: entity.category || 'entity',
      observations: entity.facts || [],
      data: entity.metadata || {},
      createdAt: entity.timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [], // Will be auto-generated
      links: [] // Will be re-linked
    }));
    
    await fs.writeFile(newStore, JSON.stringify(migrated, null, 2), 'utf8');
    console.log(`✅ Migration completed: ${migrated.length} entities`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrate();
```

## 🎯 Future Architecture Evolution

### Phase 2: Enhanced Capabilities (Q2 2025)

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced Features                         │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ GraphQL API  │  │ WebSocket       │  │ ML Inference    │  │
│  │ (Federated)  │  │ (Real-time)     │  │ (On-device)     │  │
│  └──────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐                     │
│  │ Vector DB    │  │ Analytics Engine│                     │
│  │ (Pinecone)   │  │ (Graph Metrics) │                     │
│  └──────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Enterprise Features (Q4 2025)

- **Multi-tenancy** - Organization isolation
- **Role-based Access Control** - Fine-grained permissions
- **Distributed Deployment** - Kubernetes operators
- **Advanced Security** - Encryption at rest, audit compliance

## 📊 Technical Specifications

### Storage Format

**memory_store.json** (Primary Store):
```json
[
  {
    "id": "ent_company_001",
    "name": "TechCorp Thailand",
    "type": "company",
    "observations": [
      {
        "id": "obs_001",
        "content": "Technology company based in Bangkok",
        "timestamp": "2025-01-15T10:00:00Z",
        "source": "manual",
        "confidence": 1.0,
        "tags": ["technology", "bangkok", "company"]
      }
    ],
    "tags": ["technology", "ai", "thailand"],
    "data": {
      "industry": "Technology",
      "location": "Bangkok",
      "employees": 50,
      "founded": 2018
    },
    "links": ["Dr. Somchai AI"],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "degree": 3,
    "sig": "ent_company_001::company::TechCorp Thailand"
  },
  {
    "id": "rel_001",
    "from": "TechCorp Thailand",
    "to": "Dr. Somchai AI",
    "relationType": "employs