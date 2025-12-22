# PowerShell test script for MCP Blink Memory JSON-RPC API
$baseUrl = "http://localhost:7071"

Write-Host "🔍 Testing JSON-RPC Health Check" -ForegroundColor Cyan

$healthPayload = @{
    jsonrpc = "2.0"
    method = "healthCheck"
    params = @{}
    id = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $healthPayload -ContentType "application/json"
    Write-Host "✅ Health Check Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📝 Testing Create Entities" -ForegroundColor Cyan

$entityPayload = @{
    jsonrpc = "2.0"
    method = "createEntities"
    params = @{
        entities = @(
            @{
                name = "AI Research Lab"
                type = "organization"
                observations = @("Laboratory focused on AI research", "Located in Bangkok")
            }
        )
        options = @{
            autoTag = $true
            linkToMemory0 = $true
        }
    }
    id = 2
} | ConvertTo-Json -Depth 4

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $entityPayload -ContentType "application/json"
    Write-Host "✅ Create Entities Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Create Entities Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Testing Graph Stats" -ForegroundColor Cyan

$statsPayload = @{
    jsonrpc = "2.0"
    method = "getGraphStats"
    params = @{}
    id = 3
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $statsPayload -ContentType "application/json"
    Write-Host "✅ Graph Stats Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Graph Stats Failed: $($_.Exception.Message)" -ForegroundColor Red
}