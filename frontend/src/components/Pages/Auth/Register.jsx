import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone, 
  FiCreditCard,
  FiEye, 
  FiEyeOff,
  FiZap,
  FiAlertTriangle
} from 'react-icons/fi';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    walletAddress: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (!formData.agreeToTerms) {
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, agreeToTerms, ...registrationData } = formData;
      await register(registrationData);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'strength-weak';
    if (passwordStrength <= 3) return 'strength-medium';
    return 'strength-strong';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="auth-container">
        <div className="auth-card register-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-icon"><FiZap /></span>
              <h1 className="auth-logo-text">Energy Trading</h1>
            </div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join the future of energy trading</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span className="error-icon"><FiAlertTriangle /></span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiUser /></span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Choose username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiMail /></span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter email"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password *
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><FiLock /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Create password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className={`strength-text ${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password *
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><FiLock /></span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'input-error'
                      : ''
                  }`}
                  placeholder="Confirm password"
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="field-error">Passwords do not match</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone (Optional)
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiPhone /></span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="walletAddress" className="form-label">
                  Wallet (Optional)
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiCreditCard /></span>
                  <input
                    id="walletAddress"
                    name="walletAddress"
                    type="text"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0x..."
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  required
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  I agree to the{' '}
                  <Link to="/terms" className="link-text">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="link-text">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || formData.password !== formData.confirmPassword || !formData.agreeToTerms}
              className="auth-button primary"
            >
              {isLoading ? (
                <div className="button-loading">
                  <div className="spinner-small"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <Link to="/login" className="auth-button secondary">
              Sign In
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
