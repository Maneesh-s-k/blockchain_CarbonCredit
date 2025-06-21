import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiZap, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import PasswordStrength from './PasswordStrength';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Field validation logic
  const validateField = (name, value) => {
    let errors = { ...validationErrors };
    switch (name) {
      case 'username':
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(value))
          errors.username = '3-30 chars, letters/numbers/_ only';
        else delete errors.username;
        break;
      case 'email':
        if (!/^\S+@\S+\.\S+$/.test(value))
          errors.email = 'Invalid email format';
        else delete errors.email;
        break;
      case 'password':
        if (value.length < 6)
          errors.password = 'Minimum 6 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          errors.password = 'Requires upper, lower, and number';
        else delete errors.password;
        break;
      case 'confirmPassword':
        if (value !== formData.password)
          errors.confirmPassword = 'Passwords do not match';
        else delete errors.confirmPassword;
        break;
      case 'acceptTerms':
        if (!value)
          errors.acceptTerms = 'You must accept terms';
        else delete errors.acceptTerms;
        break;
      default:
        break;
    }
    setValidationErrors(errors);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    validateField(name, fieldValue);
    if (error) clearError();
  };

  // ✅ CRITICAL FIX: Handle registration form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    Object.entries(formData).forEach(([name, value]) => validateField(name, value));
    if (Object.keys(validationErrors).length > 0) return;
    
    setIsLoading(true);
    
    try {
      console.log('🚀 Starting registration process...');
      
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      console.log('📝 Registration result:', result);
      
      if (result.success) {
        console.log('✅ Registration successful, navigating to verify-email...');
        
        // ✅ IMMEDIATE NAVIGATION - No delay, no success state
        navigate('/verify-email', { 
          state: { 
            email: formData.email, 
            newRegistration: true 
          },
          replace: true // Prevent going back to registration
        });
      } else {
        console.error('❌ Registration failed:', result.message);
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-scroll-center-root">
      <div className="register-scroll-center-card">
        <div className="auth-header">
          <div className="auth-logo">
            <FiZap className="auth-logo-icon" />
            <span className="auth-logo-text">Energy Exchange</span>
          </div>
          <div className="auth-title">Create Account</div>
          <div className="auth-subtitle">Join the renewable energy marketplace</div>
        </div>

        {error && (
          <div className="error-message">
            <FiAlertTriangle className="error-icon" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="username"
                id="username"
                className={`form-input${validationErrors.username ? ' error' : ''}`}
                placeholder="energy_trader_01"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            {validationErrors.username && (
              <div className="field-error">{validationErrors.username}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                id="email"
                className={`form-input${validationErrors.email ? ' error' : ''}`}
                placeholder="user@energy.io"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            {validationErrors.email && (
              <div className="field-error">{validationErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                className={`form-input${validationErrors.password ? ' error' : ''}`}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <PasswordStrength password={formData.password} />
            {validationErrors.password && (
              <div className="field-error">{validationErrors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                className={`form-input${validationErrors.confirmPassword ? ' error' : ''}`}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <div className="field-error">{validationErrors.confirmPassword}</div>
            )}
          </div>

          <div className="form-group form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acceptTerms"
                className="checkbox-input"
                checked={formData.acceptTerms}
                onChange={handleChange}
                required
              />
              <span className="checkbox-text">
                I agree to the <Link to="/terms" className="link-text">Terms of Service</Link>
              </span>
            </label>
            {validationErrors.acceptTerms && (
              <div className="field-error">{validationErrors.acceptTerms}</div>
            )}
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading || Object.keys(validationErrors).length > 0}
          >
            {isLoading ? (
              <span className="button-loading">
                <span className="spinner-small" /> Creating Account...
              </span>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>
        <Link to="/login" className="auth-button secondary">
          Sign In Instead
        </Link>
      </div>
    </div>
  );
}
