# Test script for agent chat
$loginData = @{
    email = "agent@test.com"
    password = "agent123"
} | ConvertTo-Json

Write-Host "Logging in..."
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $loginResponse.access_token
Write-Host "Login successful, token length: $($token.Length)"

# Test agent chat
$chatData = @{
    message = "Xin chào, bạn có thể giúp tôi tạo một todo mới không?"
    session_id = "test-session-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
} | ConvertTo-Json

Write-Host "Testing agent chat..."
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/agent/chat" -Method POST -Body $chatData -Headers $headers
    Write-Host "Agent response:"
    $chatResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
