import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';


export default function ProtectedRoute({ children, requireEmailVerification = false }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
    
  const token = localStorage.getItem('token');

  // loading spinner
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireEmailVerification && !user?.isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}
