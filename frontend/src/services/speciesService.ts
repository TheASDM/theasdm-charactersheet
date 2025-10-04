import { apiClient, request, withSignal } from './api';
import { ApiResult, Species } from '@/types/api';

export const listSpecies = (signal?: AbortSignal): Promise<ApiResult<Species[]>> =>
  request(
    () => apiClient.get<Species[]>('/races', withSignal(undefined, signal)),
    { retry: true }
  );

export const getSpecies = (id: string, signal?: AbortSignal): Promise<ApiResult<Species>> =>
  request(
    () => apiClient.get<Species>(`/races/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );

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

export const speciesService = {
  getAll: listSpecies,
  getById: (id: number, signal?: AbortSignal) => getSpecies(String(id), signal),
};

export default speciesService;
