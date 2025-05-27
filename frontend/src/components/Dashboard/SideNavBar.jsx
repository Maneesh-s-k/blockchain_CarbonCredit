import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SideNavBar() {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    { icon: '⚡', label: 'Energy Exchange', path: '/energy-exchange' },
    { icon: '📊', label: 'History', path: '/history' },
    { icon: '💳', label: 'Payments', path: '/payments' },
    { icon: '🔧', label: 'Register Device', path: '/register-device' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  const handleNavClick = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav 
      className={`side-navbar ${isHovered ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo section */}
      <div className="nav-logo">
        <div className="logo-icon">⚡</div>
        <h1 className={`logo-text ${isHovered ? 'visible' : 'hidden'}`}>
          Energy Trading
        </h1>
      </div>

      {/* Navigation menu */}
      <div className="nav-menu">
        {navItems.map((item, index) => (
          <div
            key={index}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
          >
            <div className="nav-icon">{item.icon}</div>
            <span className={`nav-label ${isHovered ? 'visible' : 'hidden'}`}>
              {item.label}
            </span>
            {!isHovered && (
              <div className="tooltip">{item.label}</div>
            )}
          </div>
        ))}
      </div>

      {/* User section at bottom */}
      <div className="nav-user-section">
        <div className="nav-divider"></div>
        
        {/* Profile */}
        <div 
          className="nav-item user-profile"
          onClick={() => navigate('/profile')}
        >
          <div className="nav-icon">👤</div>
          <span className={`nav-label ${isHovered ? 'visible' : 'hidden'}`}>
            {user?.username || 'Profile'}
          </span>
          {!isHovered && (
            <div className="tooltip">Profile</div>
          )}
        </div>

        {/* Logout */}
        <div 
          className="nav-item logout-item"
          onClick={handleLogout}
        >
          <div className="nav-icon">🚪</div>
          <span className={`nav-label ${isHovered ? 'visible' : 'hidden'}`}>
            Logout
          </span>
          {!isHovered && (
            <div className="tooltip">Logout</div>
          )}
        </div>
      </div>
    </nav>
  );
}
