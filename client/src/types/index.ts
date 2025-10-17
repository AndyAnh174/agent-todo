// Auth types
export interface User {
  id: string;
  full_name?: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Todo types
export interface Todo {
  id: string;
  title: string;
  description?: string;
  due_time?: string;
  is_completed: boolean;
  is_important: boolean;
  user_id?: string;
  group_id?: string;
  order_index: number;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  subtasks?: Subtask[];
  comments?: TaskComment[];
  assignments?: TaskAssignment[];
}

export interface TodoCreateRequest {
  title: string;
  description?: string;
  due_time?: string;
  group_id?: string;
  tag_ids?: string[];
  is_important?: boolean;
  order_index?: number;
  recurrence_pattern?: string;
  recurrence_interval?: number;
}

export interface TodoUpdateRequest {
  title?: string;
  description?: string;
  due_time?: string;
  group_id?: string;
  is_important?: boolean;
  is_completed?: boolean;
  order_index?: number;
  recurrence_pattern?: string;
  recurrence_interval?: number;
}

// Group types
export interface Group {
  id: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupCreateRequest {
  name: string;
}

export interface GroupUpdateRequest {
  name?: string;
}

// Tag types
export interface Tag {
  id: string;
  name?: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TagCreateRequest {
  name: string;
  color?: string;
  description?: string;
}

export interface TagUpdateRequest {
  name?: string;
  color?: string;
  description?: string;
}

// Subtask types
export interface Subtask {
  id: string;
  todo_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SubtaskCreateRequest {
  title: string;
  order_index?: number;
}

export interface SubtaskUpdateRequest {
  title?: string;
  is_completed?: boolean;
  order_index?: number;
}

// Comment types
export interface TaskComment {
  id: string;
  todo_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCommentCreateRequest {
  content: string;
}

export interface TaskCommentUpdateRequest {
  content?: string;
}

// Assignment types
export interface TaskAssignment {
  id: string;
  todo_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
}

export interface TaskAssignmentCreateRequest {
  user_id: string;
}

// Reorder types
export interface TodoReorderRequest {
  todo_ids: string[];
}

export interface TodoMoveRequest {
  todo_id: string;
  target_group_id?: string;
  new_order_index?: number;
}

// Filter types
export interface TodoFilters {
  is_completed?: boolean;
  is_important?: boolean;
  q?: string;
  group_id?: string;
  tag_id?: string;
  limit?: number;
  offset?: number;
}