import { apiClient, request, withSignal } from './api';
import type { ApiResult } from '@/types/api';

type Params = Record<string, unknown> | undefined;

export interface FightingStyle {
  id: number;
  name: string;
  description: string;
  detailedText?: string;
  effects?: unknown;
  availableToClasses: string[];
}

export interface DivineOrder {
  id: number;
  name: string;
  description: string;
  detailedText?: string;
  proficienciesGranted?: unknown;
  featuresGranted?: unknown;
  spellsGranted: string[];
}

export interface EldritchInvocation {
  id: number;
  name: string;
  description: string;
  detailedText?: string;
  prerequisites?: unknown;
  effects?: unknown;
  spellsGranted: string[];
  atWillSpells: string[];
  levelRequirement?: number;
  pactBoonRequired?: string;
  spellLevelRequired?: number;
}

export interface ClassChoicesResponse {
  class: unknown;
  choices: {
    fightingStyles?: FightingStyle[];
    divineOrders?: DivineOrder[];
    eldritchInvocations?: EldritchInvocation[];
  };
}

const withParams = (params: Params, signal?: AbortSignal) => withSignal(params ? { params } : undefined, signal);

export const getFightingStyles = (
  className?: string,
  signal?: AbortSignal
): Promise<ApiResult<FightingStyle[]>> =>
  request<FightingStyle[]>(
    () =>
      apiClient.get<FightingStyle[]>(
        '/class-choices/fighting-styles',
        withParams(className ? { className } : undefined, signal)
      ),
    { retry: true }
  );

export const getDivineOrders = (signal?: AbortSignal): Promise<ApiResult<DivineOrder[]>> =>
  request<DivineOrder[]>(
    () => apiClient.get<DivineOrder[]>('/class-choices/divine-orders', withSignal(undefined, signal)),
    { retry: true }
  );

export const getEldritchInvocations = (
  level = 1,
  signal?: AbortSignal
): Promise<ApiResult<EldritchInvocation[]>> =>
  request<EldritchInvocation[]>(
    () =>
      apiClient.get<EldritchInvocation[]>(
        '/class-choices/eldritch-invocations',
        withParams({ level }, signal)
      ),
    { retry: true }
  );

export const getClassData = (
  className: string,
  signal?: AbortSignal
): Promise<ApiResult<unknown>> =>
  request<unknown>(() => apiClient.get(`/class-choices/class-data/${className}`, withSignal(undefined, signal)), {
    retry: true,
  });

export const getClassChoices = (
  className: string,
  level = 1,
  signal?: AbortSignal
): Promise<ApiResult<ClassChoicesResponse>> =>
  request<ClassChoicesResponse>(
    () =>
      apiClient.get<ClassChoicesResponse>(
        `/class-choices/${className}`,
        withParams({ level }, signal)
      ),
    { retry: true }
  );

export const classChoiceService = {
  getFightingStyles,
  getDivineOrders,
  getEldritchInvocations,
  getClassData,
  getClassChoices,
};

export default classChoiceService;
