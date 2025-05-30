import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiLock, 
  FiEye, 
  FiEyeOff,
  FiZap,
  FiAlertTriangle,
  FiCheck
} from 'react-icons/fi';

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [validationErrors, setValidationErrors] = useState({});

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Verify token validity
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/auth/verify-reset-token/${token}`);
      const data = await response.json();
      
      if (!data.success) {
        setIsTokenValid(false);
        setError('Invalid or expired reset token');
      }
    } catch (error) {
      setIsTokenValid(false);
      setError('Failed to verify reset token');
    }
  };

  const checkPasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('One lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('One uppercase letter');

    if (/\d/.test(password)) score += 1;
    else feedback.push('One number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('One special character');

    return { score, feedback };
  };

  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else {
          const strength = checkPasswordStrength(value);
          setPasswordStrength(strength);
          if (strength.score < 3) {
            errors.password = 'Password is too weak';
          } else {
            delete errors.password;
          }
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    validateField(name, value);

    if (name === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1: return '#ef4444';
      case 2: return '#f59e0b';
      case 3: return '#3b82f6';
      case 4:
      case 5: return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful! Please sign in with your new password.' 
          }
        });
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="error-icon">
                <FiAlertTriangle />
              </div>
              <h2 className="auth-title">Invalid Reset Link</h2>
              <p className="auth-subtitle">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <div className="auth-form">
              <Link to="/forgot-password" className="auth-button primary">
                Request New Reset Link
              </Link>
              
              <Link to="/login" className="auth-button secondary">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-icon"><FiZap /></span>
              <h1 className="auth-logo-text">Energy Trading</h1>
            </div>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">Enter your new password</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span className="error-icon"><FiAlertTriangle /></span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password" className="form-label">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiLock /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Enter your new password"
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
                      className="strength-fill"
                      style={{ 
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                  <div className="strength-text">
                    <span style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="strength-feedback">
                      <span>Missing:</span>
                      <ul>
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {validationErrors.password && (
                <span className="error-text">{validationErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiLock /></span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
                {!validationErrors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <span className="input-success"><FiCheck /></span>
                )}
              </div>
              {validationErrors.confirmPassword && (
                <span className="error-text">{validationErrors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || Object.keys(validationErrors).length > 0}
              className="auth-button primary"
            >
              {isLoading ? (
                <div className="button-loading">
                  <div className="spinner-small"></div>
                  <span>Resetting...</span>
                </div>
              ) : (
                <span>Reset Password</span>
              )}
            </button>

            <Link to="/login" className="auth-button secondary">
              Back to Sign In
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
