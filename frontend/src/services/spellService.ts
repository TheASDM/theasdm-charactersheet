import { apiClient } from './api';
import { Spell, ApiResponse, PaginatedResponse } from '../types/api';

export interface SpellFilters {
  level?: number;
  school?: string;
  search?: string;
  className?: string;
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
      ...(filters.className && { className: filters.className }),
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

  // Get spells for a specific class
  getByClass: async (
    className: string,
    filters: Omit<SpellFilters, 'className'> = {}
  ): Promise<ApiResponse<PaginatedResponse<Spell>>> => {
    return spellService.getAll({ ...filters, className });
  },

  // Get spells for a class by ID
  getByClassId: async (
    classId: number,
    filters: Omit<SpellFilters, 'className'> = {}
  ): Promise<ApiResponse<PaginatedResponse<Spell>>> => {
    const params = {
      ...(filters.level !== undefined && { level: filters.level }),
      ...(filters.search && { search: filters.search }),
      page: filters.page || 1,
      limit: filters.limit || 200,
    };
    return apiClient.get<PaginatedResponse<Spell>>(`/classes/${classId}/spells`, params);
  },

  // Get spell statistics for a class
  getClassSpellStats: async (classId: number): Promise<ApiResponse<{ total: number; byLevel: Record<number, number> }>> => {
    return apiClient.get(`/classes/${classId}/spell-stats`);
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
