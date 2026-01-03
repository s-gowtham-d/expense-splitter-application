import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { api, tokenManager } from '@/api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const token = tokenManager.getToken();
      if (token) {
        try {
          const response = await api.auth.getMe();
          setUser(response.user);
        } catch (error) {
          // Token is invalid, remove it
          tokenManager.removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    tokenManager.setToken(response.token);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.auth.register({ name, email, password });
    tokenManager.setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
