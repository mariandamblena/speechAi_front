import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types';
import { api } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Use hardcoded user instead of API call
          const hardcodedUser: User = {
            id: '1',
            email: 'admin@speechai.com',
            name: 'Usuario Admin',
            role: 'admin',
            permissions: ['all'],
          };
          
          setAuthState({
            user: hardcodedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, _password: string) => {
    try {
      // Hardcoded authentication - bypass API call
      const hardcodedUser: User = {
        id: '1',
        email: email,
        name: 'Usuario Admin',
        role: 'admin',
        permissions: ['all'],
      };

      const mockToken = 'mock-jwt-token-12345';

      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('refresh_token', 'mock-refresh-token');

      setAuthState({
        user: hardcodedUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      const { access_token } = response.data;
      localStorage.setItem('auth_token', access_token);
      
      setAuthState(prev => ({
        ...prev,
        token: access_token,
      }));
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};