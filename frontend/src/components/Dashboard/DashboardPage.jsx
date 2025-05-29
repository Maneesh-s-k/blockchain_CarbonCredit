import React from 'react';
import { useNavigate } from 'react-router-dom';
import WalletConnect from '../Wallet/WalletConnect';
import { 
  FiZap, 
  FiDollarSign, 
  FiRefreshCw, 
  FiHome,
  FiTool,
  FiShoppingCart,
  FiBarChart2,
  FiGrid,
  FiCreditCard
} from 'react-icons/fi';

export default function DashboardPage({ setIsLoading }) {
  const navigate = useNavigate();

  const handleQuickAction = (action) => {
    setIsLoading(true);
    setTimeout(() => {
      switch (action) {
        case 'register':
          navigate('/register-device');
          break;
        case 'sell':
          navigate('/energy-exchange?tab=sell');
          break;
        case 'buy':
          navigate('/energy-exchange?tab=buy');
          break;
        case 'devices':
          navigate('/devices');
          break;
        case 'history':
          navigate('/history');
          break;
        case 'payments':
          navigate('/payments');
          break;
        default:
          break;
      }
      setIsLoading(false);
    }, 500);
  };

  const handleStatCardClick = (type) => {
    switch (type) {
      case 'energy':
        navigate('/devices');
        break;
      case 'credits':
        navigate('/energy-exchange');
        break;
      case 'trades':
        navigate('/history');
        break;
      case 'devices':
        navigate('/register-device');
        break;
      default:
        break;
    }
  };

  return (
    <div className="dashboard-content">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Welcome to Energy Trading</h1>
        <p className="hero-subtitle">
          Monitor your energy production, trade credits, and manage your devices
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-left">
          {/* Stats Grid - Make them clickable */}
          <div className="stats-grid">
            <div 
              className="stat-card clickable" 
              onClick={() => handleStatCardClick('energy')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon"><FiZap /></div>
              <div className="stat-content">
                <div className="stat-value">1,234 kWh</div>
                <div className="stat-change positive">+12.5%</div>
                <div className="stat-label">Energy Produced</div>
              </div>
            </div>
            
            <div 
              className="stat-card clickable" 
              onClick={() => handleStatCardClick('credits')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon"><FiDollarSign /></div>
              <div className="stat-content">
                <div className="stat-value">$2,456</div>
                <div className="stat-change positive">+8.2%</div>
                <div className="stat-label">Credits Earned</div>
              </div>
            </div>
            
            <div 
              className="stat-card clickable" 
              onClick={() => handleStatCardClick('trades')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon"><FiRefreshCw /></div>
              <div className="stat-content">
                <div className="stat-value">23</div>
                <div className="stat-change positive">+3</div>
                <div className="stat-label">Active Trades</div>
              </div>
            </div>
            
            <div 
              className="stat-card clickable" 
              onClick={() => handleStatCardClick('devices')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon"><FiHome /></div>
              <div className="stat-content">
                <div className="stat-value">5</div>
                <div className="stat-change">-</div>
                <div className="stat-label">Devices</div>
              </div>
            </div>
          </div>

          {/* Chart Section - Make clickable */}
          <div 
            className="chart-section clickable" 
            onClick={() => navigate('/history')}
            style={{ cursor: 'pointer' }}
          >
            <div className="chart-header">
              <h3>Energy Production Overview</h3>
              <div className="chart-timeframes">
                <button className="timeframe-btn active">24H</button>
                <button className="timeframe-btn">7D</button>
                <button className="timeframe-btn">30D</button>
                <button className="timeframe-btn">1Y</button>
              </div>
            </div>
            <div className="chart-placeholder">
              <FiBarChart2 style={{ fontSize: '48px', color: 'var(--text-muted)' }} />
              <p>Click to view detailed analytics</p>
            </div>
          </div>
        </div>

        <div className="dashboard-right">
          {/* Wallet */}
          <div className="wallet-section">
            <WalletConnect />
          </div>

          {/* Quick Actions - Enhanced */}
          <div className="quick-actions-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn"
                onClick={() => handleQuickAction('register')}
              >
                <FiTool />
                <span>Register Device</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => handleQuickAction('sell')}
              >
                <FiDollarSign />
                <span>Sell Energy</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => handleQuickAction('buy')}
              >
                <FiShoppingCart />
                <span>Buy Credits</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => handleQuickAction('devices')}
              >
                <FiGrid />
                <span>My Devices</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => handleQuickAction('history')}
              >
                <FiBarChart2 />
                <span>View History</span>
              </button>
              <button 
                className="quick-action-btn"
                onClick={() => handleQuickAction('payments')}
              >
                <FiCreditCard />
                <span>Payments</span>
              </button>
            </div>
          </div>

          {/* Recent Activity - Make clickable */}
          <div className="recent-activity-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              <div 
                className="activity-item"
                onClick={() => navigate('/history')}
                style={{ cursor: 'pointer' }}
              >
                <div className="activity-icon">
                  <FiZap />
                </div>
                <div className="activity-content">
                  <p className="activity-title">Energy Sold</p>
                  <p className="activity-time">2 hours ago</p>
                </div>
                <div className="activity-amount">+$45.20</div>
              </div>
              <div 
                className="activity-item"
                onClick={() => navigate('/history')}
                style={{ cursor: 'pointer' }}
              >
                <div className="activity-icon">
                  <FiRefreshCw />
                </div>
                <div className="activity-content">
                  <p className="activity-title">Trade Completed</p>
                  <p className="activity-time">5 hours ago</p>
                </div>
                <div className="activity-amount">+$128.50</div>
              </div>
              <div 
                className="activity-item"
                onClick={() => navigate('/devices')}
                style={{ cursor: 'pointer' }}
              >
                <div className="activity-icon">
                  <FiHome />
                </div>
                <div className="activity-content">
                  <p className="activity-title">Device Registered</p>
                  <p className="activity-time">1 day ago</p>
                </div>
                <div className="activity-amount">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
