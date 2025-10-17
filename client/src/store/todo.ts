import { create } from 'zustand';
import type { 
  Todo, TodoCreateRequest, TodoUpdateRequest, TodoFilters, 
  Group, Tag, Subtask, SubtaskCreateRequest, SubtaskUpdateRequest,
  TaskComment, TaskCommentCreateRequest, TaskCommentUpdateRequest,
  TaskAssignment, TaskAssignmentCreateRequest,
  TodoReorderRequest, TodoMoveRequest
} from '@/types';
import { apiService } from '@/services/api';

interface TodoState {
  todos: Todo[];
  groups: Group[];
  tags: Tag[];
  currentFilter: TodoFilters;
  isLoading: boolean;
  error: string | null;
}

interface TodoActions {
  // Todo actions
  fetchTodos: (filters?: TodoFilters) => Promise<void>;
  createTodo: (data: TodoCreateRequest) => Promise<void>;
  updateTodo: (id: string, data: TodoUpdateRequest) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string, is_completed: boolean) => Promise<void>;
  
  // Group actions
  fetchGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  updateGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  
  // Tag actions
  fetchTags: () => Promise<void>;
  createTag: (name: string) => Promise<void>;
  updateTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  // Subtask actions
  createSubtask: (todoId: string, data: SubtaskCreateRequest) => Promise<void>;
  updateSubtask: (todoId: string, subtaskId: string, data: SubtaskUpdateRequest) => Promise<void>;
  deleteSubtask: (todoId: string, subtaskId: string) => Promise<void>;
  
  // Comment actions
  createComment: (todoId: string, data: TaskCommentCreateRequest) => Promise<void>;
  
  // Assignment actions
  assignTodo: (todoId: string, data: TaskAssignmentCreateRequest) => Promise<void>;
  fetchAssignedTodos: () => Promise<void>;
  
  // Reorder actions
  reorderTodos: (data: TodoReorderRequest) => Promise<void>;
  moveTodo: (data: TodoMoveRequest) => Promise<void>;
  
  // Filter actions
  setFilter: (filter: Partial<TodoFilters>) => void;
  clearError: () => void;
}

