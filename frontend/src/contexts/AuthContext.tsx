import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import authService, { User, AuthSession, RegisterData, LoginData } from '../services/authService';
import { ApiResult, isError } from '@/types/api';
import { showError } from '@/utils/errorDisplay';
import { setSessionToken, getSessionToken } from '@/services/session';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  beginDiscordLogin: (redirectPath?: string) => void;
  completeOAuthLogin: (token: string) => Promise<ApiResult<User>>;
  register: (data: RegisterData) => Promise<ApiResult<AuthSession>>;
  login: (data: LoginData) => Promise<ApiResult<AuthSession>>;
  logout: () => Promise<ApiResult<void>>;
  refreshUser: () => Promise<ApiResult<User> | null>;
  applySession: (session: AuthSession) => void;
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

  const beginDiscordLogin = useCallback((redirectPath?: string) => {
    // Build the final frontend destination path (where user should land after OAuth)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const finalPath = redirectPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/characters');
    const frontendDestination = `${origin}/auth/discord/callback?next=${encodeURIComponent(finalPath)}`;

    // Get the backend OAuth URL and pass the frontend destination as redirectTo
    const loginUrl = authService.getDiscordLoginUrl(frontendDestination);
    if (typeof window !== 'undefined') {
      window.location.href = loginUrl;
    }
  }, []);

  const completeOAuthLogin = useCallback(
    async (token: string): Promise<ApiResult<User>> => {
      setIsLoading(true);
      try {
        setSessionToken(token);
        const result = await authService.getCurrentUser();
        if (isError(result)) {
          showError(result.error ?? 'Failed to load user', result.statusCode, result.errorCode);
          setSessionToken(null);
          setUser(null);
          return result;
        }
        setUser(result.data);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
    beginDiscordLogin,
    completeOAuthLogin,
    register,
    login,
    logout,
    refreshUser,
    applySession: handleSessionSuccess,
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
