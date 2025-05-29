import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiDollarSign, 
  FiShoppingCart, 
  FiTool,
  FiLogOut 
} from 'react-icons/fi';

export default function TopOptionsBar({ setIsLoading }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSellClick = () => {
    console.log('Sell button clicked'); // Debug log
    navigate('/energy-exchange?action=sell');
  };

  const handleBuyClick = () => {
    console.log('Buy button clicked'); // Debug log
    navigate('/energy-exchange?action=buy');
  };

  const handleRegisterDevice = () => {
    console.log('Register device clicked'); // Debug log
    navigate('/register-device');
  };

  const handleLogout = async () => {
    try {
      if (setIsLoading) setIsLoading(true);
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  return (
    <div className="top-options-container">
      <div className="top-options-bar">
        <div className="action-buttons">
          <button 
            className="top-option-btn sell-credits-btn"
            onClick={handleSellClick}
            type="button"
          >
            <span className="btn-icon"><FiDollarSign /></span>
            <span className="btn-text">Sell Energy</span>
          </button>
          
          <button 
            className="top-option-btn buy-credits-btn"
            onClick={handleBuyClick}
            type="button"
          >
            <span className="btn-icon"><FiShoppingCart /></span>
            <span className="btn-text">Buy Energy</span>
          </button>
          
          <button 
            className="top-option-btn register-device-btn"
            onClick={handleRegisterDevice}
            type="button"
          >
            <span className="btn-icon"><FiTool /></span>
            <span className="btn-text">Register Device</span>
          </button>
        </div>

        <div className="user-menu">
          <span className="user-name">
            Welcome, {user?.username || 'User'}
          </span>
          <button 
            className="top-option-btn logout-btn"
            onClick={handleLogout}
            type="button"
          >
            <span className="btn-icon"><FiLogOut /></span>
            <span className="btn-text">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
