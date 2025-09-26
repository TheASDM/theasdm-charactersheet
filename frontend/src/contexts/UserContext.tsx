import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string | null;
  isDm: boolean;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get or create a default user on app load
    const initializeUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/auth/default-user');
        if (!response.ok) {
          throw new Error('Failed to get user');
        }

        const data = await response.json();
        setUser(data.user);

        console.log('👤 User initialized:', data.user.username);

      } catch (err) {
        console.error('Failed to initialize user:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize user');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const value: UserContextType = {
    user,
    loading,
    error,
    setUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};