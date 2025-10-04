import { apiClient, request, withSignal } from './api';
import { ApiResult, Background } from '@/types/api';

export const listBackgrounds = (
  signal?: AbortSignal
): Promise<ApiResult<Background[]>> =>
  request<Background[]>(
    () => apiClient.get<Background[]>('/backgrounds', withSignal(undefined, signal)),
    { retry: true }
  );

export const getBackgroundById = (
  id: string,
  signal?: AbortSignal
): Promise<ApiResult<Background>> =>
  request<Background>(
    () => apiClient.get<Background>(`/backgrounds/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const findBackgroundByName = (
  name: string,
  signal?: AbortSignal
): Promise<ApiResult<Background>> =>
  request<Background>(
    () =>
      apiClient.get<Background>(
        `/backgrounds/name/${encodeURIComponent(name)}`,
        withSignal(undefined, signal)
      ),
    { retry: true }
  );

export const backgroundService = {
  listBackgrounds,
  getBackgroundById,
  findBackgroundByName,
};

export default backgroundService;
