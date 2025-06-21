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
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Unified login handler
  const handleAuthSuccess = (response) => {
    localStorage.setItem('token', response.tokens.accessToken);
    if (response.tokens.refreshToken) {
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
    }
    setUser(response.user);
    setIsAuthenticated(true);
    setError('');
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

  // ✅ FIXED: Registration - does NOT log in user
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.register(userData);
      // ✅ CRITICAL: Do NOT log in user here; just return response
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
    localStorage.removeItem('refreshToken');
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

  // ✅ FIXED: OTP verification - logs in user AFTER verification
  const verifyOTP = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.verifyOTP(data);
      if (response.success) {
        // ✅ ONLY log in user after successful OTP verification
        handleAuthSuccess(response);
      }
      return response;
    } catch (error) {
      setError(error.message || 'OTP verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Resend OTP method - proper parameter handling
  const resendOTP = async (data) => {
    try {
      setError('');
      const response = await apiService.sendOTP(data);
      return response;
    } catch (error) {
      setError(error.message || 'Failed to resend OTP');
      throw error;
    }
  };

  // ✅ NEW: Password reset methods
  const forgotPassword = async (email) => {
    try {
      setError('');
      const response = await apiService.forgotPassword(email);
      return response;
    } catch (error) {
      setError(error.message || 'Failed to send reset code');
      throw error;
    }
  };

  const verifyPasswordResetOTP = async (data) => {
    try {
      setError('');
      const response = await apiService.verifyPasswordResetOTP(data);
      return response;
    } catch (error) {
      setError(error.message || 'Invalid reset code');
      throw error;
    }
  };

  const resetPassword = async (data) => {
    try {
      setError('');
      const response = await apiService.resetPassword(data);
      return response;
    } catch (error) {
      setError(error.message || 'Failed to reset password');
      throw error;
    }
  };

  const resendPasswordResetOTP = async (data) => {
    try {
      setError('');
      const response = await apiService.resendPasswordResetOTP(data);
      return response;
    } catch (error) {
      setError(error.message || 'Failed to resend code');
      throw error;
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
    verifyOTP,
    resendOTP,
    setUser,
    setIsAuthenticated,
    // ✅ NEW: Password reset methods added
    forgotPassword,
    verifyPasswordResetOTP,
    resetPassword,
    resendPasswordResetOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
