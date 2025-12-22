# init.ps1 - สร้างโครงสร้างโปรเจ็กต์ MCP Blink Memory TypeScript Edition
# เวอร์ชัน: 2.0.0
# สำหรับ: Node.js + TypeScript + JSON-RPC 2.0

Write-Host "🚀 กำลังสร้างโครงสร้าง MCP Blink Memory TypeScript Edition..." -ForegroundColor Cyan

# สร้างโฟลเดอร์โครงสร้างใหม่
$folders = @(
    # 📦 Source structure
    "src",
    "src/server",
    "src/server/handlers",
    "src/core",
    "src/types",
    "src/storage",
    "src/utils",
    
    # 🧠 Core modules (ใหม่)
    "src/core/memory-graph",
    "src/core/embedding-service",
    "src/core/auto-tag-service",
    "src/core/memory0-service",
    "src/core/system",
    
    # 💾 Data storage
    "memory",
    
    # ⚙️ Configuration
    "config",
    
    # 📚 Documentation
    "docs",
    
    # 🧪 Testing
    "tests",
    "tests/unit",
    "tests/integration",
    "tests/e2e",
    
    # 📖 Examples
    "examples",
    
    # 🤝 GitHub
    ".github",
    ".github/workflows",
    
    # 📦 Build output
    "dist",
    
    # 🏗️ JSON Schemas
    "schemas"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "📁 สร้างโฟลเดอร์: $folder" -ForegroundColor Green
    }
}

# 📦 package.json (TypeScript edition)
$packageJson = @{
    name = "mcp-blink-memory"
    version = "2.0.0"
    description = "MCP-compatible Knowledge Graph Memory System with TypeScript & JSON-RPC 2.0"
    main = "dist/index.js"
    types = "dist/index.d.ts"
    bin = @{
        "mcp-blink-memory" = "dist/index.js"
    }
    scripts = @{
        build = "tsc"
        start = "node dist/index.js"
        dev = "nodemon --watch src --exec ts-node src/index.ts"
        test = "jest --config jest.config.ts"
        "test:unit" = "jest --config jest.config.ts --testPathPattern=unit"
        "test:integration" = "jest --config jest.config.ts --testPathPattern=integration"
        "test:e2e" = "jest --config jest.config.ts --testPathPattern=e2e"
        "test:watch" = "jest --watch"
        "test:coverage" = "jest --coverage"
        lint = "eslint src/**/*.ts"
        format = "prettier --write src/**/*.ts"
        validate = "ts-node src/core/system/validator.ts"
        "validate:structure" = "npm run validate -- --check-structure"
        docs = "typedoc --out docs/api src/index.ts"
        clean = "rm -rf dist coverage"
        "prepublishOnly" = "npm run build && npm test"
    }
    dependencies = @{
        "json-rpc-2.0" = "^1.0.0"
        "js-yaml" = "^4.1.0"
        "winston" = "^3.11.0"
        "zod" = "^3.22.0"
        "dotenv" = "^16.3.0"
    }
    devDependencies = @{
        typescript = "^5.0.0"
        "@types/node" = "^20.0.0"
        "@types/js-yaml" = "^4.0.0"
        "ts-node" = "^10.9.0"
        nodemon = "^3.0.0"
        jest = "^29.0.0"
        "ts-jest" = "^29.1.0"
        "@types/jest" = "^29.0.0"
        eslint = "^8.0.0"
        "@typescript-eslint/eslint-plugin" = "^6.0.0"
        "@typescript-eslint/parser" = "^6.0.0"
        prettier = "^3.0.0"
        typedoc = "^0.25.0"
        "@types/json-rpc-2.0" = "^1.0.0"
    }
    keywords = @(
        "mcp",
        "model-context-protocol",
        "json-rpc",
        "knowledge-graph",
        "memory-system",
        "typescript",
        "ai-agents"
    )
    author = "Your Name"
    license = "MIT"
    engines = @{
        node = ">=18.0.0"
        npm = ">=9.0.0"
    }
    files = @(
        "dist",
        "src",
        "LICENSE",
        "README.md",
        "manifest.json"
    )
    repository = @{
        type = "git"
        url = "https://github.com/your-org/mcp-blink-memory.git"
    }
    bugs = @{
        url = "https://github.com/your-org/mcp-blink-memory/issues"
    }
    homepage = "https://github.com/your-org/mcp-blink-memory#readme"
}

$packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding utf8
Write-Host "📦 สร้าง package.json (TypeScript edition)" -ForegroundColor Green

