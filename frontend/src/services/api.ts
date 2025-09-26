import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types/api';

// Function to get the current host's base URL for API calls
const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In development, use the proxy setup from vite.config.ts
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production, use the full API URL
  const currentHost = window.location.hostname;
  return `http://${currentHost}:3001/api`;
};

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      // You might want to dispatch a logout action here
      console.warn('Session expired. Please log in again.');
    } else if (error.response?.status === 403) {
      console.error('Access forbidden');
    } else if (error.response?.status === 404) {
      console.error('Resource not found');
    } else if (error.response && error.response.status >= 500) {
      console.error('Server error');
    }

    return Promise.reject(error);
  }
);

// Generic API helper functions
export const apiClient = {
  get: async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get<T>(url, { params });
      return { data: response.data };
    } catch (error) {
      return handleApiError<T>(error as AxiosError);
    }
  },

  post: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post<T>(url, data);
      return { data: response.data };
    } catch (error) {
      return handleApiError<T>(error as AxiosError);
    }
  },

  put: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put<T>(url, data);
      return { data: response.data };
    } catch (error) {
      return handleApiError<T>(error as AxiosError);
    }
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete<T>(url);
      return { data: response.data };
    } catch (error) {
      return handleApiError<T>(error as AxiosError);
    }
  },
};

// Error handler helper
function handleApiError<T>(error: AxiosError): ApiResponse<T> {
  const responseData = error.response?.data as any;
  const message =
    responseData?.message ||
    responseData?.error ||
    error.message ||
    'An unexpected error occurred';

  return {
    error: message,
    message,
  };
}

export default api;
