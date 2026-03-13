import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials, AuthToken } from '../interfaces';
import { authAPI } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterCredentials) => Promise<void>;
  logout: () => void;
  error: string | null;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await authAPI.getUserProfile();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      localStorage.removeItem('token');
      setError('Session expired, please login again');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to allow refreshing the profile from other components
  const refreshUserProfile = async () => {
    return await fetchUserProfile();
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const authResponse: AuthToken = await authAPI.login(credentials);
      localStorage.setItem('token', authResponse.access_token);
      await fetchUserProfile();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterCredentials) => {
    try {
      setIsLoading(true);
      await authAPI.register(userData);
      await login({
        username: userData.username,
        password: userData.password
      });
      setError(null);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
        refreshUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 