import { ApiErrorCode } from '@/types/api';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
  type: ToastType;
  message: string;
  statusCode?: number;
  code?: ApiErrorCode;
}

type Listener = (payload: ToastPayload) => void;

const listeners = new Set<Listener>();

export const toastBus = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(payload: ToastPayload) {
    listeners.forEach(listener => listener(payload));
  },
};
