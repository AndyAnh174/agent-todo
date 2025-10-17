import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth';
import type { 
  Todo, 
  TodoCreateRequest, 
  TodoUpdateRequest, 
  TodoFilters, 
  Group, 
  GroupCreateRequest, 
  GroupUpdateRequest, 
  Tag, 
  TagCreateRequest, 
  TagUpdateRequest,
  Subtask,
  SubtaskCreateRequest,
  SubtaskUpdateRequest,
  TaskComment,
  TaskCommentCreateRequest,
  TaskCommentUpdateRequest,
  TaskAssignment,
  TaskAssignmentCreateRequest,
  TodoReorderRequest,
  TodoMoveRequest
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
    return response.data;
  }

  // Todo endpoints
  async getTodos(filters?: TodoFilters): Promise<Todo[]> {
    const response: AxiosResponse<Todo[]> = await this.api.get('/todos', { 
      params: filters,
      paramsSerializer: {
        indexes: null
      }
    });
    return response.data;
  }

  async getTodo(id: string): Promise<Todo> {
    const response: AxiosResponse<Todo> = await this.api.get(`/todos/${id}`);
    return response.data;
  }

  async createTodo(data: TodoCreateRequest): Promise<Todo> {
    const response: AxiosResponse<Todo> = await this.api.post('/todos', data);
    return response.data;
  }

  async updateTodo(id: string, data: TodoUpdateRequest): Promise<Todo> {
    const response: AxiosResponse<Todo> = await this.api.put(`/todos/${id}`, data);
    return response.data;
  }

  async deleteTodo(id: string): Promise<void> {
    await this.api.delete(`/todos/${id}`);
  }

  async toggleTodoComplete(id: string, is_completed: boolean): Promise<Todo> {
    const response: AxiosResponse<Todo> = await this.api.patch(`/todos/${id}/complete`, { is_completed });
    return response.data;
  }

  // Group endpoints
  async getGroups(): Promise<Group[]> {
    const response: AxiosResponse<Group[]> = await this.api.get('/groups');
    return response.data;
  }

  async createGroup(data: GroupCreateRequest): Promise<Group> {
    const response: AxiosResponse<Group> = await this.api.post('/groups', data);
    return response.data;
  }

  async updateGroup(id: string, data: GroupUpdateRequest): Promise<Group> {
    const response: AxiosResponse<Group> = await this.api.put(`/groups/${id}`, data);
    return response.data;
  }

  async deleteGroup(id: string): Promise<void> {
    await this.api.delete(`/groups/${id}`);
  }

  // Tag endpoints
  async getTags(): Promise<Tag[]> {
    const response: AxiosResponse<Tag[]> = await this.api.get('/tags');
    return response.data;
  }

  async createTag(data: TagCreateRequest): Promise<Tag> {
    const response: AxiosResponse<Tag> = await this.api.post('/tags', data);
    return response.data;
  }

  async updateTag(id: string, data: TagUpdateRequest): Promise<Tag> {
    const response: AxiosResponse<Tag> = await this.api.put(`/tags/${id}`, data);
    return response.data;
  }

  async deleteTag(id: string): Promise<void> {
    await this.api.delete(`/tags/${id}`);
  }

  // Subtask endpoints
  async createSubtask(todoId: string, data: SubtaskCreateRequest): Promise<Subtask> {
    const response = await this.api.post<Subtask>(`/todos/${todoId}/subtasks`, data);
    return response.data;
  }

  async getSubtasks(todoId: string): Promise<Subtask[]> {
    const response = await this.api.get<Subtask[]>(`/todos/${todoId}/subtasks`);
    return response.data;
  }

  async updateSubtask(todoId: string, subtaskId: string, data: SubtaskUpdateRequest): Promise<Subtask> {
    const response = await this.api.put<Subtask>(`/todos/${todoId}/subtasks/${subtaskId}`, data);
    return response.data;
  }

  async deleteSubtask(todoId: string, subtaskId: string): Promise<void> {
    await this.api.delete(`/todos/${todoId}/subtasks/${subtaskId}`);
  }

  // Comment endpoints
  async createComment(todoId: string, data: TaskCommentCreateRequest): Promise<TaskComment> {
    const response = await this.api.post<TaskComment>(`/todos/${todoId}/comments`, data);
    return response.data;
  }

  async getComments(todoId: string): Promise<TaskComment[]> {
    const response = await this.api.get<TaskComment[]>(`/todos/${todoId}/comments`);
    return response.data;
  }

  // Assignment endpoints
  async assignTodo(todoId: string, data: TaskAssignmentCreateRequest): Promise<TaskAssignment> {
    const response = await this.api.post<TaskAssignment>(`/todos/${todoId}/assign`, data);
    return response.data;
  }

  async getAssignedTodos(): Promise<Todo[]> {
    const response = await this.api.get<Todo[]>('/todos/assigned-to-me');
    return response.data;
  }

  // Reorder endpoints
  async reorderTodos(data: TodoReorderRequest): Promise<void> {
    await this.api.post('/todos/reorder', data);
  }

  async moveTodo(data: TodoMoveRequest): Promise<Todo> {
    const response = await this.api.post<Todo>('/todos/move', data);
    return response.data;
  }
}

export const apiService = new ApiService();
