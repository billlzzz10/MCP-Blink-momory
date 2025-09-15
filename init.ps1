# init.ps1 - สร้างโครงสร้างโปรเจ็กต์รวม Explicit Agent Protocol + KG Memory

# สร้างโฟลเดอร์
$folders = @("modules/memory_graph", "modules/embedding_service", "modules/auto_tag_service", "modules/memory0_service", "config", "memory", "docs", ".github")

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "📁 สร้างโฟลเดอร์: $folder"
    }
}

# package.json
$packageJson = @{
    name = "explicit-agent"
    version = "1.0.0"
    description = "Explicit Agent Protocol + Knowledge Graph Memory"
    bin = @{ "explicit-agent" = "index.js" }
    scripts = @{
        validate = "node modules/system/validate.js"
        describe = "node modules/system/describe.js"
    }
    dependencies = @{
        yaml = "^2.3.0"
    }
}

$packageJson | ConvertTo-Json -Depth 3 | Out-File -FilePath "package.json" -Encoding utf8

# manifest.yaml
Write-Output 'system_name: "Explicit Agent Protocol with KG Memory"' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output 'version: "1.0.0"' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output 'modules:' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '  - name: memory_graph' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '    purpose: "จัดการความจำแบบกราฟ"' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '  - name: embedding_service' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '    purpose: "ฝัง embedding สำหรับ semantic search"' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '  - name: auto_tag_service' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '    purpose: "ติดแท็กความจำอัตโนมัติ"' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '  - name: memory0_service' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output '    purpose: "จัดการ root memory node"' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output 'entry_point: "index.js"' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append
Write-Output 'audit_ready: true' | Out-File -FilePath "manifest.yaml" -Encoding utf8 -Append

# structure.schema.yaml
Write-Output 'required_folders:' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - modules/memory_graph' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - modules/embedding_service' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - modules/auto_tag_service' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - modules/memory0_service' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - config' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - memory' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - docs' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - .github' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output 'required_files:' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - manifest.yaml' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - config/access_policy.yaml' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - memory/memory_store.json' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - memory/lineage_log.json' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - docs/audit_log.md' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - docs/legacy_clues.md' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append
Write-Output '  - docs/changelog.md' | Out-File -FilePath "structure.schema.yaml" -Encoding utf8 -Append

# access_policy.yaml
Write-Output 'read_only:' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append
Write-Output '  - docs/' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append
Write-Output '  - memory/lineage_log.json' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append
Write-Output '' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append
Write-Output 'forbidden:' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append
Write-Output '  - __pycache__/' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append
Write-Output '  - node_modules/' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append
Write-Output '  - .git/' | Out-File -FilePath "config/access_policy.yaml" -Encoding utf8 -Append

# memory files
"[]" | Out-File -FilePath "memory/memory_store.json" -Encoding utf8
"[]" | Out-File -FilePath "memory/lineage_log.json" -Encoding utf8

# docs placeholders
"# Audit Log" | Out-File -FilePath "docs/audit_log.md" -Encoding utf8
"# Legacy Clues" | Out-File -FilePath "docs/legacy_clues.md" -Encoding utf8
"# Changelog" | Out-File -FilePath "docs/changelog.md" -Encoding utf8

Write-Host "✅ โครงสร้างโปรเจ็กต์ถูกสร้างเรียบร้อยแล้ว"