# ⚙️ tsconfig.json
$tsconfig = @{
    compilerOptions = @{
        target = "ES2020"
        module = "commonjs"
        lib = @("ES2020")
        outDir = "./dist"
        rootDir = "./src"
        strict = $true
        esModuleInterop = $true
        skipLibCheck = $true
        forceConsistentCasingInFileNames = $true
        resolveJsonModule = $true
        declaration = $true
        declarationMap = $true
        sourceMap = $true
        experimentalDecorators = $true
        emitDecoratorMetadata = $true
        moduleResolution = "node"
        allowSyntheticDefaultImports = $true
        types = @("node", "jest")
        baseUrl = "./src"
        paths = @{
            "@/*" = @("*")
        }
    }
    include = @(
        "src/**/*"
    )
    exclude = @(
        "node_modules",
        "dist",
        "**/*.test.ts",
        "**/*.spec.ts"
    )
}

$tsconfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "tsconfig.json" -Encoding utf8
Write-Host "⚙️ สร้าง tsconfig.json" -ForegroundColor Green

# 🎯 manifest.json (MCP manifest)
$manifest = @{
    name = "blink-memory"
    version = "2.0.0"
    description = "Knowledge Graph Memory System with MCP Support"
    protocol_version = "2024-11-05"
    capabilities = @{
        tools = @(
            @{
                name = "create_entities"
                description = "Create new entities in the knowledge graph"
                input_schema = @{
                    type = "object"
                    properties = @{
                        entities = @{
                            type = "array"
                            items = @{
                                type = "object"
                                properties = @{
                                    name = @{
                                        type = "string"
                                        description = "Entity name"
                                    }
                                    type = @{
                                        type = "string"
                                        description = "Entity type (person, organization, etc.)"
                                    }
                                    observations = @{
                                        type = "array"
                                        items = @{ type = "string" }
                                        description = "Observations about the entity"
                                    }
                                    metadata = @{
                                        type = "object"
                                        description = "Additional metadata"
                                    }
                                }
                                required = @("name", "type")
                            }
                            description = "Array of entities to create"
                        }
                        options = @{
                            type = "object"
                            properties = @{
                                autoTag = @{
                                    type = "boolean"
                                    description = "Enable automatic tagging"
                                }
                                linkToMemory0 = @{
                                    type = "boolean"
                                    description = "Link entities to root memory node"
                                }
                            }
                        }
                    }
                    required = @("entities")
                }
            },
            @{
                name = "semantic_search"
                description = "Search entities by semantic similarity"
                input_schema = @{
                    type = "object"
                    properties = @{
                        query = @{
                            type = "string"
                            description = "Search query text"
                        }
                        options = @{
                            type = "object"
                            properties = @{
                                topK = @{
                                    type = "integer"
                                    minimum = 1
                                    maximum = 50
                                    description = "Number of results to return"
                                }
                                threshold = @{
                                    type = "number"
                                    minimum = 0.0
                                    maximum = 1.0
                                    description = "Similarity threshold"
                                }
                                tagFilter = @{
                                    type = "array"
                                    items = @{ type = "string" }
                                    description = "Filter results by tags"
                                }
                            }
                        }
                    }
                    required = @("query")
                }
            }
        )
        resources = @(
            @{
                uri = "memory://graph/stats"
                name = "graph_stats"
                description = "Knowledge graph statistics"
                mimeType = "application/json"
            },
            @{
                uri = "memory://lineage/latest"
                name = "recent_operations"
                description = "Recent operations log"
                mimeType = "application/json"
            }
        )
    }
    definitions = @{
        EntityInput = @{
            type = "object"
            properties = @{
                name = @{
                    type = "string"
                    description = "Entity name"
                }
                type = @{
                    type = "string"
                    description = "Entity type (person, organization, etc.)"
                }
                observations = @{
                    type = "array"
                    items = @{ type = "string" }
                    description = "Observations about the entity"
                }
                metadata = @{
                    type = "object"
                    description = "Additional metadata"
                }
            }
            required = @("name", "type")
        }
    }
}

$manifest | ConvertTo-Json -Depth 10 | Out-File -FilePath "manifest.json" -Encoding utf8
Write-Host "🎯 สร้าง manifest.json (MCP)" -ForegroundColor Green

# 🏗️ structure.schema.yaml (ใหม่)
$structureSchema = @"
# structure.schema.yaml - สำหรับ MCP Blink Memory TypeScript Edition
name: "mcp-blink-memory-structure"
version: "2.0.0"
description: "โครงสร้างโปรเจกต์ MCP Blink Memory แบบ TypeScript + JSON-RPC 2.0"

