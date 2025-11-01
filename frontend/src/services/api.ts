import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {
  ApiErrorCode,
  ApiResponse,
  ApiResult,
  fail,
  ok,
} from '@/types/api';

const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

type AuthTokenGetter = () => string | null;
let authTokenGetter: AuthTokenGetter | null = null;

const getAuthToken = (): string | null => {
  if (authTokenGetter) {
    try {
      return authTokenGetter() ?? null;
    } catch {
      return null;
    }
  }

  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      return window.localStorage.getItem('authToken');
    }
  } catch {
    // Ignore storage access errors (privacy mode, etc.)
  }

  return null;
};

export const setAuthTokenGetter = (getter: AuthTokenGetter | null) => {
  authTokenGetter = getter;
};

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.DEV) {
    return '/api';
  }

  const currentHost = window.location.hostname;

  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return '/api';
  }

  const protocol = window.location.protocol;
  return `${protocol}//${currentHost}:3001/api`;
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      const headers = AxiosHeaders.from(config.headers ?? {});
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      emitUnauthorized();
    }
    return Promise.reject(error);
  }
);

const emitUnauthorized = () => {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }
};

const mapStatusToErrorCode = (status?: number): ApiErrorCode => {
  if (!status) return 'unknown';
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'not_found';
  if (status === 408) return 'timeout';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  if (status >= 400) return 'validation';
  return 'unknown';
};

const isTimeoutError = (error: AxiosError): boolean => {
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('timed out')
  );
};

const isNetworkError = (error: AxiosError): boolean => {
  return (
    error.code === 'ERR_NETWORK' ||
    (!error.response && !axios.isCancel(error) && !isTimeoutError(error))
  );
};

const DEFAULT_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  validation: 'Validation error. Please review your input.',
  auth: 'You do not have permission to perform this action.',
  not_found: 'The requested resource could not be found.',
  network_error: 'Network error. Check your connection and retry.',
  timeout: 'Request timed out. Please try again.',
  rate_limited: 'Too many requests. Slow down and try again shortly.',
  server_error: 'Server error. Please try again later.',
  unknown: 'An unexpected error occurred.',
};

const normalizeMessage = (message: string | undefined, code: ApiErrorCode, status?: number) => {
  if (!message) {
    return DEFAULT_ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGES.unknown;
  }

  if (status && message === `Request failed with status code ${status}`) {
    return DEFAULT_ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGES.unknown;
  }

  return message;
};

const buildErrorResponse = <T>(error: AxiosError): ApiResponse<T> => {
  if (axios.isCancel(error)) {
    return {
      error: 'Request cancelled',
      message: 'Request cancelled',
      statusCode: 499,
      errorCode: 'timeout',
      raw: error,
    };
  }

  if (isTimeoutError(error)) {
    return {
      error: 'Request timed out. Please try again.',
      message: 'Request timed out. Please try again.',
      statusCode: 408,
      errorCode: 'timeout',
      raw: error,
    };
  }

  if (isNetworkError(error)) {
    return {
      error: DEFAULT_ERROR_MESSAGES.network_error,
      message: DEFAULT_ERROR_MESSAGES.network_error,
      errorCode: 'network_error',
      raw: error,
    };
  }

  const status = error.response?.status;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  const errorCode = mapStatusToErrorCode(status);
  const message = normalizeMessage(
    data?.message || data?.error || error.message,
    errorCode,
    status
  );

  return {
    error: message,
    message,
    statusCode: status,
    errorCode,
    raw: error,
  };
};

const isAxiosConfig = (
  value?: AxiosRequestConfig | Record<string, unknown>
): value is AxiosRequestConfig => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const configKeys = [
    'params',
    'signal',
    'headers',
    'timeout',
    'baseURL',
    'withCredentials',
    'auth',
    'responseType',
    'onUploadProgress',
    'onDownloadProgress',
  ];

  return Object.keys(value).some((key) => configKeys.includes(key));
};

const toAxiosConfig = (
  paramsOrConfig?: AxiosRequestConfig | Record<string, unknown>
): AxiosRequestConfig | undefined => {
  if (!paramsOrConfig) {
    return undefined;
  }

  if (isAxiosConfig(paramsOrConfig)) {
    return paramsOrConfig as AxiosRequestConfig;
  }

  return { params: paramsOrConfig } as AxiosRequestConfig;
};

export const withSignal = (
  config: AxiosRequestConfig | undefined,
  signal?: AbortSignal
): AxiosRequestConfig | undefined => {
  if (!signal) return config;
  return {
    ...(config || {}),
    signal,
  };
};

export interface RequestOptions {
  retry?: boolean;
}

const shouldRetry = (response: ApiResponse<unknown>): boolean => {
  if (!response.error) {
    return false;
  }

  if (response.errorCode === 'timeout' || response.errorCode === 'network_error') {
    return true;
  }

  if (response.statusCode && [502, 503, 504].includes(response.statusCode)) {
    return true;
  }

  return false;
};

export const request = async <T>(
  runner: () => Promise<ApiResponse<T>>,
  options: RequestOptions = {}
): Promise<ApiResult<T>> => {
  const attempts = options.retry ? 2 : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: ApiResponse<T>;

    try {
      response = await runner();
    } catch (error) {
      const axiosError = error as AxiosError;
      response = buildErrorResponse<T>(axiosError);
    }

    if (!response.error && typeof response.data !== 'undefined') {
      return ok(response.data, response.statusCode);
    }

    if (response.statusCode === 401) {
      emitUnauthorized();
    }

    if (attempt < attempts && shouldRetry(response)) {
      continue;
    }

    const message = response.error || 'Unexpected error';
    const errorOptions: {
      statusCode?: number;
      errorCode?: ApiErrorCode;
      cause?: unknown;
    } = {
      ...(response.statusCode !== undefined && { statusCode: response.statusCode }),
      ...(response.errorCode !== undefined && { errorCode: response.errorCode }),
      ...(response.raw !== undefined && { cause: response.raw }),
    };

    return fail(message, errorOptions);
  }

  return fail('Unexpected error');
};

export const apiClient = {
  get: async <T>(
    url: string,
    paramsOrConfig?: AxiosRequestConfig | Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    try {
      const config = toAxiosConfig(paramsOrConfig);
      const response: AxiosResponse<T> = await axiosInstance.get(url, config);
      return { data: response.data, statusCode: response.status };
    } catch (error) {
      return buildErrorResponse<T>(error as AxiosError);
    }
  },

  post: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.post(url, data, config);
      return { data: response.data, statusCode: response.status };
    } catch (error) {
      return buildErrorResponse<T>(error as AxiosError);
    }
  },

  put: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.put(url, data, config);
      return { data: response.data, statusCode: response.status };
    } catch (error) {
      return buildErrorResponse<T>(error as AxiosError);
    }
  },

  patch: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.patch(url, data, config);
      return { data: response.data, statusCode: response.status };
    } catch (error) {
      return buildErrorResponse<T>(error as AxiosError);
    }
  },

  delete: async <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await axiosInstance.delete(url, config);
      return { data: response.data, statusCode: response.status };
    } catch (error) {
      return buildErrorResponse<T>(error as AxiosError);
    }
  },
};

export { axiosInstance };
export const AUTH_EVENTS = {
  UNAUTHORIZED: AUTH_UNAUTHORIZED_EVENT,
};

export default apiClient;
