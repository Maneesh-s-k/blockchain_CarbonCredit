import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiZap, FiAlertTriangle, FiCheck, FiClock } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import PasswordStrength from './PasswordStrength';

export default function ResetPassword() {
  const [step, setStep] = useState('otp');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resetToken, setResetToken] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  const { verifyPasswordResetOTP, resetPassword, resendPasswordResetOTP } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  
  const email = location.state?.email || new URLSearchParams(location.search).get('email');

  useEffect(() => {
    if (token) {
      console.log('🔑 Using token from URL params:', token.substring(0, 10) + '...');
      setResetToken(token);
      setStep('password');
    }
  }, [token]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Password validation
  const validatePassword = (password) => {
    let errors = {};
    
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    return errors;
  };

  const validateConfirmPassword = (confirm, original) => {
    if (confirm !== original) {
      return { confirmPassword: 'Passwords do not match' };
    }
    return {};
  };

  // Update validation on password change
  useEffect(() => {
    if (newPassword) {
      const passwordErrors = validatePassword(newPassword);
      const confirmErrors = confirmPassword ? validateConfirmPassword(confirmPassword, newPassword) : {};
      setValidationErrors({ ...passwordErrors, ...confirmErrors });
    } else {
      setValidationErrors({});
    }
  }, [newPassword, confirmPassword]);

  // ✅ FIXED: Handle OTP submission with proper token capture
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔍 Submitting OTP verification:', { email, otp });
      const result = await verifyPasswordResetOTP({ email, otp });
      console.log('✅ OTP verification result:', result);
      
      if (result.success) {
        console.log('🔑 Received reset token:', result.resetToken?.substring(0, 10) + '...');
        setResetToken(result.resetToken);
        setStep('password');
        setError(''); // Clear any previous errors
      } else {
        setError(result.message || 'Invalid or expired reset code');
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError(err.message || 'Invalid or expired reset code');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Handle password submission with validation
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submitting
    const passwordErrors = validatePassword(newPassword);
    const confirmErrors = validateConfirmPassword(confirmPassword, newPassword);
    const allErrors = { ...passwordErrors, ...confirmErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      return;
    }

    if (!resetToken) {
      setError('Reset token is missing. Please start the password reset process again.');
      return;
    }
    
    const requestData = { 
      token: resetToken, 
      newPassword 
    };
    
    console.log('🔍 Frontend: Submitting password reset with data:', {
      token: resetToken ? 'Present' : 'Missing',
      newPassword: newPassword ? 'Present' : 'Missing',
      tokenLength: resetToken?.length,
      passwordLength: newPassword?.length
    });

    setIsLoading(true);
    setError('');

    try {
      const result = await resetPassword(requestData);
      console.log('✅ Frontend: Password reset successful:', result);
      
      if (result.success) {
        setStep('success');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('❌ Frontend: Password reset error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      console.log('📧 Resending password reset OTP to:', email);
      await resendPasswordResetOTP({ email });
      setCountdown(60);
      // Show success message briefly
      const originalError = error;
      setError('');
      setTimeout(() => {
        if (!error) { // Only show if no other error occurred
          console.log('✅ Password reset OTP resent successfully');
        }
      }, 100);
    } catch (err) {
      console.error('❌ Failed to resend password reset OTP:', err);
      setError('Failed to resend code');
    }
  };

  // Success state
  if (step === 'success') {
    return (
      <div className="reset-password-scroll-center-root">
        <div className="reset-password-scroll-center-card">
          <div className="success-message">
            <FiCheck className="success-icon" />
            <div>Password reset successfully! Redirecting to login...</div>
          </div>
        </div>
      </div>
    );
  }

  // No email provided
  if (!email && !token) {
    return (
      <div className="reset-password-scroll-center-root">
        <div className="reset-password-scroll-center-card">
          <div className="auth-header">
            <div className="auth-logo">
              <FiZap className="auth-logo-icon" />
              <span className="auth-logo-text">Energy Exchange</span>
            </div>
            <div className="auth-title">Invalid Reset Link</div>
            <div className="auth-subtitle">This password reset link is invalid or expired</div>
          </div>
          
          <div className="error-message">
            <FiAlertTriangle className="error-icon" />
            No email provided. Please start the password reset process again.
          </div>
          
          <Link to="/forgot-password" className="auth-button primary">
            Start Password Reset
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-scroll-center-root">
      <div className="reset-password-scroll-center-card">
        <div className="auth-header">
          <div className="auth-logo">
            <FiZap className="auth-logo-icon" />
            <span className="auth-logo-text">Energy Exchange</span>
          </div>
          <div className="auth-title">
            {step === 'otp' ? 'Enter Reset Code' : 'Set New Password'}
          </div>
          <div className="auth-subtitle">
            {step === 'otp' 
              ? 'Enter the 6-digit code sent to your email' 
              : 'Choose a strong new password'
            }
          </div>
        </div>

        {error && (
          <div className="error-message">
            <FiAlertTriangle className="error-icon" /> {error}
          </div>
        )}

        {step === 'otp' ? (
          <form onSubmit={handleOTPSubmit} className="auth-form">
            <div className="email-display-label">
              Reset code sent to: {email}
            </div>

            <div className="form-group">
              <label htmlFor="otp" className="form-label">Reset Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="otp"
                  id="otp"
                  className="form-input otp-input"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength="6"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={!otp || otp.length !== 6 || isLoading}
            >
              {isLoading ? (
                <span className="button-loading">
                  <span className="spinner-small" /> Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="auth-divider">
              <span>Didn't receive the code?</span>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="auth-button secondary"
            >
              {countdown > 0 ? (
                <span className="button-loading">
                  <FiClock style={{ marginRight: '8px' }} />
                  Resend in {countdown}s
                </span>
              ) : (
                'Resend Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  id="newPassword"
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
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
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <div className="field-error">{validationErrors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={isLoading || !newPassword || !confirmPassword || Object.keys(validationErrors).length > 0}
            >
              {isLoading ? (
                <span className="button-loading">
                  <span className="spinner-small" /> Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>Remember your password?</span>
        </div>

        <Link to="/login" className="auth-button secondary">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