required_folders:
  - src
  - src/server
  - src/server/handlers
  - src/core
  - src/types
  - src/storage
  - src/utils
  - src/core/memory-graph
  - src/core/embedding-service
  - src/core/auto-tag-service
  - src/core/memory0-service
  - src/core/system
  - memory
  - config
  - docs
  - tests
  - tests/unit
  - tests/integration
  - tests/e2e
  - examples
  - .github
  - .github/workflows

required_files:
  - package.json
  - tsconfig.json
  - manifest.json
  - config/mcp-config.yaml
  - src/index.ts
  - src/server/index.ts
  - src/types/index.ts
  - memory/memory_store.json
  - memory/lineage_log.json
  - memory/embedding_cache.json
  - memory/tag_cache.json
  - docs/audit_log.md
  - docs/legacy_clues.md
  - docs/changelog.md
  - docs/api-reference.md
  - docs/migration-guide.md
  - docs/mcp-integration.md

optional_folders:
  - dist
  - node_modules
  - coverage
  - schemas

optional_files:
  - .env
  - .env.example
  - .gitignore
  - README.md
  - LICENSE
  - CONTRIBUTING.md
  - init.ps1
  - structure.schema.yaml

validation_rules:
  memory:
    description: "Data storage directory"
    writable: true
    should_exist: ["memory_store.json", "lineage_log.json"]
  
  config:
    description: "Configuration directory"
    should_exist: ["mcp-config.yaml"]
  
  src:
    description: "TypeScript source code"
    should_exist: ["index.ts", "server/", "core/", "types/"]
  
  file_size_limits:
    memory_store.json: "10MB"
    lineage_log.json: "50MB"
    embedding_cache.json: "100MB"
    
  permissions:
    memory/: "read-write"
    config/: "read-only"
    src/: "read-only"
    dist/: "read-write"
"@

$structureSchema | Out-File -FilePath "structure.schema.yaml" -Encoding utf8
Write-Host "🏗️ สร้าง structure.schema.yaml (ใหม่)" -ForegroundColor Green

# ⚙️ config/mcp-config.yaml (แทน access_policy.yaml)
$mcpConfig = @"
# MCP Server Configuration
server:
  port: 7070
  host: "0.0.0.0"
  logLevel: "info"
  cors:
    enabled: true
    origin: "*"
    methods: ["GET", "POST", "OPTIONS"]
    allowedHeaders: ["Content-Type", "Authorization"]

features:
  semanticSearch:
    enabled: true
    defaultTopK: 10
    defaultThreshold: 0.3
    maxQueryLength: 1000
  
  autoTagging:
    enabled: true
    defaultLanguage: "th"
    minConfidence: 0.5
    supportedLanguages: ["th", "en"]
  
  auditLogging:
    enabled: true
    maxLogSize: "100MB"
    retentionDays: 30
    logLevels: ["info", "warn", "error", "audit"]
  
  caching:
    embeddings:
      enabled: true
      ttl: 86400  # 24 hours in seconds
    tags:
      enabled: true
      ttl: 43200  # 12 hours

storage:
  memoryStorePath: "./memory/memory_store.json"
  lineageLogPath: "./memory/lineage_log.json"
  embeddingCachePath: "./memory/embedding_cache.json"
  tagCachePath: "./memory/tag_cache.json"
  backup:
    enabled: true
    interval: "24h"
    maxBackups: 7
    backupPath: "./memory/backups"

security:
  rateLimiting:
    enabled: true
    maxRequests: 100
    windowMs: 900000  # 15 minutes
  requestSizeLimit: "1mb"
  allowedOrigins:
    - "http://localhost:*"
    - "http://127.0.0.1:*"

embedding:
  defaultProvider: "mock"
  providers:
    openai:
      model: "text-embedding-3-small"
      dimensions: 1536
    huggingface:
      model: "sentence-transformers/all-MiniLM-L6-v2"
      dimensions: 384
    mock:
      dimensions: 384

tagging:
  defaultLanguage: "th"
  tagGenerators:
    basic:
      enabled: true
      maxTags: 10
    advanced:
      enabled: false
      useNLP: true
    ml:
      enabled: false
      modelPath: "./models/tagging-model.json"
"@

$mcpConfig | Out-File -FilePath "config/mcp-config.yaml" -Encoding utf8
Write-Host "⚙️ สร้าง config/mcp-config.yaml (MCP configuration)" -ForegroundColor Green

# 🧪 jest.config.ts
$jestConfig = @"
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  verbose: true,
  testTimeout: 30000
};

export default config;
"@

$jestConfig | Out-File -FilePath "jest.config.ts" -Encoding utf8
Write-Host "🧪 สร้าง jest.config.ts" -ForegroundColor Green

# 📄 .env.example
$envExample = @"
# MCP Server Configuration
MCP_PORT=7070
MCP_HOST=localhost
MCP_LOG_LEVEL=info

