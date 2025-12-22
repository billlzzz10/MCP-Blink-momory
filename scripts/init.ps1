# init.ps1 - สร้างโครงสร้างโปรเจ็กต์ MCP Blink Memory TypeScript Edition
# เวอร์ชัน: 2.0.0
# สำหรับ: Node.js + TypeScript + JSON-RPC 2.0

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function WriteUtf8File {
    param (
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $Content
    )

    $directory = Split-Path $Path -Parent
    if ($directory -and -not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

Write-Host "Creating MCP Blink Memory TypeScript Edition scaffold..." -ForegroundColor Cyan

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
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "Created folder: $folder" -ForegroundColor Green
    }
}

# 📦 package.json (TypeScript edition)
$packageJson = [ordered]@{
    name        = "mcp-blink-memory"
    version     = "2.0.0"
    description = "MCP-compatible Knowledge Graph Memory System with TypeScript & JSON-RPC 2.0"
    main        = "dist/index.js"
    types       = "dist/index.d.ts"
    bin         = @{
        "mcp-blink-memory" = "dist/index.js"
    }
    scripts     = @{
        build               = "tsc"
        start               = "node dist/index.js"
        dev                 = "nodemon --watch src --exec ts-node src/index.ts"
        test                = "jest --config jest.config.ts"
        "test:unit"         = "jest --config jest.config.ts --testPathPattern=unit"
        "test:integration"  = "jest --config jest.config.ts --testPathPattern=integration"
        "test:e2e"          = "jest --config jest.config.ts --testPathPattern=e2e"
        "test:watch"        = "jest --watch"
        "test:coverage"     = "jest --coverage"
        lint                = "eslint src/**/*.ts"
        format              = "prettier --write src/**/*.ts"
        validate            = "ts-node src/core/system/validator.ts"
        "validate:structure"= "npm run validate -- --check-structure"
        docs                = "typedoc --out docs/api src/index.ts"
        clean               = "rm -rf dist coverage"
        prepublishOnly      = "npm run build && npm test"
    }
    dependencies = @{
        "json-rpc-2.0" = "^1.0.0"
        "js-yaml"      = "^4.1.0"
        "winston"      = "^3.11.0"
        "zod"          = "^3.22.0"
        "dotenv"       = "^16.3.0"
    }
    devDependencies = @{
        typescript                        = "^5.0.0"
        "@types/node"                     = "^20.0.0"
        "@types/js-yaml"                  = "^4.0.0"
        "ts-node"                         = "^10.9.0"
        nodemon                           = "^3.0.0"
        jest                              = "^29.0.0"
        "ts-jest"                         = "^29.1.0"
        "@types/jest"                     = "^29.0.0"
        eslint                            = "^8.0.0"
        "@typescript-eslint/eslint-plugin"= "^6.0.0"
        "@typescript-eslint/parser"       = "^6.0.0"
        prettier                          = "^3.0.0"
        typedoc                           = "^0.25.0"
        "@types/json-rpc-2.0"             = "^1.0.0"
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
    author      = "Your Name"
    license     = "MIT"
    engines     = @{
        node = ">=18.0.0"
        npm  = ">=9.0.0"
    }
    files       = @("dist", "src", "LICENSE", "README.md", "manifest.json")
    repository  = @{
        type = "git"
        url  = "https://github.com/your-org/mcp-blink-memory.git"
    }
    bugs        = @{ url = "https://github.com/your-org/mcp-blink-memory/issues" }
    homepage    = "https://github.com/your-org/mcp-blink-memory#readme"
}

WriteUtf8File -Path "package.json" -Content ($packageJson | ConvertTo-Json -Depth 10)
Write-Host "Created package.json (TypeScript edition)" -ForegroundColor Green

# ⚙️ tsconfig.json
$tsconfig = @{
    compilerOptions = @{
        target                           = "ES2020"
        module                           = "commonjs"
        lib                              = @("ES2020")
        outDir                           = "./dist"
        rootDir                          = "./src"
        strict                           = $true
        esModuleInterop                  = $true
        skipLibCheck                     = $true
        forceConsistentCasingInFileNames = $true
        resolveJsonModule                = $true
        declaration                      = $true
        declarationMap                   = $true
        sourceMap                        = $true
        experimentalDecorators           = $true
        emitDecoratorMetadata            = $true
        moduleResolution                 = "node"
        allowSyntheticDefaultImports     = $true
        types                            = @("node", "jest")
        baseUrl                          = "./src"
        paths                            = @{ "@/*" = @("*") }
    }
    include = @("src/**/*")
    exclude = @("node_modules", "dist", "**/*.test.ts", "**/*.spec.ts")
}

WriteUtf8File -Path "tsconfig.json" -Content ($tsconfig | ConvertTo-Json -Depth 10)
Write-Host "Created tsconfig.json" -ForegroundColor Green

# 🎯 manifest.json (MCP manifest)
$manifestJsonBase64 = "ewogICJuYW1lIjogImJsaW5rLW1lbW9yeSIsCiAgInZlcnNpb24iOiAiMi4wLjAiLAogICJkZXNjcmlwdGlvbiI6ICJLbm93bGVkZ2UgR3JhcGggTWVtb3J5IFN5c3RlbSB3aXRoIE1DUCBTdXBwb3J0IiwKICAicHJvdG9jb2xfdmVyc2lvbiI6ICIyMDI0LTExLTA1IiwKICAiY2FwYWJpbGl0aWVzIjogewogICAgInRvb2xzIjogWwogICAgICB7CiAgICAgICAgIm5hbWUiOiAiY3JlYXRlX2VudGl0aWVzIiwKICAgICAgICAiZGVzY3JpcHRpb24iOiAiQ3JlYXRlIG5ldyBlbnRpdGllcyBpbiB0aGUga25vd2xlZGdlIGdyYXBoIiwKICAgICAgICAiaW5wdXRfc2NoZW1hIjogewogICAgICAgICAgInR5cGUiOiAib2JqZWN0IiwKICAgICAgICAgICJwcm9wZXJ0aWVzIjogewogICAgICAgICAgICAiZW50aXRpZXMiOiB7CiAgICAgICAgICAgICAgInR5cGUiOiAiYXJyYXkiLAogICAgICAgICAgICAgICJpdGVtcyI6IHsKICAgICAgICAgICAgICAgICJ0eXBlIjogIm9iamVjdCIsCiAgICAgICAgICAgICAgICAicHJvcGVydGllcyI6IHsKICAgICAgICAgICAgICAgICAgIm5hbWUiOiB7CiAgICAgICAgICAgICAgICAgICAgInR5cGUiOiAic3RyaW5nIiwKICAgICAgICAgICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiRW50aXR5IG5hbWUiCiAgICAgICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgICAgICJ0eXBlIjogewogICAgICAgICAgICAgICAgICAgICJ0eXBlIjogInN0cmluZyIsCiAgICAgICAgICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkVudGl0eSB0eXBlIChwZXJzb24sIG9yZ2FuaXphdGlvbiwgZXRjLikiCiAgICAgICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgICAgICJvYnNlcnZhdGlvbnMiOiB7CiAgICAgICAgICAgICAgICAgICAgInR5cGUiOiAiYXJyYXkiLAogICAgICAgICAgICAgICAgICAgICJpdGVtcyI6IHsgInR5cGUiOiAic3RyaW5nIiB9LAogICAgICAgICAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJPYnNlcnZhdGlvbnMgYWJvdXQgdGhlIGVudGl0eSIKICAgICAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICAgICAgIm1ldGFkYXRhIjogewogICAgICAgICAgICAgICAgICAgICJ0eXBlIjogIm9iamVjdCIsCiAgICAgICAgICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkFkZGl0aW9uYWwgbWV0YWRhdGEiCiAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgICAicmVxdWlyZWQiOiBbIm5hbWUiLCAidHlwZSJdCiAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiQXJyYXkgb2YgZW50aXRpZXMgdG8gY3JlYXRlIgogICAgICAgICAgICB9LAogICAgICAgICAgICAib3B0aW9ucyI6IHsKICAgICAgICAgICAgICAidHlwZSI6ICJvYmplY3QiLAogICAgICAgICAgICAgICJwcm9wZXJ0aWVzIjogewogICAgICAgICAgICAgICAgImF1dG9UYWciOiB7CiAgICAgICAgICAgICAgICAgICJ0eXBlIjogImJvb2xlYW4iLAogICAgICAgICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiRW5hYmxlIGF1dG9tYXRpYyB0YWdnaW5nIgogICAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICAgICJsaW5rVG9NZW1vcnkwIjogewogICAgICAgICAgICAgICAgICAidHlwZSI6ICJib29sZWFuIiwKICAgICAgICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkxpbmsgZW50aXRpZXMgdG8gcm9vdCBtZW1vcnkgbm9kZSIKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgIH0sCiAgICAgICAgICAicmVxdWlyZWQiOiBbImVudGl0aWVzIl0KICAgICAgICB9CiAgICAgIH0sCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJzZW1hbnRpY19zZWFyY2giLAogICAgICAgICJkZXNjcmlwdGlvbiI6ICJTZWFyY2ggZW50aXRpZXMgYnkgc2VtYW50aWMgc2ltaWxhcml0eSIsCiAgICAgICAgImlucHV0X3NjaGVtYSI6IHsKICAgICAgICAgICJ0eXBlIjogIm9iamVjdCIsCiAgICAgICAgICAicHJvcGVydGllcyI6IHsKICAgICAgICAgICAgInF1ZXJ5IjogewogICAgICAgICAgICAgICJ0eXBlIjogInN0cmluZyIsCiAgICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIlNlYXJjaCBxdWVyeSB0ZXh0IgogICAgICAgICAgICB9LAogICAgICAgICAgICAib3B0aW9ucyI6IHsKICAgICAgICAgICAgICAidHlwZSI6ICJvYmplY3QiLAogICAgICAgICAgICAgICJwcm9wZXJ0aWVzIjogewogICAgICAgICAgICAgICAgInRvcEsiOiB7CiAgICAgICAgICAgICAgICAgICJ0eXBlIjogImludGVnZXIiLAogICAgICAgICAgICAgICAgICAibWluaW11bSI6IDEsCiAgICAgICAgICAgICAgICAgICJtYXhpbXVtIjogNTAsCiAgICAgICAgICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJOdW1iZXIgb2YgcmVzdWx0cyB0byByZXR1cm4iCiAgICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgICAgInRocmVzaG9sZCI6IHsKICAgICAgICAgICAgICAgICAgInR5cGUiOiAibnVtYmVyIiwKICAgICAgICAgICAgICAgICAgIm1pbmltdW0iOiAwLjAsCiAgICAgICAgICAgICAgICAgICJtYXhpbXVtIjogMS4wLAogICAgICAgICAgICAgICAgICAiZGVzY3JpcHRpb24iOiAiU2ltaWxhcml0eSB0aHJlc2hvbGQiCiAgICAgICAgICAgICAgICB9LAogICAgICAgICAgICAgICAgInRhZ0ZpbHRlciI6IHsKICAgICAgICAgICAgICAgICAgInR5cGUiOiAiYXJyYXkiLAogICAgICAgICAgICAgICAgICAiaXRlbXMiOiB7ICJ0eXBlIjogInN0cmluZyIgfSwKICAgICAgICAgICAgICAgICAgImRlc2NyaXB0aW9uIjogIkZpbHRlciByZXN1bHRzIGJ5IHRhZ3MiCiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgICB9LAogICAgICAgICAgInJlcXVpcmVkIjogWyJxdWVyeSJdCiAgICAgICAgfQogICAgICB9CiAgICBdLAogICAgInJlc291cmNlcyI6IFsKICAgICAgewogICAgICAgICJ1cmkiOiAibWVtb3J5Oi8vZ3JhcGgvc3RhdHMiLAogICAgICAgICJuYW1lIjogImdyYXBoX3N0YXRzIiwKICAgICAgICAiZGVzY3JpcHRpb24iOiAiS25vd2xlZGdlIGdyYXBoIHN0YXRpc3RpY3MiLAogICAgICAgICJtaW1lVHlwZSI6ICJhcHBsaWNhdGlvbi9qc29uIgogICAgICB9LAogICAgICB7CiAgICAgICAgInVyaSI6ICJtZW1vcnk6Ly9saW5lYWdlL2xhdGVzdCIsCiAgICAgICAgIm5hbWUiOiAicmVjZW50X29wZXJhdGlvbnMiLAogICAgICAgICJkZXNjcmlwdGlvbiI6ICJSZWNlbnQgb3BlcmF0aW9ucyBsb2ciLAogICAgICAgICJtaW1lVHlwZSI6ICJhcHBsaWNhdGlvbi9qc29uIgogICAgICB9CiAgICBdCiAgfSwKICAiZGVmaW5pdGlvbnMiOiB7CiAgICAiRW50aXR5SW5wdXQiOiB7CiAgICAgICJ0eXBlIjogIm9iamVjdCIsCiAgICAgICJwcm9wZXJ0aWVzIjogewogICAgICAgICJuYW1lIjogewogICAgICAgICAgInR5cGUiOiAic3RyaW5nIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJFbnRpdHkgbmFtZSIKICAgICAgICB9LAogICAgICAgICJ0eXBlIjogewogICAgICAgICAgInR5cGUiOiAic3RyaW5nIiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJFbnRpdHkgdHlwZSAocGVyc29uLCBvcmdhbml6YXRpb24sIGV0Yy4pIgogICAgICAgIH0sCiAgICAgICAgIm9ic2VydmF0aW9ucyI6IHsKICAgICAgICAgICJ0eXBlIjogImFycmF5IiwKICAgICAgICAgICJpdGVtcyI6IHsgInR5cGUiOiAic3RyaW5nIiB9LAogICAgICAgICAgImRlc2NyaXB0aW9uIjogIk9ic2VydmF0aW9ucyBhYm91dCB0aGUgZW50aXR5IgogICAgICAgIH0sCiAgICAgICAgIm1ldGFkYXRhIjogewogICAgICAgICAgInR5cGUiOiAib2JqZWN0IiwKICAgICAgICAgICJkZXNjcmlwdGlvbiI6ICJBZGRpdGlvbmFsIG1ldGFkYXRhIgogICAgICAgIH0KICAgICAgfSwKICAgICAgInJlcXVpcmVkIjogWyJuYW1lIiwgInR5cGUiXQogICAgfQogIH0KfQ=="
$manifestJson = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($manifestJsonBase64))

