import type { FC, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { User as AuthUser } from '../services/authService';
import { logger } from '../utils/logger';

type User = AuthUser | null;

type UserContextValue = {
  user: User;
  loading: boolean;
  error: string | null;
  setUser: (user: User) => void;
};

/**
 * Temporary bridge while the app transitions away from the legacy UserContext.
 * It simply proxies data from AuthContext so existing consumers keep working
 * without hitting the insecure default-user endpoint.
 */
export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => (
  <>{children}</>
);

export const useUser = (): UserContextValue => {
  const { user, isLoading } = useAuth();

  return {
    user,
    loading: isLoading,
    error: null,
    setUser: () => {
      logger.warn('setUser is deprecated. Use AuthProvider for authentication state.');
    },
  };
};