# Embedding Service
EMBEDDING_MODE=mock  # mock, openai, huggingface
OPENAI_API_KEY=sk-your-key-here
HUGGINGFACE_API_KEY=hf-your-key-here
EMBEDDING_DIMENSIONS=384

# Tagging Service
TAG_MODE=basic  # basic, advanced, ml
TAG_LANGUAGE=th  # th, en

# Storage
STORAGE_PATH=./memory
ENABLE_AUDIT_LOG=true

# Development
NODE_ENV=development
DEBUG=mcp:*
"@

$envExample | Out-File -FilePath ".env.example" -Encoding utf8
Write-Host "📄 สร้าง .env.example" -ForegroundColor Green

# 🤫 .gitignore
$gitignore = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
coverage/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Temporary files
tmp/
temp/

# Memory files (можно игнорировать, но лучше коммитить для демо)
# memory/memory_store.json
# memory/lineage_log.json
# memory/embedding_cache.json
# memory/tag_cache.json
"@

$gitignore | Out-File -FilePath ".gitignore" -Encoding utf8
Write-Host "🤫 สร้าง .gitignore" -ForegroundColor Green

# 💾 Memory files
"[]" | Out-File -FilePath "memory/memory_store.json" -Encoding utf8
"[]" | Out-File -FilePath "memory/lineage_log.json" -Encoding utf8
"{}" | Out-File -FilePath "memory/embedding_cache.json" -Encoding utf8
"{}" | Out-File -FilePath "memory/tag_cache.json" -Encoding utf8
Write-Host "💾 สร้างไฟล์ memory เริ่มต้น" -ForegroundColor Green

# 📚 Documentation placeholders
"# API Reference" | Out-File -FilePath "docs/api-reference.md" -Encoding utf8
"# Migration Guide (v1 to v2)" | Out-File -FilePath "docs/migration-guide.md" -Encoding utf8
"# MCP Integration Guide" | Out-File -FilePath "docs/mcp-integration.md" -Encoding utf8
"# Audit Log" | Out-File -FilePath "docs/audit_log.md" -Encoding utf8
"# Legacy Clues" | Out-File -FilePath "docs/legacy_clues.md" -Encoding utf8
"# Changelog" | Out-File -FilePath "docs/changelog.md" -Encoding utf8
Write-Host "📚 สร้างเอกสารเริ่มต้น" -ForegroundColor Green

# 👥 CONTRIBUTING.md
$contributing = @"
# Contributing to MCP Blink Memory

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository
2. Run \`npm install\`
3. Copy \`.env.example\` to \`.env\`
4. Run \`npm run dev\` for development

## Code Style

- Use TypeScript with strict mode
- Follow ESLint rules
- Write tests for new features
- Update documentation

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Run tests: \`npm test\`
4. Update documentation if needed
5. Submit PR with clear description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
"@

$contributing | Out-File -FilePath "CONTRIBUTING.md" -Encoding utf8
Write-Host "👥 สร้าง CONTRIBUTING.md" -ForegroundColor Green

# ⚖️ LICENSE
$license = @"
MIT License

Copyright (c) 2024 MCP Blink Memory Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"@

$license | Out-File -FilePath "LICENSE" -Encoding utf8
Write-Host "⚖️ สร้าง LICENSE" -ForegroundColor Green

# 🤖 .github/workflows/ci.yml
$ciYml = @"
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
  
  validate-structure:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Validate project structure
      run: |
        npm ci
        npm run validate:structure
"@

New-Item -ItemType Directory -Path ".github/workflows" -Force | Out-Null
$ciYml | Out-File -FilePath ".github/workflows/ci.yml" -Encoding utf8
Write-Host "🤖 สร้าง GitHub CI workflow" -ForegroundColor Green

Write-Host ""
Write-Host "✅ โครงสร้างโปรเจ็กต์ MCP Blink Memory TypeScript Edition ถูกสร้างเรียบร้อยแล้ว!" -ForegroundColor Cyan
Write-Host ""
Write-Host "ขั้นตอนต่อไป:" -ForegroundColor Yellow
Write-Host "1. ติดตั้ง dependencies: npm install" -ForegroundColor White
Write-Host "2. สร้างไฟล์ .env: copy .env.example .env" -ForegroundColor White
Write-Host "3. Development mode: npm run dev" -ForegroundColor White
Write-Host "4. Build: npm run build" -ForegroundColor White
Write-Host "5. Start server: npm start" -ForegroundColor White
Write-Host ""
Write-Host "📖 ดูเอกสารเพิ่มเติมที่ docs/" -ForegroundColor Green
Write-Host ""