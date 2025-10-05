import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiResult, isError } from '@/types/api';
import { showError } from '@/utils/errorDisplay';

interface Options<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiResult<never>) => void;
  showErrorToast?: boolean;
}

interface State<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useApiCall<T, Args extends unknown[]>(
  apiFn: (...args: Args) => Promise<ApiResult<T>>,
  options: Options<T> = {}
) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, isLoading: false });
  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const execute = useCallback(
    async (...args: Args) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ data: null, error: null, isLoading: true });

      const response = await (apiFn as unknown as (
        ...allArgs: [...Args, AbortSignal?]
      ) => Promise<ApiResult<T>>)(
        ...args,
        controller.signal
      );

      if (isError(response)) {
        setState({ data: null, error: response.error ?? null, isLoading: false });
        const currentOptions = optionsRef.current;
        if (currentOptions.showErrorToast !== false) {
          showError(response.error ?? 'Unexpected error', response.statusCode, response.errorCode);
        }
        currentOptions.onError?.(response);
        return null;
      }

      setState({ data: response.data, error: null, isLoading: false });
      optionsRef.current.onSuccess?.(response.data);
      return response.data;
    },
    [apiFn]
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { ...state, execute, reset };
}
