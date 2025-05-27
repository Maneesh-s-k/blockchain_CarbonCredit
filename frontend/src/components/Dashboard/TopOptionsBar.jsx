import React from "react";
import { useNavigate } from "react-router-dom";

export default function TopOptionsBar({ onSellClick, onBuyClick, setIsLoading }) {
  const navigate = useNavigate();

  const handleRegisterDevice = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate("/register-device");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="top-options-container">
      <div className="top-options-bar">
        <button className="top-option-btn sell-credits-btn" onClick={onSellClick}>
          <span className="btn-icon">💰</span>
          <span className="btn-text">Sell Credits</span>
        </button>
        <button className="top-option-btn buy-credits-btn" onClick={onBuyClick}>
          <span className="btn-icon">🛒</span>
          <span className="btn-text">Buy Credits</span>
        </button>
        <button className="top-option-btn register-device-btn" onClick={handleRegisterDevice}>
          <span className="btn-icon">⚡</span>
          <span className="btn-text">Register Device</span>
        </button>
      </div>
    </div>
  );
}
