# 🚀 Agent TODO API Documentation

## 📋 **Base URL**
```
http://localhost:8000
```

## 🔐 **Authentication**
Tất cả API endpoints (trừ auth) đều yêu cầu Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔑 **Authentication APIs**

### **1. Register User**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### **2. Login User**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## 📝 **Todo APIs**

### **1. List Todos**
```http
GET /api/v1/todos/
Authorization: Bearer <token>

# Query Parameters:
# - is_completed: boolean (optional)
# - is_important: boolean (optional)
# - q: string (search query, optional)
# - group_id: string (optional)
# - limit: int (default: 50, max: 200)
# - offset: int (default: 0)
```

### **2. Create Todo**
```http
POST /api/v1/todos/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the project by Friday",
  "due_time": "2025-10-25T17:00:00Z",
  "group_id": "uuid-here",
  "is_important": true
}
```

### **3. Get Todo**
```http
GET /api/v1/todos/{todo_id}
Authorization: Bearer <token>
```

### **4. Update Todo**
```http
PUT /api/v1/todos/{todo_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "due_time": "2025-10-26T17:00:00Z",
  "is_important": false
}
```

### **5. Complete Todo**
```http
PATCH /api/v1/todos/{todo_id}/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_completed": true
}
```

### **6. Delete Todo**
```http
DELETE /api/v1/todos/{todo_id}
Authorization: Bearer <token>
```

---

## 📧 **Notification APIs**

### **1. List Notifications**
```http
GET /api/v1/notifications
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "todo_id": "uuid",
    "user_id": "uuid",
    "notify_at": "2025-10-18T10:00:00Z",
    "status": "pending",
    "notification_type": "email",
    "subject": "Todo Reminder",
    "content": "Don't forget to complete your todo",
    "retry_count": 0,
    "error_message": null,
    "sent_at": null,
    "viewed_at": null,
    "created_at": "2025-10-18T09:00:00Z",
    "updated_at": "2025-10-18T09:00:00Z"
  }
]
```

### **2. Create Notification**
```http
POST /api/v1/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "todo_id": "uuid",
  "notify_at": "2025-10-18T10:00:00Z",
  "notification_type": "email",
  "subject": "Todo Reminder",
  "content": "Don't forget to complete your todo"
}
```

### **3. Mark Notification as Viewed**
```http
PATCH /api/v1/notifications/{notification_id}/view
Authorization: Bearer <token>
```

### **4. Delete Notification**
```http
DELETE /api/v1/notifications/{notification_id}
Authorization: Bearer <token>
```

---

## ⚙️ **User Preferences APIs**

### **1. Get User Preferences**
```http
GET /api/v1/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "uuid",
  "default_group_id": "uuid",
  "work_hours": {
    "start": "08:00",
    "end": "17:00"
  },
  "notification_preferences": {
    "email_enabled": true,
    "push_enabled": true
  },
  "language": "vi",
  "timezone": "Asia/Ho_Chi_Minh",
  "created_at": "2025-10-18T09:00:00Z",
  "updated_at": "2025-10-18T09:00:00Z"
}
```

### **2. Update User Preferences**
```http
PUT /api/v1/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "default_group_id": "uuid",
  "work_hours": {
    "start": "09:00",
    "end": "18:00"
  },
  "notification_preferences": {
    "email_enabled": true,
    "push_enabled": false
  },
  "language": "en",
  "timezone": "UTC"
}
```

### **3. Create User Preferences**
```http
POST /api/v1/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "default_group_id": "uuid",
  "work_hours": {
    "start": "08:00",
    "end": "17:00"
  },
  "notification_preferences": {
    "email_enabled": true,
    "push_enabled": true
  },
  "language": "vi",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

---

## 🤖 **Automation Rules APIs**

### **1. List Automation Rules**
```http
GET /api/v1/automation-rules
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Auto-important for urgent todos",
    "trigger": "on_todo_created",
    "conditions": {
      "if_content_contains": ["urgent", "asap"]
    },
    "action": {
      "set_priority": "high"
    },
    "is_active": true,
    "priority": 5,
    "created_at": "2025-10-18T09:00:00Z",
    "updated_at": "2025-10-18T09:00:00Z"
  }
]
```

### **2. Create Automation Rule**
```http
POST /api/v1/automation-rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Auto-important for urgent todos",
  "trigger": "on_todo_created",
  "conditions": {
    "if_content_contains": ["urgent", "asap", "important"]
  },
  "action": {
    "set_priority": "high"
  },
  "is_active": true,
  "priority": 5
}
```

### **3. Get Automation Rule**
```http
GET /api/v1/automation-rules/{rule_id}
Authorization: Bearer <token>
```

### **4. Update Automation Rule**
```http
PUT /api/v1/automation-rules/{rule_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated rule name",
  "conditions": {
    "if_content_contains": ["urgent", "critical"]
  },
  "action": {
    "set_priority": "high",
    "add_tag": "urgent"
  },
  "is_active": false
}
```

### **5. Toggle Automation Rule**
```http
PATCH /api/v1/automation-rules/{rule_id}/toggle
Authorization: Bearer <token>
```

### **6. Delete Automation Rule**
```http
DELETE /api/v1/automation-rules/{rule_id}
Authorization: Bearer <token>
```

---

## 📁 **Group APIs**

### **1. List Groups**
```http
GET /api/v1/groups
Authorization: Bearer <token>
```

### **2. Create Group**
```http
POST /api/v1/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Work Tasks"
}
```

### **3. Update Group**
```http
PUT /api/v1/groups/{group_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Group Name"
}
```

### **4. Delete Group**
```http
DELETE /api/v1/groups/{group_id}
Authorization: Bearer <token>
```

---

## 🏷️ **Tag APIs**

### **1. List Tags**
```http
GET /api/v1/tags
Authorization: Bearer <token>
```

### **2. Create Tag**
```http
POST /api/v1/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "urgent"
}
```

### **3. Update Tag**
```http
PUT /api/v1/tags/{tag_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "critical"
}
```

### **4. Delete Tag**
```http
DELETE /api/v1/tags/{tag_id}
Authorization: Bearer <token>
```

---

## 🔧 **System APIs**

### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## 📊 **Response Status Codes**

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **422** - Validation Error
- **500** - Internal Server Error

---

## 🎯 **Common Use Cases**

### **1. Complete User Registration Flow**
```bash
# 1. Register user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "full_name": "John Doe"}'

# 2. Login to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# 3. Set user preferences
curl -X POST http://localhost:8000/api/v1/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"work_hours": {"start": "09:00", "end": "18:00"}, "language": "vi"}'
```

### **2. Create Todo with Automation**
```bash
# 1. Create automation rule
curl -X POST http://localhost:8000/api/v1/automation-rules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto-important for urgent",
    "trigger": "on_todo_created",
    "conditions": {"if_content_contains": ["urgent"]},
    "action": {"set_priority": "high"}
  }'

# 2. Create todo (will trigger automation)
curl -X POST http://localhost:8000/api/v1/todos/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Urgent todo to complete", "description": "This is urgent work"}'
```

### **3. Setup Email Notifications**
```bash
# 1. Create notification
curl -X POST http://localhost:8000/api/v1/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "todo_id": "todo-uuid",
    "notify_at": "2025-10-18T10:00:00Z",
    "subject": "Todo Reminder",
    "content": "Don'\''t forget your todo!"
  }'
```

---

## 🚀 **Interactive API Documentation**

Truy cập Swagger UI tại: **http://localhost:8000/docs**

Tại đây bạn có thể:
- Xem tất cả endpoints
- Test API trực tiếp
- Xem request/response schemas
- Download OpenAPI spec