WriteUtf8File -Path "manifest.json" -Content $manifestJson
Write-Host "Created manifest.json (MCP)" -ForegroundColor Green

# 🏗️ structure.schema.yaml (ใหม่)
$structureSchema = @'
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
'@

WriteUtf8File -Path "structure.schema.yaml" -Content $structureSchema
Write-Host "Created structure.schema.yaml" -ForegroundColor Green

# ⚙️ config/mcp-config.yaml (แทน access_policy.yaml)
$mcpConfig = @'
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
'@

WriteUtf8File -Path "config/mcp-config.yaml" -Content $mcpConfig
Write-Host "Created config/mcp-config.yaml (MCP configuration)" -ForegroundColor Green

# 🧪 jest.config.ts
$jestConfig = @'
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
'@

WriteUtf8File -Path "jest.config.ts" -Content $jestConfig
Write-Host "Created jest.config.ts" -ForegroundColor Green

# 📄 .env.example
$envExample = @'
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
'@

WriteUtf8File -Path ".env.example" -Content $envExample
Write-Host "Created .env.example" -ForegroundColor Green

# 🤫 .gitignore
$gitignore = @'
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
'@

WriteUtf8File -Path ".gitignore" -Content $gitignore
Write-Host "Created .gitignore" -ForegroundColor Green

