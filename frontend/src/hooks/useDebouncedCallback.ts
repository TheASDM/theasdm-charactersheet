import { useCallback, useEffect, useRef } from 'react';

type AnyFunction = (...args: any[]) => void;

type DebouncedFunction<T extends AnyFunction> = T & { cancel: () => void };

export const useDebouncedCallback = <T extends AnyFunction>(
  callback: T,
  delay: number
): DebouncedFunction<T> => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  const debounced = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  return Object.assign(debounced, { cancel });
};