export const useTodoStore = create<TodoState & TodoActions>((set, get) => ({
  // State
  todos: [],
  groups: [],
  tags: [],
  currentFilter: {},
  isLoading: false,
  error: null,

  // Todo actions
  fetchTodos: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const todos = await apiService.getTodos(filters);
      set({ todos, isLoading: false, currentFilter: filters });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch todos',
        isLoading: false,
      });
    }
  },

  createTodo: async (data: TodoCreateRequest) => {
    try {
      const newTodo = await apiService.createTodo(data);
      // Prepend to top like Microsoft To Do
      set((state) => ({ todos: [newTodo, ...state.todos] }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to create todo',
      });
      throw error;
    }
  },

  updateTodo: async (id: string, data: TodoUpdateRequest) => {
    try {
      const updatedTodo = await apiService.updateTodo(id, data);
      set((state) => ({
        todos: state.todos.map((todo) => (todo.id === id ? updatedTodo : todo)),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to update todo',
      });
      throw error;
    }
  },

  deleteTodo: async (id: string) => {
    try {
      await apiService.deleteTodo(id);
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to delete todo',
      });
      throw error;
    }
  },

  toggleComplete: async (id: string, is_completed: boolean) => {
    try {
      const updatedTodo = await apiService.toggleTodoComplete(id, is_completed);
      set((state) => ({
        todos: state.todos.map((todo) => (todo.id === id ? updatedTodo : todo)),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to toggle todo',
      });
      throw error;
    }
  },

  // Group actions
  fetchGroups: async () => {
    try {
      const groups = await apiService.getGroups();
      set({ groups });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch groups',
      });
    }
  },

  createGroup: async (name: string) => {
    try {
      const newGroup = await apiService.createGroup({ name });
      set((state) => ({ groups: [...state.groups, newGroup] }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to create group',
      });
      throw error;
    }
  },

  updateGroup: async (id: string, name: string) => {
    try {
      const updatedGroup = await apiService.updateGroup(id, { name });
      set((state) => ({
        groups: state.groups.map((group) => (group.id === id ? updatedGroup : group)),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to update group',
      });
      throw error;
    }
  },

  deleteGroup: async (id: string) => {
    try {
      await apiService.deleteGroup(id);
      set((state) => ({
        groups: state.groups.filter((group) => group.id !== id),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to delete group',
      });
      throw error;
    }
  },

  // Tag actions
  fetchTags: async () => {
    try {
      const tags = await apiService.getTags();
      set({ tags });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch tags',
      });
    }
  },

  createTag: async (name: string) => {
    try {
      const newTag = await apiService.createTag({ name });
      set((state) => ({ tags: [...state.tags, newTag] }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to create tag',
      });
      throw error;
    }
  },

  updateTag: async (id: string, name: string) => {
    try {
      const updatedTag = await apiService.updateTag(id, { name });
      set((state) => ({
        tags: state.tags.map((tag) => (tag.id === id ? updatedTag : tag)),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to update tag',
      });
      throw error;
    }
  },

  deleteTag: async (id: string) => {
    try {
      await apiService.deleteTag(id);
      set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== id),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to delete tag',
      });
      throw error;
    }
  },

  // Subtask actions
  createSubtask: async (todoId: string, data: SubtaskCreateRequest) => {
    try {
      const newSubtask = await apiService.createSubtask(todoId, data);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === todoId
            ? { ...todo, subtasks: [...(todo.subtasks || []), newSubtask] }
            : todo
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to create subtask',
      });
      throw error;
    }
  },

  updateSubtask: async (todoId: string, subtaskId: string, data: SubtaskUpdateRequest) => {
    try {
      const updatedSubtask = await apiService.updateSubtask(todoId, subtaskId, data);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                subtasks: (todo.subtasks || []).map((subtask) =>
                  subtask.id === subtaskId ? updatedSubtask : subtask
                ),
              }
            : todo
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to update subtask',
      });
      throw error;
    }
  },

  deleteSubtask: async (todoId: string, subtaskId: string) => {
    try {
      await apiService.deleteSubtask(todoId, subtaskId);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === todoId
            ? {
                ...todo,
                subtasks: (todo.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
              }
            : todo
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to delete subtask',
      });
      throw error;
    }
  },

  // Comment actions
  createComment: async (todoId: string, data: TaskCommentCreateRequest) => {
    try {
      const newComment = await apiService.createComment(todoId, data);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === todoId
            ? { ...todo, comments: [...(todo.comments || []), newComment] }
            : todo
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to create comment',
      });
      throw error;
    }
  },

  // Assignment actions
  assignTodo: async (todoId: string, data: TaskAssignmentCreateRequest) => {
    try {
      const newAssignment = await apiService.assignTodo(todoId, data);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === todoId
            ? { ...todo, assignments: [...(todo.assignments || []), newAssignment] }
            : todo
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to assign todo',
      });
      throw error;
    }
  },

  fetchAssignedTodos: async () => {
    try {
      const assignedTodos = await apiService.getAssignedTodos();
      set({ todos: assignedTodos });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch assigned todos',
      });
      throw error;
    }
  },

  // Reorder actions
  reorderTodos: async (data: TodoReorderRequest) => {
    try {
      await apiService.reorderTodos(data);
      // Update local state with new order
      set((state) => {
        const todoMap = new Map(state.todos.map((todo) => [todo.id, todo]));
        const reorderedTodos = data.todo_ids
          .map((id) => todoMap.get(id))
          .filter((todo): todo is Todo => todo !== undefined);
        return { todos: reorderedTodos };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to reorder todos',
      });
      throw error;
    }
  },

  moveTodo: async (data: TodoMoveRequest) => {
    try {
      const movedTodo = await apiService.moveTodo(data);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === data.todo_id ? movedTodo : todo
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to move todo',
      });
      throw error;
    }
  },

  // Filter actions
  setFilter: (filter: Partial<TodoFilters>) => {
    set((state) => ({
      currentFilter: { ...state.currentFilter, ...filter },
    }));
  },

  clearError: () => set({ error: null }),
}));