# 💾 Memory files
WriteUtf8File -Path "memory/memory_store.json" -Content "[]"
WriteUtf8File -Path "memory/lineage_log.json" -Content "[]"
WriteUtf8File -Path "memory/embedding_cache.json" -Content "{}"
WriteUtf8File -Path "memory/tag_cache.json" -Content "{}"
Write-Host "Initialized memory files" -ForegroundColor Green

# 📚 Documentation placeholders
WriteUtf8File -Path "docs/api-reference.md" -Content "# API Reference"
WriteUtf8File -Path "docs/migration-guide.md" -Content "# Migration Guide (v1 to v2)"
WriteUtf8File -Path "docs/mcp-integration.md" -Content "# MCP Integration Guide"
WriteUtf8File -Path "docs/audit_log.md" -Content "# Audit Log"
WriteUtf8File -Path "docs/legacy_clues.md" -Content "# Legacy Clues"
WriteUtf8File -Path "docs/changelog.md" -Content "# Changelog"
Write-Host "Created initial docs" -ForegroundColor Green

# 👥 CONTRIBUTING.md
$contributing = @'
# Contributing to MCP Blink Memory

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env`
4. Run `npm run dev` for development

## Code Style

- Use TypeScript with strict mode
- Follow ESLint rules
- Write tests for new features
- Update documentation

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Update documentation if needed
5. Submit PR with clear description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
'@

WriteUtf8File -Path "CONTRIBUTING.md" -Content $contributing
Write-Host "Created CONTRIBUTING.md" -ForegroundColor Green

# ⚖️ LICENSE
$license = @'
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
'@

WriteUtf8File -Path "LICENSE" -Content $license
Write-Host "Created LICENSE" -ForegroundColor Green

# 🤖 .github/workflows/ci.yml
$ciYml = @'
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
'@

WriteUtf8File -Path ".github/workflows/ci.yml" -Content $ciYml
Write-Host "Created GitHub CI workflow" -ForegroundColor Green

Write-Host ""
Write-Host "Project scaffold complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Install dependencies: npm install" -ForegroundColor White
Write-Host "2. Copy env: copy .env.example .env" -ForegroundColor White
Write-Host "3. Development mode: npm run dev" -ForegroundColor White
Write-Host "4. Build: npm run build" -ForegroundColor White
Write-Host "5. Start server: npm start" -ForegroundColor White
Write-Host ""
Write-Host "Docs available in docs/" -ForegroundColor Green
Write-Host ""
