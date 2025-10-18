# PowerShell script để chạy FastAPI server locally
Write-Host "🚀 Agent Todo - Local Development Server" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

# Kiểm tra Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python không được tìm thấy!" -ForegroundColor Red
    exit 1
}

# Kiểm tra pip
try {
    $pipVersion = pip --version 2>&1
    Write-Host "✅ Pip: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Pip không được tìm thấy!" -ForegroundColor Red
    exit 1
}

# Kiểm tra services
Write-Host "`n🔍 Kiểm tra services..." -ForegroundColor Yellow

# Kiểm tra PostgreSQL
try {
    $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
    if ($pgTest) {
        Write-Host "✅ PostgreSQL (port 5432)" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL không chạy trên port 5432" -ForegroundColor Red
        Write-Host "Chạy: docker-compose -f docker-compose.minimal.yml up -d db" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Không thể kiểm tra PostgreSQL" -ForegroundColor Red
}

# Kiểm tra Redis
try {
    $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet
    if ($redisTest) {
        Write-Host "✅ Redis (port 6379)" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis không chạy trên port 6379" -ForegroundColor Red
        Write-Host "Chạy: docker-compose -f docker-compose.minimal.yml up -d redis" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Không thể kiểm tra Redis" -ForegroundColor Red
}

# Kiểm tra Qdrant
try {
    $qdrantTest = Test-NetConnection -ComputerName localhost -Port 6333 -InformationLevel Quiet
    if ($qdrantTest) {
        Write-Host "✅ Qdrant (port 6333)" -ForegroundColor Green
    } else {
        Write-Host "❌ Qdrant không chạy trên port 6333" -ForegroundColor Red
        Write-Host "Chạy: docker-compose -f docker-compose.minimal.yml up -d qdrant" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Không thể kiểm tra Qdrant" -ForegroundColor Red
}

Write-Host "`n🚀 Khởi động server..." -ForegroundColor Yellow
Write-Host "Nếu có lỗi, hãy chạy:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.minimal.yml up -d" -ForegroundColor Cyan
Write-Host "  pip install -r requirements.txt" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor White

# Chạy Python script
python run_local.py
