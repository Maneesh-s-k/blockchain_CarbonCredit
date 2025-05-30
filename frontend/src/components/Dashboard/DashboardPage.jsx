import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletConnect from '../Wallet/WalletConnect';
import { blockchainService } from '../../services/blockchainService';
import ErrorBoundary from '../Shared/ErrorBoundary';
import { 
  FiZap, 
  FiDollarSign, 
  FiRefreshCw, 
  FiHome,
  FiTool,
  FiShoppingCart,
  FiBarChart2,
  FiGrid,
  FiCreditCard,
  FiAlertTriangle
} from 'react-icons/fi';

export default function DashboardPage({ setIsLoading }) {
  const navigate = useNavigate();
  
  // State management
  const [blockchainData, setBlockchainData] = useState({
    carbonBalance: '0',
    totalTokens: 0,
    userTokens: [],
    marketStats: { totalListings: 0, activeListings: 0, totalVolume: 0 },
    userAddress: '',
    ethBalance: '0',
    energyProduced: '1,234 kWh'
  });
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      setBlockchainLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to connect to blockchain.');
      }

      const initPromise = blockchainService.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      const userAddress = await Promise.race([initPromise, timeoutPromise]);
      
      const dataPromises = [
        blockchainService.getCarbonBalance(userAddress).catch(() => '0'),
        blockchainService.getUserTokens(userAddress).catch(() => []),
        blockchainService.getMarketplaceStats().catch(() => [0, 0, 0]),
        blockchainService.getBalance(userAddress).catch(() => '0')
      ];

      const [carbonBalance, userTokens, marketStats, ethBalance] = await Promise.all(dataPromises);

      const totalEnergy = Array.isArray(userTokens) 
        ? userTokens.reduce((sum, token) => sum + parseInt(token.energyAmount || 0), 0)
        : 0;

      setBlockchainData({
        carbonBalance: carbonBalance.toString(),
        totalTokens: Array.isArray(userTokens) ? userTokens.length : 0,
        userTokens: Array.isArray(userTokens) ? userTokens : [],
        marketStats: Array.isArray(marketStats) ? {
          totalListings: marketStats[0]?.toString() || '0',
          activeListings: marketStats[1]?.toString() || '0',
          totalVolume: marketStats[2]?.toString() || '0'
        } : { totalListings: '0', activeListings: '0', totalVolume: '0' },
        userAddress,
        ethBalance: ethBalance || '0',
        energyProduced: totalEnergy > 0 ? `${totalEnergy.toLocaleString()} kWh` : '1,234 kWh'
      });

      setRetryCount(0);

    } catch (error) {
      console.error('Error loading blockchain data:', error);
      
      let errorMessage = 'Failed to load blockchain data';
      
      if (error.message.includes('MetaMask')) {
        errorMessage = 'MetaMask not found. Please install MetaMask extension.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your network.';
      } else if (error.message.includes('Contract not deployed')) {
        errorMessage = 'Contracts not deployed. Please start Hardhat node and deploy contracts.';
      } else if (error.message.includes('Wrong network')) {
        errorMessage = 'Wrong network. Please switch to Hardhat local network.';
      } else if (error.code === 'BAD_DATA') {
        errorMessage = 'Contract not found. Please ensure Hardhat node is running and contracts are deployed.';
      }
      
      setError({
        message: errorMessage,
        details: error.message,
        canRetry: true
      });
    } finally {
      setBlockchainLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => loadBlockchainData(), 1000 * Math.pow(2, retryCount));
    }
  };

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

  // Error display component
  const ErrorDisplay = ({ error, onRetry, retryCount }) => (
    <div className="error-banner">
      <FiAlertTriangle className="error-icon" />
      <div className="error-content">
        <h4 className="error-title">{error.message}</h4>
        <p className="error-details">{error.details}</p>
      </div>
      {error.canRetry && retryCount < 3 && (
        <button onClick={onRetry} className="error-retry-btn">
          Retry ({3 - retryCount} left)
        </button>
      )}
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="dashboard-content">
        {/* Modified Hero Section - Horizontal Layout */}
        <div className="hero-section-horizontal">
          <div className="hero-left">
            <h1 className="hero-title-compact">Welcome to Energy Trading</h1>
            <p className="hero-subtitle-compact">
              Monitor your energy production, trade credits, and manage your devices
            </p>
            {blockchainLoading && (
              <p className="hero-loading-compact">
                <FiRefreshCw className="spinning" />
                Loading blockchain data...
              </p>
            )}
          </div>
          <div className="hero-right">
            {blockchainData.userAddress && (
              <p className="hero-wallet-right">
                Connected: {blockchainData.userAddress.slice(0, 6)}...{blockchainData.userAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={handleRetry} 
            retryCount={retryCount}
          />
        )}

        {/* Dashboard Grid */}
        <div className="dashboard-grid-compact">
          <div className="dashboard-left">
            {/* Stats Grid - 4 Cards in Line */}
            <div className="stats-grid">
              <div 
                className="stat-card clickable" 
                onClick={() => handleStatCardClick('energy')}
              >
                <div className="stat-icon"><FiZap /></div>
                <div className="stat-content">
                  <div className="stat-value">{blockchainData.energyProduced}</div>
                  <div className="stat-change positive">+12.5%</div>
                  <div className="stat-label">Energy Produced</div>
                </div>
              </div>
              
              <div 
                className="stat-card clickable" 
                onClick={() => handleStatCardClick('credits')}
              >
                <div className="stat-icon"><FiDollarSign /></div>
                <div className="stat-content">
                  <div className="stat-value">{blockchainData.carbonBalance} tCO₂</div>
                  <div className="stat-change positive">+8.2%</div>
                  <div className="stat-label">Carbon Credits</div>
                </div>
              </div>
              
              <div 
                className="stat-card clickable" 
                onClick={() => handleStatCardClick('trades')}
              >
                <div className="stat-icon"><FiRefreshCw /></div>
                <div className="stat-content">
                  <div className="stat-value">{blockchainData.marketStats.activeListings}</div>
                  <div className="stat-change positive">+3</div>
                  <div className="stat-label">Active Trades</div>
                </div>
              </div>
              
              <div 
                className="stat-card clickable" 
                onClick={() => handleStatCardClick('devices')}
              >
                <div className="stat-icon"><FiHome /></div>
                <div className="stat-content">
                  <div className="stat-value">{blockchainData.totalTokens}</div>
                  <div className="stat-change">-</div>
                  <div className="stat-label">NFT Credits</div>
                </div>
              </div>
            </div>

            {/* Actions, Activity, and Wallet Row */}
            <div className="actions-wallet-row-positioned">
              {/* Quick Actions - Left */}
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

              {/* Recent Activity - Center */}
              <div className="recent-activity-section">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <div 
                    className="activity-item"
                    onClick={() => navigate('/history')}
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
                  >
                    <div className="activity-icon">
                      <FiHome />
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">
                        {blockchainData.totalTokens > 0 ? `${blockchainData.totalTokens} Credits Owned` : 'Device Registered'}
                      </p>
                      <p className="activity-time">1 day ago</p>
                    </div>
                    <div className="activity-amount">-</div>
                  </div>
                </div>
              </div>

              {/* Wallet - Right */}
              <div className="wallet-section-inline">
                <WalletConnect />
                {blockchainData.ethBalance && (
                  <div className="wallet-balance">
                    Balance: {parseFloat(blockchainData.ethBalance).toFixed(4)} ETH
                  </div>
                )}
              </div>
            </div>

            {/* Chart Section - Below everything */}
            <div 
              className="chart-section clickable" 
              onClick={() => navigate('/history')}
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
                <FiBarChart2 />
                <p>Click to view detailed analytics</p>
                {blockchainLoading && (
                  <p className="chart-loading">Loading blockchain data...</p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Keep original structure but empty for now */}
          <div className="dashboard-right">
            {/* This space can be used for other components later */}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
