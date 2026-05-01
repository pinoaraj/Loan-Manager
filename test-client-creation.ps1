# PowerShell script to test client creation
$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Starting Client Creation API Test`n" -ForegroundColor Cyan

# Step 1: Login
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    username = "PInoaraj"
    password = "1977"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $loginBody
    
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green
}
catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails)" -ForegroundColor Red
    exit 1
}

# Step 2: Create client with all fields
Write-Host "`nStep 2: Creating client with all fields..." -ForegroundColor Yellow
$clientData = @{
    name    = "Test Cliente Fix"
    email   = "test@example.com"
    phone   = "1234567890"
    address = "Direccion de Prueba"
} | ConvertTo-Json

Write-Host "Request body: $clientData" -ForegroundColor Gray

try {
    $clientResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/clients" `
        -Method Post `
        -Headers @{
        "Content-Type"  = "application/json"
        "Authorization" = "Bearer $token"
    } `
        -Body $clientData
    
    Write-Host "✅ Client created successfully:" -ForegroundColor Green
    Write-Host "Response: $($clientResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Client creation failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    # Try to get more info from the response
    $response = $_.Exception.Response
    if ($response) {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Magenta
    }
}

Write-Host "`n" -ForegroundColor Green
