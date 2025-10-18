# 🔧 Troubleshooting Guide

## Lỗi CORS và Server Connection

### Vấn đề
- `Access to fetch at 'http://localhost:8000/api/v1/todos/smart/insights' from origin 'http://localhost:3000' has been blocked by CORS policy`
- `Failed to load resource: net::ERR_FAILED`
- `HTTP 422 (Unprocessable Entity)`

### Giải pháp

#### 1. Kiểm tra Server có đang chạy không

```bash
# Kiểm tra server health
curl http://localhost:8000/health

# Hoặc mở browser và truy cập
http://localhost:8000/health
```

#### 2. Start Server đúng cách

```bash
# Cách 1: Sử dụng script Python
python start_server.py

# Cách 2: Sử dụng PowerShell script (Windows)
.\start_all.ps1

# Cách 3: Manual start
cd server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Kiểm tra Port và URL

- **Server**: http://localhost:8000
- **Client**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

#### 4. Kiểm tra Environment Variables

File `client/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### 5. Kiểm tra Dependencies

```bash
# Server dependencies
pip install -r requirements.txt

# Client dependencies
cd client
npm install
```

### Các lỗi thường gặp

#### Lỗi 422 - Unprocessable Entity
- **Nguyên nhân**: Request body không đúng format
- **Giải pháp**: Đã fix trong code - endpoint `/smart/analyze` sử dụng query parameters thay vì JSON body

#### Lỗi CORS
- **Nguyên nhân**: Server không cho phép request từ frontend
- **Giải pháp**: CORS đã được cấu hình đúng trong `server/app/main.py`

#### Server không khả dụng
- **Nguyên nhân**: Server chưa start hoặc crash
- **Giải pháp**: 
  1. Kiểm tra server có đang chạy: `http://localhost:8000/health`
  2. Restart server: `python start_server.py`
  3. Kiểm tra logs để tìm lỗi

### Debug Tools

#### 1. Server Status Component
- Component `ServerStatus` sẽ hiển thị trạng thái server real-time
- Tự động kiểm tra mỗi 30 giây
- Hiển thị lỗi chi tiết nếu có

#### 2. Browser DevTools
- Mở F12 → Network tab
- Kiểm tra các request bị fail
- Xem response status và error message

#### 3. Server Logs
- Server logs sẽ hiển thị trong terminal
- Kiểm tra lỗi database, authentication, etc.

### Quick Fixes

#### Nếu vẫn gặp lỗi CORS:
```python
# Trong server/app/main.py, đảm bảo có:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Nếu server không start:
```bash
# Kiểm tra Python version
python --version  # Cần Python 3.8+

# Kiểm tra dependencies
pip list | grep fastapi
pip list | grep uvicorn

# Install missing dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary
```

#### Nếu client không connect được:
```bash
# Kiểm tra Node.js version
node --version  # Cần Node.js 18+

# Clear cache và reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Liên hệ Support

Nếu vẫn gặp vấn đề, hãy:
1. Kiểm tra logs trong terminal
2. Chụp screenshot lỗi
3. Cung cấp thông tin về OS, Python version, Node.js version
