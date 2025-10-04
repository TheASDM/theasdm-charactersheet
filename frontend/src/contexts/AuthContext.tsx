import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import authService, { User, LoginData, RegisterData, AuthSession } from '../services/authService';
import { ApiResult, isError } from '@/types/api';
import { showError } from '@/utils/errorDisplay';
import { setSessionToken, getSessionToken } from '@/services/session';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<ApiResult<AuthSession>>;
  register: (data: RegisterData) => Promise<ApiResult<AuthSession>>;
  logout: () => Promise<ApiResult<void>>;
  refreshUser: () => Promise<ApiResult<User> | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  const handleSessionSuccess = useCallback((session: AuthSession | null) => {
    if (!session) {
      return;
    }
    setSessionToken(session.token);
    setUser(session.user);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (getSessionToken()) {
        const result = await authService.getCurrentUser();
        if (isError(result)) {
          showError(result.error ?? 'Failed to load user', result.statusCode, result.errorCode);
          setSessionToken(null);
          setUser(null);
        } else {
          setUser(result.data);
        }
      }
      setIsLoading(false);
    };

    void loadUser();
  }, []);

  const login = async (data: LoginData): Promise<ApiResult<AuthSession>> => {
    setIsLoading(true);
    try {
      const result = await authService.login(data);
      if (isError(result)) {
        showError(result.error ?? 'Login failed', result.statusCode, result.errorCode);
        return result;
      }
      handleSessionSuccess(result.data);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<ApiResult<AuthSession>> => {
    setIsLoading(true);
    try {
      const result = await authService.register(data);
      if (isError(result)) {
        showError(result.error ?? 'Registration failed', result.statusCode, result.errorCode);
        return result;
      }
      handleSessionSuccess(result.data);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<ApiResult<void>> => {
    setIsLoading(true);
    try {
      const result = await authService.logout();
      if (isError(result)) {
        showError(result.error ?? 'Logout failed', result.statusCode, result.errorCode);
      }
      return result;
    } finally {
      setSessionToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<ApiResult<User> | null> => {
    if (!getSessionToken()) {
      return null;
    }

    const result = await authService.getCurrentUser();
    if (isError(result)) {
      showError(result.error ?? 'Failed to refresh user', result.statusCode, result.errorCode);
      setSessionToken(null);
      setUser(null);
      return result;
    }

    setUser(result.data);
    return result;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
