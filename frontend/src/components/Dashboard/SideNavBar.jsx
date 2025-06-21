import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiZap, 
  FiBarChart2,
  FiCreditCard, 
  FiTool, 
  FiSettings,
  FiUser,
  FiLogOut,
  FiGrid
} from 'react-icons/fi';

export default function SideNavBar() {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: <FiHome />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FiZap />, label: 'Energy Trading', path: '/energy-exchange' },
    { icon: <FiGrid />, label: 'My Devices', path: '/devices' },
    { icon: <FiTool />, label: 'Register Device', path: '/register-device' },
    { icon: <FiBarChart2 />, label: 'History', path: '/history' },
    { icon: <FiCreditCard />, label: 'Payments', path: '/payments' },
    { icon: <FiSettings />, label: 'Settings', path: '/settings' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav 
      className={`side-navbar ${isHovered ? 'expanded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo section - Clickable */}
      <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <div className="logo-icon"><FiZap /></div>
        <h1 className={`logo-text ${isHovered ? 'visible' : 'hidden'}`}>
          Energy Exchange
        </h1>
      </div>

      {/* Navigation menu */}
      <div className="nav-menu">
        {navItems.map((item, index) => (
          <div
            key={index}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
            style={{ cursor: 'pointer' }}
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

      {/* User section */}
      <div className="nav-user-section">
        <div className="nav-divider"></div>
        
        <div 
          className="nav-item user-profile"
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
        >
          <div className="nav-icon"><FiUser /></div>
          <span className={`nav-label ${isHovered ? 'visible' : 'hidden'}`}>
            {user?.username || 'Profile'}
          </span>
          {!isHovered && (
            <div className="tooltip">Profile</div>
          )}
        </div>

        <div 
          className="nav-item logout-item"
          onClick={handleLogout}
          style={{ cursor: 'pointer' }}
        >
          <div className="nav-icon"><FiLogOut /></div>
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
