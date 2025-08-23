$baseUrl = "http://localhost:3000"

Write-Host "Testing Air Cargo API..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Health Check: " -ForegroundColor Green -NoNewline
    Write-Host "$($health.status) - $($health.environment)" -ForegroundColor White
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: API Documentation
Write-Host "`n2. Testing API Documentation..." -ForegroundColor Yellow
try {
    $docs = Invoke-RestMethod -Uri "$baseUrl/api/v1/docs" -Method GET
    Write-Host "✓ API Docs: " -ForegroundColor Green -NoNewline
    Write-Host "$($docs.name)" -ForegroundColor White
} catch {
    Write-Host "✗ API Docs Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Login
Write-Host "`n3. Testing User Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "john@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✓ Login successful for user: " -ForegroundColor Green -NoNewline
    Write-Host "$($loginResponse.data.user.username)" -ForegroundColor White
    
    # Test 4: Route Search
    Write-Host "`n4. Testing Route Search..." -ForegroundColor Yellow
    $today = Get-Date -Format "yyyy-MM-dd"
    $routeUrl = "$baseUrl/api/v1/routes?origin=DEL`&destination=BLR`&departure_date=$today"
    $routes = Invoke-RestMethod -Uri $routeUrl -Method GET
    Write-Host "✓ Route Search: Found " -ForegroundColor Green -NoNewline
    Write-Host "$($routes.data.total_options) routes from DEL to BLR" -ForegroundColor White
    
    # Test 5: Booking Creation (with auth)
    Write-Host "`n5. Testing Booking Creation..." -ForegroundColor Yellow
    if ($routes.data.results.direct_flights.count -gt 0) {
        $flightId = $routes.data.results.direct_flights.flights[0].id
        $bookingBody = @{
            origin = "DEL"
            destination = "BLR"
            pieces = 5
            weight_kg = 100
            flight_ids = @($flightId)
        } | ConvertTo-Json
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $booking = Invoke-RestMethod -Uri "$baseUrl/api/v1/bookings" -Method POST -Body $bookingBody -Headers $headers
        $refId = $booking.data.booking.ref_id
        Write-Host "✓ Booking created: " -ForegroundColor Green -NoNewline
        Write-Host "$refId" -ForegroundColor White
        
        # Test 6: Booking History
        Write-Host "`n6. Testing Booking History..." -ForegroundColor Yellow
        $history = Invoke-RestMethod -Uri "$baseUrl/api/v1/bookings/$refId/history" -Method GET
        Write-Host "✓ Booking History: " -ForegroundColor Green -NoNewline
        Write-Host "Status = $($history.data.booking.status), Timeline events = $($history.data.timeline.count)" -ForegroundColor White
    } else {
        Write-Host "✗ No direct flights found for booking test" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ API Testing Complete!" -ForegroundColor Green