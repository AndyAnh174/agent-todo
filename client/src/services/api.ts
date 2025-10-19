import { 
  Todo, 
  Tag, 
  Group, 
  Notification, 
  NotificationCreate, 
  NotificationUpdate,
  AutomationRule,
  AutomationRuleCreate,
  AutomationRuleUpdate,
  UserPreference,
  UserPreferenceUpdate,
  SmartInsights,
  SmartAnalysis,
  AgentChatRequest,
  AgentChatResponse,
  AgentSearchResponse,
  AgentHealthResponse,
  AgentSession,
  AgentSessionSummary,
  TodoFormData,
  TagFormData,
  GroupFormData,
  AutomationRuleFormData,
  TodoFilters,
  SearchFilters,
  ApiResponse
} from '@/types';
import { 
  AnalysisRequest, 
  AnalysisResponse, 
  ExportRequest, 
  ExportResponse, 
  AnalysisHistoryResponse 
} from '@/types/analysis';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth methods
  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Todo methods
  async getTodos(filters?: TodoFilters): Promise<Todo[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}/api/v1/todos${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      cache: 'no-store',
    });

    return this.handleResponse<Todo[]>(response);
  }

  async getTodo(id: string): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/api/v1/todos/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Todo>(response);
  }

  async createTodo(todo: TodoFormData): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/api/v1/todos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(todo),
    });

    return this.handleResponse<Todo>(response);
  }

  async updateTodo(id: string, todo: Partial<TodoFormData>): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/api/v1/todos/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(todo),
    });

    return this.handleResponse<Todo>(response);
  }

  async deleteTodo(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/todos/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.status}`);
    }
  }

  async toggleComplete(id: string, is_completed: boolean): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/api/v1/todos/${id}/complete`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ is_completed }),
    });

    return this.handleResponse<Todo>(response);
  }

  // Smart Features
  async getSmartInsights(): Promise<SmartInsights> {
    const response = await fetch(`${this.baseUrl}/api/v1/todos/smart/insights`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<SmartInsights>(response);
  }

  async analyzeTodoContent(title: string, description: string = ''): Promise<SmartAnalysis> {
    const params = new URLSearchParams();
    params.append('title', title);
    if (description) {
      params.append('description', description);
    }

    const response = await fetch(`${this.baseUrl}/api/v1/todos/smart/analyze?${params.toString()}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse<SmartAnalysis>(response);
  }

  // Agent & NLP
  async chatWithAgent(request: AgentChatRequest): Promise<AgentChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/agent/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse<AgentChatResponse>(response);
  }

  async semanticSearch(query: string, limit: number = 5): Promise<AgentSearchResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/agent/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AgentSearchResponse>(response);
  }

  async getAgentHealth(): Promise<AgentHealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/agent/health`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AgentHealthResponse>(response);
  }

  async getAgentSessions(): Promise<AgentSession[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/agent/sessions`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AgentSession[]>(response);
  }

  async getSessionSummary(sessionId: string): Promise<AgentSessionSummary> {
    const response = await fetch(`${this.baseUrl}/api/v1/agent/session/${sessionId}/summary`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AgentSessionSummary>(response);
  }

  async clearAgentSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/agent/session/${sessionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to clear session: ${response.status}`);
    }
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/tags/`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Tag[]>(response);
  }

  async createTag(tag: TagFormData): Promise<Tag> {
    const response = await fetch(`${this.baseUrl}/api/v1/tags/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(tag),
    });

    return this.handleResponse<Tag>(response);
  }

  async updateTag(id: string, tag: Partial<TagFormData>): Promise<Tag> {
    const response = await fetch(`${this.baseUrl}/api/v1/tags/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(tag),
    });

    return this.handleResponse<Tag>(response);
  }

  async deleteTag(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/tags/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete tag: ${response.status}`);
    }
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/groups/`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Group[]>(response);
  }

  async createGroup(group: GroupFormData): Promise<Group> {
    const response = await fetch(`${this.baseUrl}/api/v1/groups/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(group),
    });

    return this.handleResponse<Group>(response);
  }

  async updateGroup(id: string, group: Partial<GroupFormData>): Promise<Group> {
    const response = await fetch(`${this.baseUrl}/api/v1/groups/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(group),
    });

    return this.handleResponse<Group>(response);
  }

  async deleteGroup(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/groups/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete group: ${response.status}`);
    }
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/notifications`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Notification[]>(response);
  }

  async createNotification(notification: NotificationCreate): Promise<Notification> {
    const response = await fetch(`${this.baseUrl}/api/v1/notifications`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(notification),
    });

    return this.handleResponse<Notification>(response);
  }

  async markNotificationViewed(id: string): Promise<Notification> {
    const response = await fetch(`${this.baseUrl}/api/v1/notifications/${id}/view`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });

    return this.handleResponse<Notification>(response);
  }

  async deleteNotification(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/notifications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.status}`);
    }
  }

  // Automation Rules
  async getAutomationRules(): Promise<AutomationRule[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/automation-rules`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AutomationRule[]>(response);
  }

  async createAutomationRule(rule: AutomationRuleCreate): Promise<AutomationRule> {
    const response = await fetch(`${this.baseUrl}/api/v1/automation-rules`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(rule),
    });

    return this.handleResponse<AutomationRule>(response);
  }

  async updateAutomationRule(id: string, rule: AutomationRuleUpdate): Promise<AutomationRule> {
    const response = await fetch(`${this.baseUrl}/api/v1/automation-rules/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(rule),
    });

    return this.handleResponse<AutomationRule>(response);
  }

  async deleteAutomationRule(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/automation-rules/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete automation rule: ${response.status}`);
    }
  }

  async toggleAutomationRule(id: string): Promise<{ message: string; is_active: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/v1/automation-rules/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ message: string; is_active: boolean }>(response);
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreference> {
    const response = await fetch(`${this.baseUrl}/api/v1/preferences`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<UserPreference>(response);
  }

  async updateUserPreferences(preferences: UserPreferenceUpdate): Promise<UserPreference> {
    const response = await fetch(`${this.baseUrl}/api/v1/preferences`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(preferences),
    });

    return this.handleResponse<UserPreference>(response);
  }

  // Analysis methods
  async generateAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/analysis/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse<AnalysisResponse>(response);
  }

  async getLatestAnalysis(timeRange: string = 'week'): Promise<AnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/analysis/latest?time_range=${timeRange}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AnalysisResponse>(response);
  }

  async exportAnalysisReport(request: ExportRequest): Promise<ExportResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/analysis/export`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse<ExportResponse>(response);
  }

  async getAnalysisHistory(): Promise<AnalysisHistoryResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/analysis/history`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AnalysisHistoryResponse>(response);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
