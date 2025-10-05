import { ApiErrorCode } from '@/types/api';
import { logger } from './logger';
import { toastBus, ToastPayload } from './toastBus';

const iconForCode = (code?: ApiErrorCode) => {
  switch (code) {
    case 'validation':
      return '⚠️';
    case 'auth':
      return '🔒';
    case 'not_found':
      return '🔍';
    case 'network_error':
      return '📡';
    case 'timeout':
      return '⌛';
    case 'rate_limited':
      return '⏱️';
    case 'server_error':
      return '💥';
    default:
      return '❌';
  }
};

export const showError = (message: string, statusCode?: number, code?: ApiErrorCode) => {
  // Don't show toasts for cancelled requests (499 = client closed request)
  if (statusCode === 499) {
    return;
  }

  const payload: ToastPayload = { type: 'error', message };
  if (statusCode !== undefined) {
    payload.statusCode = statusCode;
  }
  if (code) {
    payload.code = code;
  }
  toastBus.emit(payload);
  logger.error(`${iconForCode(code)}  ${message}`, { statusCode, code });
};

export const showSuccess = (message: string) => {
  const payload: ToastPayload = { type: 'success', message };
  toastBus.emit(payload);
  logger.info(`✅  ${message}`);
};
