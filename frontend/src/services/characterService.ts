import { apiClient } from './api';
import {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  ApiResponse,
} from '../types/api';

export const characterService = {
  // Get all characters, optionally filtered by user
  getAll: async (userId?: number): Promise<ApiResponse<Character[]>> => {
    const params = userId ? { userId } : undefined;
    return apiClient.get<Character[]>('/characters', params);
  },

  // Get a single character by ID
  getById: async (id: number): Promise<ApiResponse<Character>> => {
    return apiClient.get<Character>(`/characters/${id}`);
  },

  // Create a new character
  create: async (
    characterData: CreateCharacterRequest
  ): Promise<ApiResponse<Character>> => {
    return apiClient.post<Character>('/characters', characterData);
  },

  // Update an existing character
  update: async (
    id: number,
    characterData: UpdateCharacterRequest
  ): Promise<ApiResponse<Character>> => {
    return apiClient.put<Character>(`/characters/${id}`, characterData);
  },

  // Delete a character
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/characters/${id}`);
  },

  // Get characters for a specific user
  getByUser: async (userId: number): Promise<ApiResponse<Character[]>> => {
    return characterService.getAll(userId);
  },

  // Get public characters
  getPublic: async (): Promise<ApiResponse<Character[]>> => {
    return apiClient.get<Character[]>('/characters?public=true');
  },

  // Update just the character sheet data
  updateCharacterSheet: async (
    id: number,
    characterSheetData: any
  ): Promise<ApiResponse<Character>> => {
    return characterService.update(id, { characterData: characterSheetData });
  },
};

export default characterService;
