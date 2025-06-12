import api from './apiService';

/**
 * AuthService handles all authentication-related API calls.
 * Uses a shared Axios instance from apiService.js.
 */
export const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login with email and password
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout the current user
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get the current authenticated user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Verify email using a token
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Send phone verification code
  sendPhoneVerification: async (phone) => {
    const response = await api.post('/auth/send-phone-verification', { phone });
    return response.data;
  },

  // Verify phone with code
  verifyPhone: async (code) => {
    const response = await api.post('/auth/verify-phone', { code });
    return response.data;
  },

  // Request password reset email
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password using token
  resetPassword: async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  // Change password for authenticated user
  changePassword: async (passwords) => {
    const response = await api.post('/auth/change-password', passwords);
    return response.data;
  },

  // Register with email verification (if separate endpoint)
  registerWithVerification: async (userData) => {
    const response = await api.post('/auth/register-with-verification', userData);
    return response.data;
  },

  // Send a new verification email
  sendVerificationEmail: async () => {
    const response = await api.post('/auth/send-verification-email');
    return response.data;
  },

  // Verify OTP code (for email/phone)
  verifyOTP: async (otp) => {
    const response = await api.post('/auth/verify-otp', { otp });
    return response.data;
  },

  // Google OAuth login
  googleAuth: async (credential) => {
    const response = await api.post('/auth/google', { credential });
    return response.data;
  },

  // Resend OTP code
  resendOTP: async () => {
    const response = await api.post('/auth/resend-otp');
    return response.data;
  }
};
