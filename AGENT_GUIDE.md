# AI Agent Guide - Todo Management System

## Tổng quan

Hệ thống AI Agent được tích hợp với LangChain + llama3.1:8b + BGE-M3 Embedding + Qdrant Vector Database để cung cấp khả năng chat thông minh và semantic search cho quản lý todo.

## Kiến trúc

### Components chính:
- **LangChain Agent**: ConversationalTodoAgent với function calling
- **llama3.1:8b**: LLM model chạy trên Ollama
- **BGE-M3**: Embedding API cho semantic search
- **Qdrant**: Vector database lưu trữ embeddings
- **Redis**: Conversation memory và session management

## Tính năng Agent

### 1. Chat thông minh
Agent có thể trả lời các câu hỏi về:
- Lịch trình và todos
- Tìm kiếm thông tin
- Tạo và quản lý todos
- Kiểm tra thời gian rảnh

### 2. Function Calling
Agent sử dụng các tools:
- `get_schedule_tool`: Lấy lịch trình theo thời gian
- `search_todos_tool`: Tìm kiếm semantic
- `create_todo_tool`: Tạo todo với smart analysis
- `update_todo_tool`: Cập nhật todo
- `check_availability_tool`: Kiểm tra thời gian rảnh

### 3. Semantic Search
Tìm kiếm todos dựa trên ý nghĩa, không chỉ từ khóa:
- Sử dụng BGE-M3 embeddings
- Vector similarity search trong Qdrant
- Kết quả có độ tương tự (similarity score)

## API Endpoints

### Chat với Agent
```http
POST /api/v1/agent/chat
Content-Type: application/json

{
  "message": "Trong tuần này lịch của tui như nào?",
  "session_id": "user_123_session_1"
}
```

**Response:**
```json
{
  "response": "Tuần này bạn có 3 việc quan trọng:\n• Họp với khách hàng ABC (Thứ 2, 14:00)\n• Báo cáo tháng (Thứ 4, 17:00)\n• Chuẩn bị tài liệu (Thứ 6, 10:00)",
  "session_id": "user_123_session_1",
  "user_id": "user_123",
  "timestamp": "2025-01-18T10:30:00Z"
}
```

### Semantic Search
```http
GET /api/v1/agent/search?query=họp&limit=5
```

**Response:**
```json
{
  "results": [
    {
      "todo_id": "todo_123",
      "content": "Họp với khách hàng ABC",
      "similarity": 0.95,
      "metadata": {
        "title": "Họp với khách hàng ABC",
        "due_time": "2025-01-20T14:00:00",
        "is_important": true
      }
    }
  ],
  "query": "họp",
  "total": 1
}
```

### Tạo Embeddings
```http
POST /api/v1/agent/embed-all
Content-Type: application/json

{
  "user_id": "user_123",
  "limit": 100
}
```

### Quản lý Session
```http
# Xóa conversation history
DELETE /api/v1/agent/session/{session_id}

# Lấy summary
GET /api/v1/agent/session/{session_id}/summary

# Lấy active sessions
GET /api/v1/agent/sessions
```

## Ví dụ sử dụng

### 1. Hỏi về lịch trình
```
User: "Trong tuần này có gì không?"
Agent: "Tuần này bạn có 3 việc quan trọng:
• Họp với khách hàng ABC (Thứ 2, 14:00)
• Báo cáo tháng (Thứ 4, 17:00)  
• Chuẩn bị tài liệu (Thứ 6, 10:00)"
```

### 2. Tìm kiếm thông minh
```
User: "Có việc gì liên quan đến họp không?"
Agent: "Tìm thấy 2 việc liên quan đến họp:
• Họp với khách hàng ABC (Độ tương tự: 0.95)
• Chuẩn bị tài liệu họp (Độ tương tự: 0.87)"
```

### 3. Tạo todo thông minh
```
User: "Tạo việc họp với team ngày mai"
Agent: "Đã tạo todo 'Họp với team' cho ngày mai. Tôi đã tự động phân tích và gợi ý:
• Group: Công việc
• Priority: High
• Tags: meeting, urgent
• Deadline: 2025-01-19 17:00"
```

### 4. Kiểm tra thời gian rảnh
```
User: "Thứ 3 có rảnh không?"
Agent: "Thứ 3 bạn rảnh! Có thể sắp xếp việc vào 9h-12h hoặc 2h-5h chiều."
```

## Session Management

### Conversation Memory
- Mỗi session có conversation history riêng
- Lưu trong Redis với TTL 24 giờ
- Tự động gia hạn khi có hoạt động

### Session ID Format
```
{user_id}_session_{timestamp}
Ví dụ: user_123_session_1705123456
```

## Embedding System

### Tự động tạo embeddings
- Khi tạo todo mới → `create_todo_embedding_task`
- Khi cập nhật todo → `update_todo_embedding_task`  
- Khi xóa todo → `delete_todo_embedding_task`

### Background Tasks
```python
# Tạo embedding cho todo
create_todo_embedding_task.delay(todo_id)

# Cập nhật embedding
update_todo_embedding_task.delay(todo_id)

# Xóa embedding
delete_todo_embedding_task.delay(todo_id)

# Batch tạo embeddings
batch_create_embeddings_task.delay(user_id, limit=100)
```

## Health Check

### Kiểm tra hệ thống
```http
GET /api/v1/agent/health
```

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "vector_service": true,
    "memory_service": true,
    "embedding_api": true
  },
  "message": "Health check completed"
}
```

### Thống kê
```http
GET /api/v1/agent/stats
```

## Cấu hình

### Environment Variables
```bash
# Ollama
OLLAMA_HOST=http://222.253.80.30:11434
OLLAMA_MODEL=llama3.1:8b

# BGE-M3 Embedding
BGE3_API_URL=https://embed.andyanh.id.vn/embed

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION=todo_embeddings

# Redis
REDIS_URL=redis://redis:6379/0
```

## Troubleshooting

### Lỗi thường gặp

1. **Agent không phản hồi**
   - Kiểm tra Ollama service: `curl http://222.253.80.30:11434/api/tags`
   - Kiểm tra Qdrant: `curl http://localhost:6333/health`

2. **Semantic search không hoạt động**
   - Kiểm tra BGE3 API: `curl -X POST https://embed.andyanh.id.vn/embed`
   - Kiểm tra embeddings đã được tạo chưa

3. **Conversation memory bị mất**
   - Kiểm tra Redis connection
   - Kiểm tra session TTL

### Debug Commands
```bash
# Kiểm tra Ollama
curl http://222.253.80.30:11434/api/tags

# Kiểm tra Qdrant
curl http://localhost:6333/health

# Kiểm tra BGE3 API
curl -X POST https://embed.andyanh.id.vn/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test"], "max_length": 512}'

# Kiểm tra Redis
redis-cli ping
```

## Best Practices

### 1. Session Management
- Sử dụng session_id duy nhất cho mỗi conversation
- Xóa session cũ khi không cần thiết
- Không lưu thông tin nhạy cảm trong session

### 2. Query Optimization
- Sử dụng semantic search thay vì keyword search
- Giới hạn số kết quả trả về (limit)
- Cache kết quả tìm kiếm thường dùng

### 3. Error Handling
- Luôn có fallback khi AI không phản hồi
- Log errors để debug
- Retry mechanism cho API calls

## Roadmap

### Tính năng sắp tới
- [ ] Multi-language support
- [ ] Voice interface
- [ ] Advanced analytics
- [ ] Custom AI models
- [ ] Integration với calendar apps
