import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';

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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const clearError = () => {
    setError('');
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await apiService.getProfile();
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

  // Unified login handler
  const handleAuthSuccess = (response) => {
    localStorage.setItem('token', response.tokens.accessToken);
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const login = async (formData) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.login(formData);
      if (response.success) {
        handleAuthSuccess(response);
      }
      return response;
    } catch (error) {
      setError(error.message || 'Login failed');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.register(userData);
      if (response.success) {
        handleAuthSuccess(response);
      }
      return response;
    } catch (error) {
      setError(error.message || 'Registration failed');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setError('');
    navigate('/login');
  };

  const verifyEmail = async (token) => {
    try {
      const response = await apiService.verifyEmail(token);
      if (response.success) {
        checkAuthStatus();
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    try {
      return await apiService.resendVerificationEmail();
    } catch (error) {
      throw error;
    }
  };

  const googleLogin = async (credential) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.googleAuth(credential);
      if (response.success) {
        handleAuthSuccess(response);
      }
      return response;
    } catch (error) {
      setError(error.message || 'Google authentication failed');
      return { success: false };
    } finally {
      setIsLoading(false);
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
    clearError,
    checkAuthStatus,
    verifyEmail,
    resendVerificationEmail,
    googleLogin,
    setUser,
    setIsAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
