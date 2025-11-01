import { apiClient, request, withSignal, getApiBaseUrl } from './api';
import { ApiResult, User, ok, isError } from '@/types/api';
import { getSessionToken } from './session';

export interface AuthSession {
  message?: string;
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  username?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  displayName?: string;
}

interface AuthMeResponse {
  user: User;
}

export async function register(data: RegisterData): Promise<ApiResult<AuthSession>> {
  return request<AuthSession>(() => apiClient.post<AuthSession>('/auth/register', data));
}

export async function login(data: LoginData): Promise<ApiResult<AuthSession>> {
  return request<AuthSession>(() => apiClient.post<AuthSession>('/auth/login', data));
}

export async function logout(signal?: AbortSignal): Promise<ApiResult<void>> {
  return request<void>(() => apiClient.post('/auth/logout', undefined, withSignal(undefined, signal)));
}

export async function me(signal?: AbortSignal): Promise<ApiResult<User>> {
  const result = await request<AuthMeResponse>(
    () => apiClient.get<AuthMeResponse>('/auth/me', withSignal(undefined, signal)),
    { retry: true }
  );

  if (isError(result)) {
    return result;
  }

  return ok(result.data.user, result.statusCode);
}

export async function getCurrentUser(signal?: AbortSignal): Promise<ApiResult<User>> {
  return me(signal);
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<ApiResult<AuthSession>> {
  return request<AuthSession>(() => apiClient.patch<AuthSession>('/auth/profile', data));
}

export const isAuthenticated = (): boolean => !!getSessionToken();

export const getToken = (): string | null => getSessionToken();

export const getDiscordLoginUrl = (redirectTo?: string): string => {
  const query = new URLSearchParams();
  if (redirectTo) {
    query.set('redirectTo', redirectTo);
  }
  const base = `${getApiBaseUrl()}/auth/discord`;
  const hasQuery = query.toString();
  return hasQuery ? `${base}?${query.toString()}` : base;
};

export const authService = {
  register,
  login,
  logout,
  me,
  getCurrentUser,
  updateProfile,
  isAuthenticated,
  getToken,
  getDiscordLoginUrl,
};

export type { User };

export default authService;
