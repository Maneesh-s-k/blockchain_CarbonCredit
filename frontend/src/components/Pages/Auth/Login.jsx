import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../../../services/authService';
import { FiMail, FiLock, FiEye, FiEyeOff, FiZap, FiAlertTriangle } from 'react-icons/fi';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const { login, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
    // Only clear error on mount
    // clearError();
    // eslint-disable-next-line
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) clearError();
    if (googleError) setGoogleError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData);
    } catch (err) {
      // error is handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setGoogleError('');
    try {
      const result = await authService.googleAuth(response.credential);
      if (result.success) navigate('/dashboard');
      else setGoogleError(result.message || "Google authentication failed");
    } catch (error) {
      setGoogleError('Google authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-emerald-900">
      <div className="auth-container glassmorphism">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <FiZap className="auth-logo-icon text-3xl text-emerald-400" />
              <h1 className="auth-logo-text">Energy Exchange</h1>
            </div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your energy trading account</p>
          </div>

          {/* Error Message */}
          {(error || googleError) && (
            <div className="error-message">
              <FiAlertTriangle className="error-icon" />
              <span>{error || googleError}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="energy@trader.com"
                  style={{ paddingLeft: "2.5rem" }} // Add padding for icon
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper" style={{ position: "relative" }}>
                <FiLock className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }} // Add padding for icons
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Form Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-button primary"
            >
              {isLoading ? (
                <div className="button-loading">
                  <div className="spinner-small"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Social Login Divider */}
            <div className="auth-divider">
              <span>Or continue with</span>
            </div>

            {/* Google Sign-In */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                theme="filled_black"
                size="large"
                shape="pill"
                width={300}
                onSuccess={handleGoogleSuccess}
                onError={() => setGoogleError('Google authentication failed')}
                useOneTap
                logo_alignment="center"
                text="signin_with"
              />
            </div>

            {/* Registration Prompt */}
            <div className="auth-footer">
              <p>
                New to Energy Exchange?{' '}
                <Link to="/register" className="auth-link">
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
