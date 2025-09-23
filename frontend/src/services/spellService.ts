import { apiClient } from './api';
import { Spell, ApiResponse, PaginatedResponse } from '../types/api';

export interface SpellFilters {
  level?: number;
  school?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const spellService = {
  // Get all spells with pagination and filtering
  getAll: async (
    filters: SpellFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Spell>>> => {
    const params = {
      ...(filters.level !== undefined && { level: filters.level }),
      ...(filters.school && { school: filters.school }),
      ...(filters.search && { search: filters.search }),
      page: filters.page || 1,
      limit: filters.limit || 50,
    };
    return apiClient.get<PaginatedResponse<Spell>>('/spells', params);
  },

  // Get a single spell by ID
  getById: async (id: number): Promise<ApiResponse<Spell>> => {
    return apiClient.get<Spell>(`/spells/${id}`);
  },

  // Get spells by level
  getByLevel: async (level: number): Promise<ApiResponse<Spell[]>> => {
    return apiClient.get<Spell[]>(`/spells/level/${level}`);
  },

  // Get spells by school
  getBySchool: async (school: string): Promise<ApiResponse<Spell[]>> => {
    return apiClient.get<Spell[]>(`/spells/school/${school}`);
  },

  // Search spells by name
  search: async (
    query: string,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Spell>>> => {
    return spellService.getAll({ search: query, limit });
  },

  // Get cantrips (level 0 spells)
  getCantrips: async (): Promise<ApiResponse<Spell[]>> => {
    return spellService.getByLevel(0);
  },

  // Get spells for a specific class (if this data is available)
  getByClass: async (
    className: string
  ): Promise<ApiResponse<PaginatedResponse<Spell>>> => {
    // This would need backend support to filter by class spell lists
    return spellService.search(className);
  },
};

// Spell school constants for easy reference
export const SPELL_SCHOOLS = {
  ABJURATION: 'A',
  CONJURATION: 'C',
  DIVINATION: 'D',
  ENCHANTMENT: 'E',
  EVOCATION: 'V',
  ILLUSION: 'I',
  NECROMANCY: 'N',
  TRANSMUTATION: 'T',
} as const;

// Spell level constants
export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export default spellService;
