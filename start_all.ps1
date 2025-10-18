# PowerShell script to start both client and server
Write-Host "🚀 Starting Agent TODO Application..." -ForegroundColor Green

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
python -m pip install -r requirements.txt

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
cd client
npm install
cd ..

Write-Host "`n🌐 Starting services..." -ForegroundColor Yellow

# Start server in background
Write-Host "Starting FastAPI server on http://localhost:8000..." -ForegroundColor Cyan
Start-Process -FilePath "python" -ArgumentList "start_server.py" -WindowStyle Normal

# Wait a bit for server to start
Start-Sleep -Seconds 3

# Start client
Write-Host "Starting Next.js client on http://localhost:3000..." -ForegroundColor Cyan
cd client
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal

Write-Host "`n✅ Services started!" -ForegroundColor Green
Write-Host "🌐 Client: http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Server: http://localhost:8000" -ForegroundColor White
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`n🛑 Stopping services..." -ForegroundColor Yellow
    # Kill processes (this is a simple approach)
    Get-Process | Where-Object {$_.ProcessName -eq "python" -or $_.ProcessName -eq "node"} | Stop-Process -Force
    Write-Host "✅ Services stopped" -ForegroundColor Green
}
