import { apiClient, request, withSignal } from './api';
import type { ApiResult, Character } from '@/types/api';

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

export const getCharacter = (
  id: number | string,
  signal?: AbortSignal
): Promise<ApiResult<Character>> =>
  request<Character>(
    () => apiClient.get<Character>(`/characters/${id}`, withSignal(undefined, signal)),
    { retry: true }
  );

export const updateCharacterChoices = (
  id: number | string,
  payload: ChoiceSelectionPayload,
  signal?: AbortSignal
): Promise<ApiResult<ChoiceSelectionResponse>> =>
  request<ChoiceSelectionResponse>(
    () =>
      apiClient.patch<ChoiceSelectionResponse>(
        `/characters/${id}/choices`,
        payload,
        withSignal(undefined, signal)
      )
  );

export const characterApi = {
  getCharacter,
  updateCharacterChoices,
};

export default characterApi;
