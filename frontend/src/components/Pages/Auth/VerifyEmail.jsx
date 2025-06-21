import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FiCheck, FiAlertTriangle, FiMail, FiClock, FiZap } from 'react-icons/fi';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { verifyOTP, resendOTP } = useAuth();
  const location = useLocation();
  const { email, newRegistration } = location.state || {};
  const navigate = useNavigate();

  console.log('🔍 VerifyEmail component loaded with:', { email, newRegistration });

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setError('');
      console.log('🔍 Submitting OTP verification:', { email, otp });
      
      const result = await verifyOTP({ email, otp });
      console.log('✅ OTP verification result:', result);
      
      if (result.success) {
        setStatus('verified');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError('Invalid or expired OTP');
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      console.log('📧 Resending OTP to:', email);
      
      await resendOTP({ email });
      setStatus('resent');
      setCountdown(60);
      setTimeout(() => setStatus('pending'), 3000);
    } catch (err) {
      console.error('❌ Resend OTP error:', err);
      setError('Failed to resend OTP');
    }
  };

  if (!email) {
    return (
      <div className="verify-email-scroll-center-root">
        <div className="verify-email-scroll-center-card">
          <div className="auth-header">
            <div className="auth-logo">
              <FiZap className="auth-logo-icon" />
              <span className="auth-logo-text">Energy Exchange</span>
            </div>
            <div className="auth-title">Verification Required</div>
            <div className="auth-subtitle">No email address provided</div>
          </div>
          
          <div className="error-message">
            <FiAlertTriangle className="error-icon" />
            No email address provided. Please register again.
          </div>
          
          <button 
            onClick={() => navigate('/register')}
            className="auth-button primary"
          >
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-email-scroll-center-root">
      <div className="verify-email-scroll-center-card">
        <div className="auth-header">
          <div className="auth-logo">
            <FiZap className="auth-logo-icon" />
            <span className="auth-logo-text">Energy Exchange</span>
          </div>
          <div className="auth-title">Verify Your Email</div>
          <div className="auth-subtitle">Enter the 6-digit code sent to your email</div>
        </div>

        {status === 'verified' ? (
          <div className="success-message">
            <FiCheck className="success-icon" />
            <div>Email Verified! Redirecting to dashboard...</div>
          </div>
        ) : (
          <>
            {error && (
              <div className="error-message">
                <FiAlertTriangle className="error-icon" /> {error}
              </div>
            )}

            {status === 'resent' && (
              <div className="info-message">
                <FiCheck />
                <span>New code sent successfully!</span>
              </div>
            )}

            <div className="email-display-label">
              <FiMail />
              <span>Code sent to: {email}</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
              <div className="form-group">
                <label htmlFor="otp" className="form-label">Verification Code</label>
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
                disabled={!otp || otp.length !== 6}
              >
                Verify Email
              </button>
            </form>

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
                  <FiClock />
                  <span>Resend in {countdown}s</span>
                </span>
              ) : (
                'Resend OTP'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
