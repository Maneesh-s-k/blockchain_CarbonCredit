import api from './apiService';

/**
 * AuthService handles all authentication-related API calls.
 * Uses a shared API service instance from apiService.js.
 */
export const authService = {
  // Register a new user
  register: async (userData) => {
    return api.register(userData);
  },

  // Login with email and password
  login: async (credentials) => {
    return api.login(credentials);
  },

  // Logout the current user
  logout: async () => {
    return api.logout();
  },

  // Get the current authenticated user
  getCurrentUser: async () => {
    return api.getProfile();
  },

  // Verify email using a token
  verifyEmail: async (token) => {
    return api.verifyEmail(token);
  },

  // Send phone verification code
  sendPhoneVerification: async (phone) => {
    return api.sendPhoneVerification(phone);
  },

  // Verify phone with code
  verifyPhone: async (code) => {
    return api.verifyPhone(code);
  },

  // Request password reset email
  forgotPassword: async (email) => {
    return api.forgotPassword(email);
  },

  // Reset password using token
  resetPassword: async (token, password) => {
    return api.resetPassword(token, password);
  },

  // Change password for authenticated user
  changePassword: async (passwords) => {
    return api.changePassword(passwords);
  },

  // Register with email verification (if separate endpoint)
  registerWithVerification: async (userData) => {
    return api.registerWithVerification(userData);
  },

  // Send a new verification email
  sendVerificationEmail: async () => {
    return api.sendVerificationEmail();
  },

  // Verify OTP code (for email/phone)
  verifyOTP: async (otp) => {
    return api.verifyOTP(otp);
  },

  // Google OAuth login
  googleAuth: async (credential) => {
    return api.googleAuth(credential);
  },

  // Resend OTP code
  resendOTP: async () => {
    return api.resendOTP();
  },

  // Send OTP to email
  sendOTP: async (email) => {
    return api.sendOTP(email);
  }
};
