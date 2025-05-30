import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(''); // Add error state

  // Add clearError function
  const clearError = () => {
    setError('');
  };

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await apiClient.getProfile();
        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (formData) => {
    try {
      setIsLoading(true);
      setError(''); // Clear previous errors
      
      const response = await apiClient.login({ 
        email: formData.email, 
        password: formData.password 
      });
      
      if (response.success) {
        localStorage.setItem('token', response.tokens.accessToken);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Network error. Please try again.');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(''); // Clear previous errors
      
      const response = await apiClient.register(userData);
      
      if (response.success) {
        localStorage.setItem('token', response.tokens.accessToken);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Network error. Please try again.');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setError(''); // Clear errors on logout
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    clearError, // Add clearError to the context value
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
