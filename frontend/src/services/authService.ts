import { apiClient } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  isDm: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    characters: number;
    campaigns: number;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    if (response.data) {
      // Store token in localStorage
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }

    throw new Error(response.error || 'Registration failed');
  },

  /**
   * Login user
   */
  login: async (data: LoginData) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);

    if (response.data) {
      // Store token in localStorage
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always remove token, even if API call fails
      localStorage.removeItem('authToken');
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async () => {
    const response = await apiClient.get<{ user: User }>('/auth/me');

    if (response.data) {
      return response.data.user;
    }

    throw new Error(response.error || 'Failed to fetch user profile');
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileData) => {
    const response = await apiClient.patch<AuthResponse>('/auth/profile', data);

    if (response.data) {
      // Update token with new user info
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }

    throw new Error(response.error || 'Failed to update profile');
  },

  /**
   * Update password
   */
  updatePassword: async (data: UpdatePasswordData) => {
    const response = await apiClient.patch<{ message: string }>('/auth/password', data);

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update password');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get stored token
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },
};

export default authService;
