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
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface TodoCreateRequest {
  title: string;
  description?: string;
  due_time?: string;
  group_id?: string;
  tag_ids?: string[];
  is_important?: boolean;
}

export interface TodoUpdateRequest {
  title?: string;
  description?: string;
  due_time?: string;
  group_id?: string;
  is_important?: boolean;
  is_completed?: boolean;
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
  created_at: string;
  updated_at: string;
}

export interface TagCreateRequest {
  name: string;
}

export interface TagUpdateRequest {
  name?: string;
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
