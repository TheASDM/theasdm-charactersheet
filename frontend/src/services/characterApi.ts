/**
 * Character API Service
 *
 * Handles all character-related API calls including choice management
 */

import { apiClient } from './api';
import { CharacterSheetData } from '../types/characterSheet';

export interface Character {
  id: number;
  userId: number;
  name: string;
  level: number;
  characterData: CharacterSheetData;
  isPublic: boolean;
  campaignId: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
  };
  campaign?: {
    id: number;
    name: string;
  };
}

export interface ChoiceSelectionPayload {
  choiceGroupId: string;
  selectedFeatureIds: string[];
}

export interface ChoiceSelectionResponse {
  success: boolean;
  character: Character;
  choiceApplied: {
    choiceGroupId: string;
    selectedFeatureIds: string[];
  };
}

/**
 * Character API service
 */
export const characterApi = {
  /**
   * Get all characters (filtered by auth)
   */
  async getAll(): Promise<Character[]> {
    const response = await apiClient.get<Character[]>('/characters');
    return response.data || [];
  },

  /**
   * Get a single character by ID
   */
  async getById(id: number): Promise<Character | null> {
    const response = await apiClient.get<Character>(`/characters/${id}`);
    if (response.error) {
      console.error('Error fetching character:', response.error);
      return null;
    }
    return response.data || null;
  },

  /**
   * Create a new character
   */
  async create(characterData: Partial<Character>): Promise<Character | null> {
    const response = await apiClient.post<Character>('/characters', characterData);
    if (response.error) {
      console.error('Error creating character:', response.error);
      return null;
    }
    return response.data || null;
  },

  /**
   * Update a character (full update)
   */
  async update(id: number, characterData: Partial<Character>): Promise<Character | null> {
    const response = await apiClient.put<Character>(`/characters/${id}`, characterData);
    if (response.error) {
      console.error('Error updating character:', response.error);
      return null;
    }
    return response.data || null;
  },

  /**
   * Update character class choices (partial update)
   * This is the preferred method for saving choice selections
   */
  async updateChoices(
    id: number,
    payload: ChoiceSelectionPayload
  ): Promise<ChoiceSelectionResponse | null> {
    const response = await apiClient.patch<ChoiceSelectionResponse>(
      `/characters/${id}/choices`,
      payload
    );
    if (response.error) {
      console.error('Error updating character choices:', response.error);
      return null;
    }
    return response.data || null;
  },

  /**
   * Delete a character
   */
  async delete(id: number): Promise<boolean> {
    const response = await apiClient.delete(`/characters/${id}`);
    return !response.error;
  }
};
