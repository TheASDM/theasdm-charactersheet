import { apiClient } from './api';
import { Feat, ApiResponse } from '../types/api';

export const featService = {
  // Get all feats with optional filtering
  getAll: async (params?: {
    category?: string;
    level?: number;
    source?: string;
    search?: string;
  }): Promise<ApiResponse<Feat[]>> => {
    const queryParams = new URLSearchParams();

    if (params?.category) queryParams.append('category', params.category);
    if (params?.level) queryParams.append('level', params.level.toString());
    if (params?.source) queryParams.append('source', params.source);
    if (params?.search) queryParams.append('search', params.search);

    const url = `/feats${
      queryParams.toString() ? '?' + queryParams.toString() : ''
    }`;
    return apiClient.get<Feat[]>(url);
  },

  // Get a single feat by ID
  getById: async (id: number): Promise<ApiResponse<Feat>> => {
    return apiClient.get<Feat>(`/feats/${id}`);
  },

  // Get a feat by name
  getByName: async (name: string): Promise<ApiResponse<Feat>> => {
    return apiClient.get<Feat>(`/feats/name/${encodeURIComponent(name)}`);
  },

  // Get feats by category
  getByCategory: async (category: string): Promise<ApiResponse<Feat[]>> => {
    return apiClient.get<Feat[]>(
      `/feats/category/${encodeURIComponent(category)}`
    );
  },
};

export default featService;
