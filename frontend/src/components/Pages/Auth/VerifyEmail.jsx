import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AuthLayout from './AuthLayout';
import { FiCheck, FiAlertTriangle, FiMail } from 'react-icons/fi';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const { verifyOTP, resendOTP } = useAuth();
  const location = useLocation();
  const { email, newRegistration } = location.state || {};
  const navigate = useNavigate();

  // Auto-resend for new registrations
  useEffect(() => {
    if (newRegistration && email) {
      resendOTP({ email }).catch(() => {
        setError('Failed to send initial OTP');
      });
    }
  }, [email, newRegistration, resendOTP]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await verifyOTP({ email, otp });
      if (result.success) {
        setStatus('verified');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError('Invalid or expired OTP');
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP({ email });
      setError('');
      setStatus('resent');
    } catch (err) {
      setError('Failed to resend OTP');
    }
  };

  return (
    <AuthLayout>
      {status === 'verified' ? (
        <div className="success-message">
          <FiCheck className="success-icon" />
          Email verified! Redirecting to dashboard...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="auth-header">
            <FiMail className="auth-icon" />
            <h2>Verify Your Email</h2>
            <p>Enter the 6-digit code sent to {email}</p>
          </div>

          <div className="form-group">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter verification code"
              className="otp-input"
              inputMode="numeric"
              pattern="\d{6}"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <FiAlertTriangle className="error-icon" /> {error}
            </div>
          )}

          <button type="submit" className="auth-button primary">
            Verify Email
          </button>

          <div className="auth-footer">
            Didn't receive the code?{' '}
            <button type="button" onClick={handleResend} className="link-button">
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
