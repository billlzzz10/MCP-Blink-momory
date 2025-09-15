# Explicit Agent Protocol + Knowledge Graph Memory

[![Node.js](https://img.shields.io/badge/Node.js-v18+-informational?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/mcp-blink-memory.svg)](https://badge.fury.io/js/mcp-blink-memory)

**Explicit Agent Protocol with Knowledge Graph Memory** - ระบบจัดการความจำแบบกราฟความรู้สำหรับ AI agents ที่ต้องการความโปร่งใสและการตรวจสอบได้ รองรับ semantic search, auto-tagging, และ lineage tracking โดยใช้ ES6 modules แบบ standalone (ไม่ต้อง server หรือ Docker)

## ✨ คุณสมบัติหลัก

- **🏗️ Knowledge Graph Core** - จัดการ entities, relations, observations ในรูปแบบกราฟที่ยืดหยุ่น
- **🔍 Semantic Search** - ค้นหาด้วย vector embeddings (OpenAI, HuggingFace, Mock)
- **🏷️ Auto-Tagging** - สร้าง tags อัตโนมัติจากเนื้อหา (รองรับภาษาไทยและอังกฤษ)
- **📜 Lineage Tracking** - บันทึกประวัติการดำเนินการทุกขั้นตอนแบบ audit-ready
- **🌱 Root Memory Node** - จัดการ memory node หลัก (#0) สำหรับ system baseline
- **⚙️ Modular Architecture** - แยก modules ชัดเจนและ extensible
- **💾 Persistent Storage** - ใช้ JSON files สำหรับ data persistence
- **🌍 Multi-Language** - รองรับการประมวลผลภาษาไทยและอังกฤษ

## 🏗️ สถาปัตยกรรมระบบ

```
Explicit Agent Protocol + KG Memory Architecture
│
├── index.js                          # 🎯 Public API Surface
│   ├── Core Functions                # createEntities(), addObservations(), etc.
│   ├── Mock Implementations          # สำหรับ modules ที่ยังไม่สมบูรณ์
│   └── Health Check                  # ตรวจสอบสถานะระบบ
│
├── modules/                          # 📦 Modular Components
│   ├── memory_graph/                 # 🧠 Knowledge Graph Core
│   │   ├── Entity Management         # createEntities(), deleteEntities()
│   │   ├── Relation Management       # createRelations(), semanticSearch()
│   │   ├── Observation Handling      # addObservations(), searchByTag()
│   │   └── Graph Analytics           # getGraphStats(), readGraph()
│   │
│   ├── embedding_service/            # 🔗 Text-to-Vector Embeddings
│   │   ├── Mock Implementation       # generateMockVector()
│   │   ├── OpenAI Integration        # callOpenAIEmbeddings()
│   │   ├── HuggingFace Integration   # callHuggingFaceEmbeddings()
│   │   └── Vector Math               # cosineSimilarity(), normalizeVector()
│   │
│   ├── auto_tag_service/             # 🏷️ Automatic Tagging
│   │   ├── Basic Keyword Extraction  # รองรับภาษาไทย/อังกฤษ
│   │   ├── Advanced NLP              # Noun phrases, named entities
│   │   └── ML-based Tagging          # Mock ML predictions
│   │
│   ├── memory0_service/              # 🌱 Root Memory Management
│   │   ├── ensureRoot()              # สร้าง root memory node
│   │   ├── linkToRoot()              # เชื่อม entities กับ root
│   │   └── getRootMemory()           # ดึง root memory data
│   │
│   └── system/                       # ⚙️ System Utilities
│       ├── validateStructure()       # ตรวจสอบโครงสร้างโปรเจ็กต์
│       └── selfDescribe()            # System description
│
├── memory/                           # 💾 Persistent Storage
│   ├── memory_store.json             # Main entities & relations
│   ├── lineage_log.json              # Operation history
│   ├── embedding_cache.json          # Vector embeddings cache
│   ├── tag_model.json                # Tagging model data
│   └── tag_cache.json                # Tag cache
│
├── config/                           # ⚙️ Configuration
│   └── access_policy.yaml            # File access permissions
│
├── docs/                             # 📚 Documentation
│   ├── audit_log.md                  # Audit trail
│   ├── legacy_clues.md               # Migration notes
│   └── changelog.md                  # Version history
│
└── .github/                          # 🤝 GitHub Integration
    └── workflows/                    # CI/CD pipelines
```

## 🚀 เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น

- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.0.0
- **Git** (สำหรับ clone repository)

### ติดตั้ง

```bash
# Clone repository
git clone https://github.com/your-org/mcp-blink-memory.git
cd mcp-blink-memory

# ติดตั้ง dependencies
npm install

# ตรวจสอบการติดตั้ง
npm run test:bootstrap
```

### Environment Variables (ไม่บังคับ)

```bash
# Embedding configuration
EMBEDDING_MODE=openai                    # mock, openai, huggingface
OPENAI_API_KEY=sk-your-openai-key        # สำหรับ OpenAI embeddings
HUGGINGFACE_API_KEY=hf-your-hf-key       # สำหรับ HuggingFace embeddings
EMBEDDING_DIMENSIONS=384                 # Vector dimensions

# Tagging configuration
TAG_MODE=advanced                        # basic, advanced, ml
TAG_LANGUAGE=th                          # th, en

# System configuration
NODE_ENV=development                     # development, production
```

## 📖 การใช้งาน

### 1. Initialization - เตรียมระบบ

```javascript
import { ensureInitialized, healthCheck } from './index.js';

// Initialize system
await ensureInitialized();

// Health check
const status = await healthCheck();
console.log('System Status:', status);
```

### 2. สร้าง Entities - เพิ่มข้อมูลใหม่

```javascript
// สร้าง entities พร้อม auto-tagging
const entities = [
  {
    name: "AI Research Lab",
    type: "organization",
    observations: [
      "Laboratory focused on artificial intelligence research and development",
      "Located in Bangkok, Thailand",
      "Specializes in natural language processing and computer vision"
    ],
    data: {
      founded: 2020,
      employees: 25,
      website: "https://ai-lab.th"
    }
  },
  {
    name: "Dr. Somchai AI",
    type: "person",
    observations: [
      "Lead researcher at AI Research Lab",
      "PhD in Machine Learning from Chulalongkorn University",
      "Specializes in transformer models and semantic search"
    ]
  }
];

// Create with auto-tagging and link to root
const created = await createEntities(entities, {
  autoTag: true,
  linkToMemory0: true
});

console.log(`Created ${created.length} entities with tags:`);
created.forEach(entity => {
  console.log(`- ${entity.name}: ${entity.autoTags?.join(', ') || 'no tags'}`);
});
```

### 3. Semantic Search - ค้นหาด้วยความหมาย

```javascript
// ค้นหาด้วย semantic similarity
const results = await semanticSearch("artificial intelligence research in Thailand", {
  topK: 5,
  threshold: 0.3,
  tagFilter: ['ai', 'research', 'thailand']
});

console.log('Semantic Search Results:');
results.forEach((result, index) => {
  console.log(`${index + 1}. ${result.entity.name} (similarity: ${result.similarity.toFixed(3)})`);
  console.log(`   Tags: ${result.matchedTags.join(', ')}`);
  console.log(`   Observations: ${result.observations.map(o => o.content.substring(0, 50) + '...').join('; ')}`);
});
```

### 4. Auto-Tagging - สร้าง tags อัตโนมัติ

```javascript
// เพิ่ม observations พร้อม auto-tagging
const observations = [
  {
    entityName: "AI Research Lab",
    contents: [
      "Recently published paper on Thai language models in ACL 2024",
      "Developing new semantic search engine for Thai documents",
      "Collaborating with universities on AI education programs"
    ],
    source: "news article"
  }
];

const tagged = await addObservations(observations, { autoTag: true });

console.log('Auto-tagged observations:');
tagged.forEach(obs => {
  console.log(`Entity: ${obs.entityName}`);
  console.log(`Generated tags: ${obs.autoTags.join(', ')}`);
  console.log(`Confidence: ${obs.tagConfidence?.map(c => c.toFixed(2)).join(', ')}`);
});
```

### 5. Graph Operations - จัดการ Knowledge Graph

```javascript
// สร้าง relations ระหว่าง entities
const relations = [
  {
    from: "AI Research Lab",
    to: "Dr. Somchai AI",
    relationType: "employs",
    properties: { role: "lead researcher", since: "2020" }
  },
  {
    from: "Dr. Somchai AI",
    to: "AI Research Lab",
    relationType: "works_at",
    properties: { position: "Lead AI Researcher" }
  }
];

const relationResult = await createRelations(relations, { linkToMemory0: true });
console.log(`Created ${relationResult.created} relations`);

// อ่าน graph ทั้งหมด
const fullGraph = await readGraph();
console.log(`Graph stats: ${fullGraph.stats.totalEntities} entities, ${fullGraph.stats.totalRelations} relations`);
```

### 6. System Management - จัดการระบบ

```javascript
// ตรวจสอบโครงสร้าง
const isValid = await validateStructure();
console.log('Structure validation:', isValid ? 'PASS' : 'FAIL');

// Self-description
const description = await selfDescribe();
console.log('System description:', JSON.stringify(description, null, 2));

// Health check
const health = await healthCheck();
console.log('Health status:', health);
```

## 📁 โครงสร้างไฟล์

```
mcp-blink-memory/
├── index.js                          # 🎯 Main API entry point
├── package.json                      # 📦 Dependencies & scripts
├── README.md                         # 📖 Documentation
├── init.ps1                          # 🛠️ Project initialization (Windows)
├── manifest.yaml                     # 📋 System manifest
├── structure.schema.yaml             # 🏗️ Project structure validation
│
├── config/
│   └── access_policy.yaml            # 🔐 File access permissions
│
├── docs/                             # 📚 Documentation
│   ├── audit_log.md                  # 📝 Audit trail
│   ├── legacy_clues.md               # 🔍 Migration notes
│   └── changelog.md                  # 📈 Version history
│
├── memory/                           # 💾 Data storage
│   ├── memory_store.json             # 🧠 Main knowledge graph
│   ├── lineage_log.json              # 📜 Operation history
│   ├── embedding_cache.json          # 🔗 Vector cache
│   ├── tag_model.json                # 🏷️ Tagging model
│   └── tag_cache.json                # 📊 Tag cache
│
├── modules/                          # 📦 Core modules
│   ├── memory_graph/                 # 🧠 Knowledge Graph (entities, relations)
│   ├── embedding_service/            # 🔗 Text embeddings (OpenAI/HuggingFace)
│   ├── auto_tag_service/             # 🏷️ Automatic tagging system
│   ├── memory0_service/              # 🌱 Root memory management
│   └── system/                       # ⚙️ System utilities
│
└── .github/                          # 🤝 GitHub integration
    └── workflows/                    # 🔄 CI/CD pipelines
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMBEDDING_MODE` | Embedding provider | `mock` | No |
| `OPENAI_API_KEY` | OpenAI API key | - | OpenAI mode |
| `HUGGINGFACE_API_KEY` | HuggingFace API key | - | HuggingFace mode |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | `384` | No |
| `TAG_MODE` | Tagging algorithm | `basic` | No |
| `TAG_LANGUAGE` | Language support | `th` | No |
| `NODE_ENV` | Environment | `development` | No |

### Access Policy

ไฟล์ `config/access_policy.yaml` กำหนดสิทธิ์การเข้าถึง:

```yaml
read_only:
  - docs/                    # Documentation files
  - memory/lineage_log.json  # Audit logs

forbidden:
  - __pycache__/             # Python cache
  - node_modules/            # Node dependencies
  - .git/                    # Git metadata
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Bootstrap test (system initialization)
npm run test:bootstrap
```

### Integration Tests

```javascript
// test/integration/memory.test.js
import { ensureInitialized, createEntities, semanticSearch } from '../index.js';

describe('Knowledge Graph Integration', () => {
  test('should create and search entities', async () => {
    await ensureInitialized();
    
    const entities = [{
      name: 'Test Entity',
      type: 'test',
      observations: ['This is a test observation']
    }];
    
    const created = await createEntities(entities);
    expect(created).toHaveLength(1);
    
    const results = await semanticSearch('test observation');
    expect(results).toHaveLength(1);
    expect(results[0].entity.name).toBe('Test Entity');
  });
});
```

## 🔧 Development

### Scripts

| Script | Description |
|--------|-------------|
| `npm run validate` | ตรวจสอบโครงสร้างโปรเจ็กต์ |
| `npm run describe` | แสดง system description |
| `npm run test:bootstrap` | ทดสอบ system initialization |
| `npm test` | Run unit tests |
| `npm run dev` | Development mode |
| `npm run lint` | Code linting |
| `npm run format` | Code formatting |

### Code Style

- **ES6 Modules** - ใช้ `import`/`export` syntax
- **Async/Await** - สำหรับ asynchronous operations
- **Consistent Logging** - ใช้ emoji prefixes
- **Error Handling** - Try/catch ทุก async function
- **Type Safety** - JSDoc comments สำหรับ complex functions

### Contributing

1. **Fork** repository
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Code Review Checklist

- [ ] Code passes linting (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Performance impact assessed
- [ ] Security considerations addressed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** - สำหรับ embedding models
- **HuggingFace** - สำหรับ open-source NLP models
- **Natural.js** - สำหรับ NLP processing
- **Node.js** - สำหรับ runtime environment

## 🚀 Next Steps

1. **Production Deployment** - Docker containerization
2. **Advanced Search** - Hybrid search (keyword + semantic)
3. **Real-time Updates** - WebSocket integration
4. **Analytics Dashboard** - Graph visualization
5. **Multi-agent Support** - Agent collaboration features

## Use with ChatGPT Developer Mode (MCP)

1. Run Node backend:
   ```bash
   npm i
   npx mcp-memory run --port 7070
   ```

2. Run MCP bridge:

   ```bash
   cd mcp
   pip install -r requirements.txt
   BASE_URL=http://localhost:7070 DEFAULT_COLLECTION=notes python server.py
   ```

   MCP SSE URL: `http://localhost:8000/sse/`

3. In ChatGPT → Settings → Connectors → Developer mode → Add server:

   * Label: `mcp-memory`
   * URL: `http://localhost:8000/sse/`
  * Allowed tools: `search`, `fetch`
  * Approval: `never`

---

### Security notes

- By default the bridge binds to `0.0.0.0`; set `HOST=127.0.0.1` to keep it local.
- JSON payloads are capped at 1 MB and individual documents at ~50 kB.
- Only text payloads are accepted; binary data is rejected.


**Explicit Agent Protocol + KG Memory** - Building transparent, auditable AI memory systems for the future.

[Demo Video](https://youtu.be/demo) | [API Docs](docs/api.md) | [Contribute](CONTRIBUTING.md)
