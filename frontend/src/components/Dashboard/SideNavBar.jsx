import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExchangeAlt, FaCreditCard, FaHistory, FaCog, FaQuestionCircle, FaSignOutAlt, FaBolt } from "react-icons/fa";

export default function SideNavBar() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { icon: <FaExchangeAlt />, label: "Energy Exchange", path: "/energy-exchange" },
    { icon: <FaCreditCard />, label: "Payments", path: "/payments" },
    { icon: <FaHistory />, label: "History", path: "/history" },
    { icon: <FaCog />, label: "Settings", path: "/settings" },
    { icon: <FaQuestionCircle />, label: "Help", path: "/help" },
    { icon: <FaSignOutAlt />, label: "Logout", path: "/logout" },
  ];

  return (
    <div 
      className={`side-navbar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="nav-logo">
        <div className="logo-icon">
          <FaBolt />
        </div>
        <h2 className={`logo-text ${isExpanded ? 'visible' : 'hidden'}`}>
          EnergyApp
        </h2>
      </div>
      
      <nav className="nav-menu">
        {navItems.map((item, index) => (
          <div 
            key={index}
            className="nav-item"
            onClick={() => navigate(item.path)}
            title={!isExpanded ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className={`nav-label ${isExpanded ? 'visible' : 'hidden'}`}>
              {item.label}
            </span>
            {!isExpanded && (
              <div className="tooltip">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
