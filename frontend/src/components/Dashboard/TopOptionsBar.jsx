import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiDollarSign, 
  FiShoppingCart, 
  FiPlus, 
  FiLogOut 
} from 'react-icons/fi';

export default function TopOptionsBar({ onSellClick, onBuyClick, setIsLoading }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleRegisterDevice = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate("/register-device");
      setIsLoading(false);
    }, 1500);
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
    <div className="top-options-container compact">
      <div className="top-options-bar">
        <div className="action-buttons">
          <button className="top-option-btn sell-credits-btn compact" onClick={onSellClick}>
            <span className="btn-icon"><FiDollarSign /></span>
            <span className="btn-text">Sell</span>
          </button>
          <button className="top-option-btn buy-credits-btn compact" onClick={onBuyClick}>
            <span className="btn-icon"><FiShoppingCart /></span>
            <span className="btn-text">Buy</span>
          </button>
          <button className="top-option-btn register-device-btn compact" onClick={handleRegisterDevice}>
            <span className="btn-icon"><FiPlus /></span>
            <span className="btn-text">Register</span>
          </button>
        </div>
        
        <div className="user-menu compact">
          <span className="user-name">{user?.username || 'User'}</span>
          <button className="top-option-btn logout-btn compact" onClick={handleLogout}>
            <span className="btn-icon"><FiLogOut /></span>
            <span className="btn-text">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
