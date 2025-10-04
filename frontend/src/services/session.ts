import { setAuthTokenGetter } from '@/services/api';

let memoryToken: string | null = null;

const readLocalStorageToken = (): string | null => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      return window.localStorage.getItem('authToken');
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
};

export const getSessionToken = (): string | null => {
  return memoryToken ?? readLocalStorageToken();
};

export const setSessionToken = (token: string | null) => {
  memoryToken = token;

  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      if (token) {
        window.localStorage.setItem('authToken', token);
      } else {
        window.localStorage.removeItem('authToken');
      }
    }
  } catch {
    // Ignore storage access errors
  }
};

setAuthTokenGetter(() => getSessionToken());
