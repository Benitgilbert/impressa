# Phase 1 Integration Test Script (PowerShell)
# Tests all features implemented in Sprints 1.1, 1.2, and 1.3

$BASE_URL = "http://localhost:5000"
$passCount = 0
$failCount = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    Write-Host "`nTesting: $Name" -ForegroundColor Cyan
    try {
        & $TestBlock
        $script:passCount++
        Write-Host "✓ PASSED" -ForegroundColor Green
    }
    catch {
        $script:failCount++
        Write-Host "✗ FAILED: $_" -ForegroundColor Red
    }
}

Write-Host "`n================================================" -ForegroundColor Blue
Write-Host "   Phase 1 Integration Tests" -ForegroundColor Blue
Write-Host "================================================`n" -ForegroundColor Blue

# ==========================================
# Sprint 1.3: Health Check Tests
# ==========================================
Write-Host "`n=== Sprint 1.3: Health Checks ===" -ForegroundColor Yellow

Test-Endpoint "Health check endpoint returns 200" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/health" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Expected 200, got $($response.StatusCode)" }
    $body = $response.Content | ConvertFrom-Json
    if ($body.status -ne "healthy") { throw "Status not healthy" }
}

Test-Endpoint "Readiness check returns 200 when DB connected" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/ready" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Expected 200, got $($response.StatusCode)" }
    $body = $response.Content | ConvertFrom-Json
    if ($body.checks.database -ne "ok") { throw "Database not ready" }
}

Test-Endpoint "Liveness check returns process info" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/live" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Expected 200, got $($response.StatusCode)" }
    $body = $response.Content | ConvertFrom-Json
    if (-not $body.pid) { throw "No process ID returned" }
}

# ==========================================
# Sprint 1.1: Error Handling Tests
# ==========================================
Write-Host "`n=== Sprint 1.1: Error Handling ===" -ForegroundColor Yellow

Test-Endpoint "404 error returns consistent JSON format" {
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/nonexistent" -UseBasicParsing -ErrorAction Stop
    }
    catch {
        $response = $_.Exception.Response
        if ($response.StatusCode -ne 404) { throw "Expected 404" }
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd() | ConvertFrom-Json
        if (-not $body.error) { throw "No error object" }
        if ($body.success -ne $false) { throw "Success should be false" }
    }
}

Test-Endpoint "API root endpoint returns info" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Expected 200" }
    $body = $response.Content | ConvertFrom-Json
    if (-not $body.version) { throw "No version info" }
}

# ==========================================
# Sprint 1.2: Category Tests
# ==========================================
Write-Host "`n=== Sprint 1.2: Categories ===" -ForegroundColor Yellow

Test-Endpoint "Get category list" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/categories" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Expected 200" }
    $body = $response.Content | ConvertFrom-Json
    if ($body.data -isnot [Array]) { throw "Data should be array" }
    Write-Host "   Found $($body.count) categories" -ForegroundColor Gray
}

Test-Endpoint "Get category tree" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/categories/tree" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Expected 200" }
    $body = $response.Content | ConvertFrom-Json
    if ($body.data -isnot [Array]) { throw "Data should be array" }
}

# ==========================================
# Sprint 1.2: Product Tests
# ==========================================
Write-Host "`n=== Sprint 1.2: Products ===" -ForegroundColor Yellow

Test-Endpoint "Get products list" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/products" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Expected 200" }
    $body = $response.Content | ConvertFrom-Json
    Write-Host "   Found $($body.data.Count) products" -ForegroundColor Gray
}

# ==========================================
# Sprint 1.1: Validation Tests
# ==========================================
Write-Host "`n=== Sprint 1.1: Input Validation ===" -ForegroundColor Yellow

Test-Endpoint "Register with invalid email fails" {
    $postData = @{
        name = "Test User"
        email = "invalid-email"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/auth/register" `
            -Method POST `
            -Body $postData `
            -ContentType "application/json" `
            -UseBasicParsing `
            -ErrorAction Stop
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 400) { throw "Expected 400 validation error, got $statusCode" }
    }
}

Test-Endpoint "Register with weak password fails" {
    $postData = @{
        name = "Test User"
        email = "test@example.com"
        password = "weak"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/auth/register" `
            -Method POST `
            -Body $postData `
            -ContentType "application/json" `
            -UseBasicParsing `
            -ErrorAction Stop
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 400) { throw "Expected 400 validation error, got $statusCode" }
    }
}

# ==========================================
# Security Headers Tests
# ==========================================
Write-Host "`n=== Sprint 1.1: Security Headers ===" -ForegroundColor Yellow

Test-Endpoint "Security headers are present" {
    $response = Invoke-WebRequest -Uri "$BASE_URL/health" -UseBasicParsing
    $headers = $response.Headers
    
    if (-not $headers["X-Content-Type-Options"]) { throw "Missing X-Content-Type-Options header" }
    if (-not $headers["X-Frame-Options"]) { throw "Missing X-Frame-Options header" }
    Write-Host "   ✓ Helmet security headers present" -ForegroundColor Gray
}

# ==========================================
# Summary
# ==========================================
Write-Host "`n================================================" -ForegroundColor Blue
Write-Host "   Test Results" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host "`nPassed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Total:  $($passCount + $failCount)`n"

if ($failCount -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Review the output above." -ForegroundColor Yellow
}

Write-Host "`nNote: Server must be running on port 5000" -ForegroundColor Cyan
Write-Host ""
