// Core Types
export interface User {
  id: string;
  full_name?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  due_time?: string;
  is_completed: boolean;
  is_important: boolean;
  order_index?: number;
  user_id?: string;
  group_id?: string;
  tags?: Tag[];
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// Agent & NLP Types
export interface AgentChatRequest {
  message: string;
  session_id: string;
}

export interface AgentChatResponse {
  response: string;
  session_id: string;
  user_id: string;
  timestamp: string;
}

export interface AgentSearchResponse {
  query: string;
  total: number;
  results: Array<{
    id: string;
    title: string;
    description?: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

export interface AgentHealthResponse {
  status: 'healthy' | 'unhealthy';
  components: {
    vector_service: boolean;
    memory_service: boolean;
    embedding_api: boolean;
  };
  message: string;
}

export interface AgentSession {
  session_id: string;
  user_id: string;
}

export interface AgentSessionSummary {
  session_id: string;
  user_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  message: string;
}

// Smart Features Types
export interface SmartInsights {
  productivity_score: number;
  total_todos: number;
  completed_todos: number;
  important_todos: number;
  overdue_todos: number;
  completion_rate: number;
  recommendations: string[];
}

export interface SmartAnalysis {
  suggested_group?: string;
  suggested_tags: string[];
  suggested_priority: 'high' | 'medium' | 'low';
  suggested_deadline?: string;
  complexity_score: number;
  estimated_duration: number;
  confidence: number;
}

// Notification Types
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'viewed';
export type NotificationType = 'email' | 'push' | 'sms';

export interface Notification {
  id: string;
  todo_id?: string;
  user_id: string;
  notify_at: string;
  status: NotificationStatus;
  notification_type: NotificationType;
  subject: string;
  content: string;
  retry_count: number;
  error_message?: string;
  sent_at?: string;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationCreate {
  todo_id?: string;
  notify_at: string;
  notification_type?: NotificationType;
  subject: string;
  content: string;
}

export interface NotificationUpdate {
  status?: NotificationStatus;
  error_message?: string;
  sent_at?: string;
  viewed_at?: string;
}

// Automation Rules Types
export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  action: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationRuleCreate {
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  action: Record<string, any>;
  is_active?: boolean;
  priority?: number;
}

export interface AutomationRuleUpdate {
  name?: string;
  trigger?: string;
  conditions?: Record<string, any>;
  action?: Record<string, any>;
  is_active?: boolean;
  priority?: number;
}

// User Preferences Types
export interface UserPreference {
  user_id: string;
  default_group_id?: string;
  work_hours: {
    start: string;
    end: string;
  };
  notification_preferences: {
    email_enabled: boolean;
    push_enabled: boolean;
    [key: string]: any;
  };
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferenceUpdate {
  default_group_id?: string;
  work_hours?: {
    start: string;
    end: string;
  };
  notification_preferences?: {
    email_enabled?: boolean;
    push_enabled?: boolean;
    [key: string]: any;
  };
  language?: string;
  timezone?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Form Types
export interface TodoFormData {
  title: string;
  description?: string;
  due_time?: string;
  is_important?: boolean;
  group_id?: string;
  tag_ids?: string[];
}

export interface TagFormData {
  name: string;
}

export interface GroupFormData {
  name: string;
}

export interface AutomationRuleFormData {
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  action: Record<string, any>;
  is_active: boolean;
  priority: number;
}

// Filter Types
export interface TodoFilters {
  is_completed?: boolean;
  is_important?: boolean;
  group_id?: string;
  tag_id?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  query: string;
  limit?: number;
  group_id?: string;
  tag_id?: string;
  is_completed?: boolean;
  is_important?: boolean;
}
