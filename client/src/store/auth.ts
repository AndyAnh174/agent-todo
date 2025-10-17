import { create } from 'zustand';
import type { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { apiService } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  // Actions
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.login(credentials);
      set({
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      // Store token in localStorage
      localStorage.setItem('access_token', response.access_token);
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.register(data);
      set({
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      // Store token in localStorage
      localStorage.setItem('access_token', response.access_token);
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  initializeAuth: () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      set({
        token,
        isAuthenticated: true,
      });
    }
  },
}));
