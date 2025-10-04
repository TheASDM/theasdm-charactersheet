import { apiClient, request, withSignal } from './api';
import {
  ApiResult,
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from '@/types/api';
import type { CharacterSheetData } from '@/types/characterSheet';

type ListCharactersParams = {
  userId?: number;
  includePublic?: boolean;
};

const withQuery = (params?: Record<string, unknown>, signal?: AbortSignal) =>
  withSignal(params ? { params } : undefined, signal);

export async function list(
  params: ListCharactersParams = {},
  signal?: AbortSignal
): Promise<ApiResult<Character[]>> {
  const query: Record<string, unknown> = {};
  if (typeof params.userId === 'number') {
    query.userId = params.userId;
  }
  if (params.includePublic) {
    query.public = 'true';
  }

  return request<Character[]>(
    () =>
      apiClient.get<Character[]>(
        '/characters',
        Object.keys(query).length > 0 ? withQuery(query, signal) : withSignal(undefined, signal)
      ),
    { retry: true }
  );
}

export async function getById(
  id: number | string,
  signal?: AbortSignal
): Promise<ApiResult<Character>> {
  return request<Character>(
    () => apiClient.get<Character>(`/characters/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );
}

export async function create(
  input: CreateCharacterRequest
): Promise<ApiResult<Character>> {
  return request<Character>(() => apiClient.post<Character>('/characters', input));
}

export async function remove(id: number | string): Promise<ApiResult<void>> {
  return request<void>(() => apiClient.delete<void>(`/characters/${id}`));
}

export async function update(
  id: number | string,
  patch: UpdateCharacterRequest,
  signal?: AbortSignal
): Promise<ApiResult<Character>> {
  return request<Character>(() =>
    apiClient.put<Character>(`/characters/${id}`, patch, withSignal(undefined, signal))
  );
}

export async function updateCharacterSheet(
  id: number,
  characterSheetData: CharacterSheetData
): Promise<ApiResult<Character>> {
  return update(id, {
    characterData: characterSheetData,
    name: characterSheetData.name,
    level: characterSheetData.level,
  });
}

export const characterService = {
  list,
  getAll: (userId?: number, signal?: AbortSignal) =>
    list(typeof userId === 'number' ? { userId } : {}, signal),
  getById,
  create,
  update,
  delete: remove,
  remove,
  getByUser: (userId: number, signal?: AbortSignal) => list({ userId }, signal),
  getPublic: (signal?: AbortSignal) => list({ includePublic: true }, signal),
  updateCharacterSheet,
};

export default characterService;
