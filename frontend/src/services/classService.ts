import { apiClient } from './api';
import { CharacterClass, ApiResponse } from '../types/api';

export const classService = {
  // Get all character classes
  getAll: async (): Promise<ApiResponse<CharacterClass[]>> => {
    return apiClient.get<CharacterClass[]>('/classes');
  },

  // Get a single class by ID
  getById: async (id: number): Promise<ApiResponse<CharacterClass>> => {
    return apiClient.get<CharacterClass>(`/classes/${id}`);
  },

  // Get a class by name
  getByName: async (name: string): Promise<ApiResponse<CharacterClass>> => {
    return apiClient.get<CharacterClass>(
      `/classes/name/${encodeURIComponent(name)}`
    );
  },
};

// Character class constants for easy reference
export const CHARACTER_CLASSES = [
  'Artificer',
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const;

export default classService;
