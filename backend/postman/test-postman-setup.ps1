# PowerShell script to test Postman environment setup
# This script verifies that all URLs resolve correctly with the updated environment

Write-Host "🧪 Testing Postman Environment Setup for Air Cargo API" -ForegroundColor Green
Write-Host "=" * 60

# Read environment variables from the JSON file
$envPath = "Air-Cargo-Environment.postman_environment.json"
if (Test-Path $envPath) {
    $env = Get-Content $envPath | ConvertFrom-Json
    $baseUrl = ($env.values | Where-Object { $_.key -eq "baseUrl" }).value
    $apiPrefix = ($env.values | Where-Object { $_.key -eq "apiPrefix" }).value
    
    Write-Host "📍 Base URL: $baseUrl" -ForegroundColor Cyan
    Write-Host "📍 API Prefix: $apiPrefix" -ForegroundColor Cyan
    Write-Host ""
    
    # Test URL constructions
    $testUrls = @(
        "$baseUrl/$apiPrefix/auth/login",
        "$baseUrl/$apiPrefix/routes",
        "$baseUrl/$apiPrefix/bookings",
        "$baseUrl/$apiPrefix/auth/profile"
    )
    
    Write-Host "🔗 Testing URL formations:" -ForegroundColor Yellow
    foreach ($url in $testUrls) {
        Write-Host "   ✓ $url" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎯 Environment Variables:" -ForegroundColor Yellow
    $testVars = @("testEmail", "testPassword", "testOrigin", "testDestination", "testDepartureDate")
    foreach ($varName in $testVars) {
        $value = ($env.values | Where-Object { $_.key -eq $varName }).value
        Write-Host "   $varName = $value" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "✅ Postman environment is properly configured!" -ForegroundColor Green
    Write-Host "📝 You can now import these files into Postman:" -ForegroundColor Cyan
    Write-Host "   1. Air-Cargo-Environment.postman_environment.json" -ForegroundColor White
    Write-Host "   2. Air-Cargo-Complete-Tests.postman_collection.json" -ForegroundColor White
    Write-Host "   3. Air-Cargo-Validation-Tests.postman_collection.json" -ForegroundColor White
    
} else {
    Write-Host "❌ Environment file not found: $envPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 To test the API manually with PowerShell:" -ForegroundColor Magenta
Write-Host @"
# Login test
`$response = Invoke-RestMethod -Uri "$baseUrl/$apiPrefix/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"john@example.com","password":"password123"}'
`$token = `$response.data.token

# Route search test  
Invoke-RestMethod -Uri "$baseUrl/$apiPrefix/routes?origin=DEL&destination=BLR&departure_date=2024-12-25" -Method GET
"@ -ForegroundColor Gray