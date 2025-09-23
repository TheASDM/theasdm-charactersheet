import { apiClient } from './api';
import { Background, ApiResponse } from '../types/api';

export const backgroundService = {
  // Get all backgrounds
  getAll: async (): Promise<ApiResponse<Background[]>> => {
    return apiClient.get<Background[]>('/backgrounds');
  },

  // Get a single background by ID
  getById: async (id: number): Promise<ApiResponse<Background>> => {
    return apiClient.get<Background>(`/backgrounds/${id}`);
  },

  // Get a background by name
  getByName: async (name: string): Promise<ApiResponse<Background>> => {
    return apiClient.get<Background>(
      `/backgrounds/name/${encodeURIComponent(name)}`
    );
  },
};

export default backgroundService;
