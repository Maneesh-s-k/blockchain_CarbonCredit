import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-container glass-container">
      <div className="auth-card">
        <div className="auth-header">
          <FiZap className="auth-logo-icon" />
          <h2>{title}</h2>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        {children}
        
        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            Already have an account? Sign In
          </Link>
          <span className="auth-divider">|</span>
          <Link to="/register" className="auth-link">
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}
