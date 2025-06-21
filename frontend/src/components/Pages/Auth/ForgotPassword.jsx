import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiZap, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { email } 
          });
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-scroll-center-root">
      <div className="forgot-password-scroll-center-card">
        <div className="auth-header">
          <div className="auth-logo">
            <FiZap className="auth-logo-icon" />
            <span className="auth-logo-text">Energy Exchange</span>
          </div>
          <div className="auth-title">Reset Password</div>
          <div className="auth-subtitle">Enter your email to receive a reset code</div>
        </div>

        {success ? (
          <div className="success-message">
            Reset code sent! Check your email and redirecting...
          </div>
        ) : (
          <>
            {error && (
              <div className="error-message">
                <FiAlertTriangle className="error-icon" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-button primary"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <span className="button-loading">
                    <span className="spinner-small" /> Sending Code...
                  </span>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>Remember your password?</span>
            </div>

            <Link to="/login" className="auth-button secondary">
              <FiArrowLeft style={{ marginRight: '8px' }} />
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
