import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../../../services/authService';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';

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
  const { setUser, setIsAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
    document.body.classList.add('auth-noscroll');
    return () => document.body.classList.remove('auth-noscroll');
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    console.log('🟢 [GoogleLogin] Google response:', response);
    try {
      const result = await authService.googleAuth(response.credential);
      console.log('🟢 [GoogleLogin] Backend response:', result);
      if (result.success) {
        // Store token
        localStorage.setItem('token', result.tokens.accessToken);
        // Update auth state if you use context
        setUser(result.user);
        setIsAuthenticated(true);
        // Now navigate
        navigate('/dashboard');
      } else {
        setGoogleError(result.message || "Google authentication failed");
        console.error('🔴 [GoogleLogin] Backend error:', result.message);
      }
    } catch (err) {
      setGoogleError('Google authentication failed');
      console.error('🔴 [GoogleLogin] Exception:', err);
    }
  };

  return (
    <div className="login-scroll-center-root">
      {/* Left: Scrollable login form */}
      <div className="login-scroll-center-left">
        <div className="login-scroll-center-card">
          <div className="auth-header" style={{ marginBottom: '1rem' }}>
            <p className="auth-subtitle" style={{ marginBottom: 0, textAlign: 'left' }}>
              Sign in to your energy trading account
            </p>
          </div>
          
          {(error || googleError) && (
            <div className="error-message">
              <FiAlertTriangle className="error-icon" />
              <span>{error || googleError}</span>
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '0.9rem' }}>
            <div className="form-group" style={{ gap: '0.25rem' }}>
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
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>
            
            <div className="form-group" style={{ gap: '0.25rem' }}>
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
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
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
            
            <div className="form-options" style={{ marginTop: '0.2rem', marginBottom: '0.2rem' }}>
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
            
            <div className="auth-divider">
              <span>Or continue with</span>
            </div>
            
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
            
            <div className="auth-footer" style={{ marginTop: '0.8rem' }}>
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
      
      {/* Right: App info & animated circuit design */}
      <div className="login-scroll-center-right">
        <div className="auth-circuit-bg" />
        <div className="auth-app-info">
          <h2 style={{ color: '#00ffff', marginBottom: '0.7rem', fontWeight: 700, fontSize: '1.6rem' }}>
            Energy Exchange
          </h2>
          <p>
            <b>Trade renewable energy credits</b> on a secure, transparent, and decentralized marketplace.
          </p>
          <p>
            <b>Powered by blockchain</b> and enhanced with <span style={{color:'#00ffff'}}>ZKsnarks security</span>.
          </p>
          <ul>
            <li>Real-time analytics</li>
            <li>Zero-knowledge proofs</li>
            <li>Wallet integration</li>
            <li>Green energy rewards</li>
          </ul>
          <p>
            <span style={{color:'#00ffff'}}>Your energy. Your future.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
