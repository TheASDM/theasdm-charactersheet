import { apiClient, request, withSignal } from './api';
import { Spell, ApiResult, PaginatedResponse } from '@/types/api';

export interface SpellFilters {
  level?: number;
  school?: string;
  search?: string;
  className?: string;
  page?: number;
  limit?: number;
}

const buildSpellParams = (filters: SpellFilters = {}) => ({
  ...(filters.level !== undefined && { level: filters.level }),
  ...(filters.school && { school: filters.school }),
  ...(filters.search && { search: filters.search }),
  ...(filters.className && { className: filters.className }),
  page: filters.page ?? 1,
  limit: filters.limit ?? 50,
});

export const listSpells = (
  filters: SpellFilters = {},
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Spell>>> =>
  request<PaginatedResponse<Spell>>(
    () =>
      apiClient.get<PaginatedResponse<Spell>>(
        '/spells',
        withSignal({ params: buildSpellParams(filters) }, signal)
      ),
    { retry: true }
  );

export const getSpellById = (
  id: string,
  signal?: AbortSignal
): Promise<ApiResult<Spell>> =>
  request<Spell>(
    () => apiClient.get<Spell>(`/spells/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const listSpellsByLevel = (
  level: number,
  signal?: AbortSignal
): Promise<ApiResult<Spell[]>> =>
  request<Spell[]>(
    () => apiClient.get<Spell[]>(`/spells/level/${level}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const listSpellsBySchool = (
  school: string,
  signal?: AbortSignal
): Promise<ApiResult<Spell[]>> =>
  request<Spell[]>(
    () => apiClient.get<Spell[]>(`/spells/school/${school}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const searchSpells = (
  query: string,
  limit = 20,
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Spell>>> =>
  listSpells({ search: query, limit }, signal);

export const listCantrips = (signal?: AbortSignal): Promise<ApiResult<Spell[]>> =>
  listSpellsByLevel(0, signal);

export const listSpellsByClass = (
  className: string,
  filters: Omit<SpellFilters, 'className'> = {},
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Spell>>> =>
  listSpells({ ...filters, className }, signal);

export const listSpellsByClassId = (
  classId: string,
  filters: Omit<SpellFilters, 'className'> = {},
  signal?: AbortSignal
): Promise<ApiResult<PaginatedResponse<Spell>>> =>
  request<PaginatedResponse<Spell>>(
    () =>
      apiClient.get<PaginatedResponse<Spell>>(
        `/classes/${classId}/spells`,
        withSignal(
          {
            params: {
              ...(filters.level !== undefined && { level: filters.level }),
              ...(filters.search && { search: filters.search }),
              page: filters.page ?? 1,
              limit: filters.limit ?? 200,
            },
          },
          signal
        )
      ),
    { retry: true }
  );

export const getClassSpellStats = (
  classId: string,
  signal?: AbortSignal
): Promise<ApiResult<{ total: number; byLevel: Record<number, number> }>> =>
  request<{ total: number; byLevel: Record<number, number> }>(
    () =>
      apiClient.get(`/classes/${classId}/spell-stats`, withSignal(undefined, signal)),
    { retry: true }
  );

export const spellService = {
  listSpells,
  getSpellById,
  listSpellsByLevel,
  listSpellsBySchool,
  searchSpells,
  listCantrips,
  listSpellsByClass,
  listSpellsByClassId,
  getClassSpellStats,
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
