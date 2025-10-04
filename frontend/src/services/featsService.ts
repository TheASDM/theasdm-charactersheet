import { apiClient, request, withSignal } from './api';
import { ApiResult, Feat } from '@/types/api';

export interface FeatFilters {
  category?: string;
  level?: number;
  source?: string;
  search?: string;
}

const buildParams = (filters: FeatFilters = {}) => ({
  ...(filters.category && { category: filters.category }),
  ...(filters.level !== undefined && { level: filters.level }),
  ...(filters.source && { source: filters.source }),
  ...(filters.search && { search: filters.search }),
});

const withParams = (filters: FeatFilters = {}, signal?: AbortSignal) => {
  const params = buildParams(filters);
  return withSignal(
    Object.keys(params).length > 0 ? { params } : undefined,
    signal
  );
};

export const listFeats = (
  filters: FeatFilters = {},
  signal?: AbortSignal
): Promise<ApiResult<Feat[]>> =>
  request<Feat[]>(
    () => apiClient.get<Feat[]>('/feats', withParams(filters, signal)),
    { retry: true }
  );

export const getFeatById = (
  id: number,
  signal?: AbortSignal
): Promise<ApiResult<Feat>> =>
  request<Feat>(
    () => apiClient.get<Feat>(`/feats/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const getFeatByName = (
  name: string,
  signal?: AbortSignal
): Promise<ApiResult<Feat>> =>
  request<Feat>(
    () =>
      apiClient.get<Feat>(
        `/feats/name/${encodeURIComponent(name)}`,
        withSignal(undefined, signal)
      ),
    { retry: true }
  );

export const listFeatsByCategory = (
  category: string,
  signal?: AbortSignal
): Promise<ApiResult<Feat[]>> => listFeats({ category }, signal);

export const featsService = {
  listFeats,
  getFeatById,
  getFeatByName,
  listFeatsByCategory,
};

// Feat categories for easy reference (D&D 2024)
export const FEAT_CATEGORIES = {
  ORIGIN: 'O', // Origin feats (level 1)
  GENERAL: 'G', // General feats (level 4+)
  FIGHTING_STYLE: 'FS', // Fighting Style feats
  EPIC_BOON: 'EB', // Epic Boon feats (level 19+)
} as const;

export default featsService;
