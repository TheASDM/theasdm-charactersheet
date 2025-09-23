import { apiClient } from './api';
import { Species, ApiResponse } from '../types/api';

export const speciesService = {
  // Get all species (races)
  getAll: async (): Promise<ApiResponse<Species[]>> => {
    return apiClient.get<Species[]>('/races');
  },

  // Get a single species by ID
  getById: async (id: number): Promise<ApiResponse<Species>> => {
    return apiClient.get<Species>(`/races/${id}`);
  },

  // Get a species by name
  getByName: async (name: string): Promise<ApiResponse<Species>> => {
    return apiClient.get<Species>(`/races/name/${encodeURIComponent(name)}`);
  },
};

// Species constants for easy reference (D&D 2024)
export const SPECIES_LIST = [
  'Aasimar',
  'Dragonborn',
  'Dwarf',
  'Elf',
  'Gnome',
  'Goliath',
  'Halfling',
  'Human',
  'Orc',
  'Tiefling',
] as const;

export default speciesService;
