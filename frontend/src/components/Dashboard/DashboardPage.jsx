// components/Dashboard/DashboardPage.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blockchainService } from '../../services/blockchainService';
import { apiService } from '../../services/apiService';
import ErrorBoundary from '../Shared/ErrorBoundary';
import WalletConnect from '../Wallet/WalletConnect'; // Floating wallet
import { 
  FiZap, FiDollarSign, FiRefreshCw, FiTrendingUp, FiGrid, 
  FiSettings, FiBarChart2, FiShoppingCart, FiPlus, FiEye, 
  FiActivity, FiCreditCard, FiAlertTriangle, FiArrowRight,
  FiWifi, FiWifiOff, FiShield
} from 'react-icons/fi';

export default function DashboardPage({ setIsLoading }) {
  const navigate = useNavigate();
  
  // REAL DATA STATE
  const [dashboardState, setDashboardState] = useState({
    blockchain: {
      isConnected: false,
      address: '',
      ethBalance: '0',
      carbonBalance: '0',
      totalTokens: 0,
      network: null
    },
    metrics: {
      totalEnergyProduced: 0,
      totalRevenue: 0,
      activeTrades: 0,
      carbonCredits: 0,
      devicesConnected: 0,
      monthlyGrowth: 0
    },
    activities: [],
    loading: {
      main: true,
      blockchain: false,
      refresh: false
    },
    isRealTimeConnected: false,
    lastUpdated: null,
    error: null
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    initializeRealDashboard();
  }, []);

  const initializeRealDashboard = async () => {
    try {
      setDashboardState(prev => ({
        ...prev,
        loading: { ...prev.loading, main: true },
        error: null
      }));

      const [
        blockchainData,
        energyData,
        tradingData,
        devicesData,
        activitiesData
      ] = await Promise.all([
        loadRealBlockchainData(),
        loadRealEnergyData(),
        loadRealTradingData(),
        loadRealDevicesData(),
        loadRealActivitiesData()
      ]);

      setDashboardState(prev => ({
        ...prev,
        blockchain: blockchainData,
        metrics: {
          totalEnergyProduced: energyData.totalProduced,
          totalRevenue: tradingData.totalRevenue,
          activeTrades: tradingData.activeTrades,
          carbonCredits: blockchainData.totalTokens,
          devicesConnected: devicesData.connectedDevices,
          monthlyGrowth: tradingData.growthRate
        },
        activities: activitiesData,
        loading: { ...prev.loading, main: false },
        lastUpdated: new Date()
      }));

    } catch (error) {
      console.error('Dashboard initialization error:', error);
      setDashboardState(prev => ({
        ...prev,
        error: {
          message: 'Failed to load dashboard data',
          details: error.message,
          canRetry: true
        },
        loading: { ...prev.loading, main: false }
      }));
    }
  };

  const loadRealBlockchainData = async () => {
    try {
      if (!window.ethereum) {
        return { isConnected: false, totalTokens: 0 };
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length === 0) {
        return { isConnected: false, totalTokens: 0 };
      }

      const address = accounts[0];

      const [
        ethBalance,
        carbonBalance,
        network
      ] = await Promise.all([
        blockchainService.getBalance(address).catch(() => '0'),
        blockchainService.getCarbonBalance(address).catch(() => '0'),
        blockchainService.getNetwork().catch(() => null)
      ]);

      return {
        isConnected: true,
        address,
        ethBalance: ethBalance || '0',
        carbonBalance: carbonBalance.toString() || '0',
        totalTokens: parseInt(carbonBalance) || 0,
        network
      };

    } catch (error) {
      console.error('Blockchain data loading error:', error);
      return { isConnected: false, totalTokens: 0 };
    }
  };

  const loadRealEnergyData = async () => {
    try {
      const response = await apiService.getUserDevices();
      
      if (response?.success && response.devices) {
        const totalProduced = response.devices.reduce((sum, device) => {
          return sum + (device.energyProduction?.totalProduced || 0);
        }, 0);

        return {
          totalProduced: totalProduced,
          connectedDevices: response.devices.length
        };
      }

      return { totalProduced: 0, connectedDevices: 0 };
    } catch (error) {
      console.error('Energy data loading error:', error);
      return { totalProduced: 0, connectedDevices: 0 };
    }
  };

  const loadRealTradingData = async () => {
    try {
      const response = await apiService.getTradingAnalytics?.(selectedTimeframe);
      
      if (response?.success && response.statistics) {
        return {
          totalRevenue: response.statistics.totalValue || 0,
          activeTrades: response.statistics.activeListings || 0,
          growthRate: response.statistics.growthRate || 0
        };
      }

      const transactionsResponse = await apiService.getUserTransactions?.({ limit: 100 });
      
      if (transactionsResponse?.success && transactionsResponse.transactions) {
        const completedTransactions = transactionsResponse.transactions.filter(tx => tx.status === 'completed');
        const totalRevenue = completedTransactions.reduce((sum, tx) => {
          return sum + (tx.energy?.totalPrice || tx.amount || 0);
        }, 0);

        return {
          totalRevenue: totalRevenue,
          activeTrades: transactionsResponse.transactions.filter(tx => tx.status === 'pending').length,
          growthRate: 0
        };
      }

      return { totalRevenue: 0, activeTrades: 0, growthRate: 0 };
    } catch (error) {
      console.error('Trading data loading error:', error);
      return { totalRevenue: 0, activeTrades: 0, growthRate: 0 };
    }
  };

  const loadRealDevicesData = async () => {
    try {
      const response = await apiService.getUserDevices();
      
      if (response?.success && response.devices) {
        const approvedDevices = response.devices.filter(device => 
          device.verification?.status === 'approved'
        );

        return {
          connectedDevices: approvedDevices.length,
          totalDevices: response.devices.length
        };
      }

      return { connectedDevices: 0, totalDevices: 0 };
    } catch (error) {
      console.error('Devices data loading error:', error);
      return { connectedDevices: 0, totalDevices: 0 };
    }
  };

  const loadRealActivitiesData = async () => {
    try {
      const transactionsResponse = await apiService.getUserTransactions?.({ limit: 5 });
      const activities = [];

      if (transactionsResponse?.success && transactionsResponse.transactions) {
        transactionsResponse.transactions.forEach(tx => {
          activities.push({
            id: tx._id,
            type: tx.type || (tx.seller ? 'energy_sale' : 'energy_purchase'),
            title: tx.type === 'sale' || tx.seller ? 'Energy Sold' : 'Energy Purchased',
            description: `${tx.energy?.amount || tx.amount || 0} kWh`,
            amount: tx.energy?.totalPrice ? `$${tx.energy.totalPrice.toFixed(2)}` : '',
            timestamp: tx.createdAt,
            status: tx.status
          });
        });
      }

      try {
        const devicesResponse = await apiService.getUserDevices();
        if (devicesResponse?.success && devicesResponse.devices) {
          devicesResponse.devices.slice(0, 2).forEach(device => {
            activities.push({
              id: device._id,
              type: 'device_activity',
              title: 'Device Online',
              description: `${device.deviceName} producing energy`,
              amount: '',
              timestamp: device.updatedAt || device.createdAt,
              status: device.verification?.status || 'active'
            });
          });
        }
      } catch (error) {
        console.log('Device activities not available');
      }

      if (dashboardState.blockchain.isConnected) {
        try {
          const userTokens = await blockchainService.getUserTokens?.(dashboardState.blockchain.address);
          if (userTokens && userTokens.length > 0) {
            userTokens.slice(0, 2).forEach(token => {
              activities.push({
                id: token.tokenId,
                type: 'carbon_credit',
                title: 'Carbon Credit Earned',
                description: `NFT Token #${token.tokenId}`,
                amount: '+1 Credit',
                timestamp: new Date(),
                status: 'completed'
              });
            });
          }
        } catch (error) {
          console.log('Carbon credit activities not available');
        }
      }

      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    } catch (error) {
      console.error('Activities data loading error:', error);
      return [];
    }
  };

  const handleQuickAction = (action) => {
    setIsLoading(true);
    
    const routes = {
      'register-device': '/register-device',
      'sell-energy': '/energy-exchange?tab=my-listings',
      'buy-credits': '/energy-exchange?tab=marketplace',
      'view-devices': '/devices',
      'view-history': '/history',
      'manage-payments': '/payments',
      'view-analytics': '/analytics',
      'settings': '/settings'
    };

    setTimeout(() => {
      if (routes[action]) {
        navigate(routes[action]);
      }
      setIsLoading(false);
    }, 300);
  };

  const handleMetricClick = (type) => {
    const routes = {
      energy: '/devices',
      revenue: '/history?filter=revenue',
      trades: '/energy-exchange',
      credits: '/carbon-credits',
      blockchain: '/blockchain'
    };

    if (routes[type]) {
      navigate(routes[type]);
    }
  };

  const refreshAllData = async () => {
    setDashboardState(prev => ({
      ...prev,
      loading: { ...prev.loading, refresh: true }
    }));

    await initializeRealDashboard();

    setDashboardState(prev => ({
      ...prev,
      loading: { ...prev.loading, refresh: false }
    }));
  };

  const handleWalletUpdate = (walletData) => {
    setDashboardState(prev => ({
      ...prev,
      blockchain: { ...prev.blockchain, ...walletData }
    }));
    
    loadRealBlockchainData().then(blockchainData => {
      setDashboardState(prev => ({
        ...prev,
        blockchain: blockchainData,
        metrics: {
          ...prev.metrics,
          carbonCredits: blockchainData.totalTokens
        }
      }));
    });
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'energy_sale': return FiZap;
      case 'energy_purchase': return FiShoppingCart;
      case 'carbon_credit': return FiShield;
      case 'device_activity': return FiSettings;
      default: return FiActivity;
    }
  };

  if (dashboardState.loading.main) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-loading-state">
          <FiRefreshCw className="spinning" />
          <h3>Loading Real Dashboard Data...</h3>
          <p>Fetching your actual energy data and blockchain information</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="dashboard-content">
        {/* FLOATING WALLET - POSITIONED GLOBALLY */}
        <WalletConnect 
          blockchainData={dashboardState.blockchain}
          onWalletUpdate={handleWalletUpdate}
          onRefresh={refreshAllData}
        />

        {/* HEADER WITHOUT WALLET BUTTON */}
        <div className="dashboard-header-section">
          <div className="header-main">
            <div className="header-text">
              <h1 className="dashboard-title">Energy Trading Dashboard</h1>
              <p className="dashboard-subtitle">
                Real-time renewable energy trading with blockchain-powered carbon credits
              </p>
              
              <div className="connection-status">
                <div className={`status-indicator ${dashboardState.blockchain.isConnected ? 'online' : 'offline'}`}>
                  {dashboardState.blockchain.isConnected ? <FiShield /> : <FiWifiOff />}
                  <span>{dashboardState.blockchain.isConnected ? 'Blockchain Connected' : 'Connect Wallet'}</span>
                </div>
                
                {dashboardState.lastUpdated && (
                  <span className="last-updated">
                    Updated {dashboardState.lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* HEADER ACTIONS WITHOUT WALLET */}
            <div className="header-actions">
              <button 
                className="header-btn secondary"
                onClick={() => handleQuickAction('view-analytics')}
              >
                <FiBarChart2 />
                <span>Analytics</span>
              </button>
              <button 
                className="header-btn secondary"
                onClick={refreshAllData}
                disabled={dashboardState.loading.refresh}
              >
                <FiRefreshCw className={dashboardState.loading.refresh ? 'spinning' : ''} />
                <span>Refresh</span>
              </button>
              <button 
                className="header-btn primary"
                onClick={() => handleQuickAction('sell-energy')}
              >
                <FiPlus />
                <span>Sell Energy</span>
              </button>
            </div>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {dashboardState.error && (
          <div className="error-banner">
            <div className="error-icon">
              <FiAlertTriangle />
            </div>
            <div className="error-content">
              <h4>{dashboardState.error.message}</h4>
              <p>{dashboardState.error.details}</p>
            </div>
            {dashboardState.error.canRetry && (
              <button onClick={initializeRealDashboard} className="error-retry-btn">
                <FiRefreshCw />
                Retry
              </button>
            )}
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="dashboard-main-layout">
          <div className="dashboard-primary-column">
            {/* METRICS GRID */}
            <div className="metrics-section">
              <div className="metrics-grid">
                <div 
                  className="metric-card energy clickable" 
                  onClick={() => handleMetricClick('energy')}
                >
                  <div className="metric-icon">
                    <FiZap />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">
                      {dashboardState.metrics.totalEnergyProduced?.toLocaleString() || '0'}
                    </div>
                    <div className="metric-label">kWh Produced</div>
                    <div className="metric-trend positive">
                      <FiTrendingUp />
                      Real production data
                    </div>
                  </div>
                </div>

                <div 
                  className="metric-card revenue clickable" 
                  onClick={() => handleMetricClick('revenue')}
                >
                  <div className="metric-icon">
                    <FiDollarSign />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">
                      ${dashboardState.metrics.totalRevenue?.toLocaleString() || '0'}
                    </div>
                    <div className="metric-label">Total Revenue</div>
                    <div className="metric-trend positive">
                      <FiTrendingUp />
                      From actual trades
                    </div>
                  </div>
                </div>

                <div 
                  className="metric-card trades clickable" 
                  onClick={() => handleMetricClick('trades')}
                >
                  <div className="metric-icon">
                    <FiActivity />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">
                      {dashboardState.metrics.activeTrades || 0}
                    </div>
                    <div className="metric-label">Active Trades</div>
                    <div className="metric-trend positive">
                      <FiTrendingUp />
                      Live marketplace
                    </div>
                  </div>
                </div>

                <div 
                  className="metric-card credits clickable" 
                  onClick={() => handleMetricClick('credits')}
                >
                  <div className="metric-icon">
                    <FiGrid />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">
                      {dashboardState.metrics.carbonCredits || 0}
                    </div>
                    <div className="metric-label">Carbon Credits</div>
                    <div className="metric-trend positive">
                      <FiShield />
                      Blockchain NFTs
                    </div>
                  </div>
                </div>

                <div 
                  className="metric-card devices clickable" 
                  onClick={() => handleMetricClick('energy')}
                >
                  <div className="metric-icon">
                    <FiSettings />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">
                      {dashboardState.metrics.devicesConnected || 0}
                    </div>
                    <div className="metric-label">Connected Devices</div>
                    <div className="metric-trend neutral">
                      Verified devices
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="quick-actions-section">
              <div className="section-header">
                <h3>Quick Actions</h3>
                <p>Energy trading and blockchain operations</p>
              </div>
              
              <div className="quick-actions-grid">
                <button 
                  className="action-card primary"
                  onClick={() => handleQuickAction('sell-energy')}
                >
                  <div className="action-icon">
                    <FiZap />
                  </div>
                  <div className="action-content">
                    <h4>Sell Energy</h4>
                    <p>List energy on marketplace</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('buy-credits')}
                >
                  <div className="action-icon">
                    <FiShoppingCart />
                  </div>
                  <div className="action-content">
                    <h4>Buy Credits</h4>
                    <p>Purchase carbon offsets</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('view-analytics')}
                >
                  <div className="action-icon">
                    <FiBarChart2 />
                  </div>
                  <div className="action-content">
                    <h4>View Analytics</h4>
                    <p>Trading insights</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('view-devices')}
                >
                  <div className="action-icon">
                    <FiSettings />
                  </div>
                  <div className="action-content">
                    <h4>Manage Devices</h4>
                    <p>Monitor devices</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('view-history')}
                >
                  <div className="action-icon">
                    <FiActivity />
                  </div>
                  <div className="action-content">
                    <h4>Transaction History</h4>
                    <p>View all transactions</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('manage-payments')}
                >
                  <div className="action-icon">
                    <FiCreditCard />
                  </div>
                  <div className="action-content">
                    <h4>Payments</h4>
                    <p>Manage payments</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* SIDEBAR WITHOUT WALLET */}
          <div className="dashboard-secondary-column">
            {/* ACTIVITY FEED */}
            <div className="activity-section">
              <div className="section-header">
                <h3>Recent Activity</h3>
                <button 
                  className="view-all-btn"
                  onClick={() => handleQuickAction('view-history')}
                >
                  View All <FiArrowRight />
                </button>
              </div>
              
              <div className="activity-feed">
                {dashboardState.activities.length > 0 ? (
                  dashboardState.activities.map((activity) => {
                    const IconComponent = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          <IconComponent />
                        </div>
                        <div className="activity-content">
                          <h4 className="activity-title">{activity.title}</h4>
                          <p className="activity-description">{activity.description}</p>
                          <span className="activity-time">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        {activity.amount && (
                          <div className="activity-amount">
                            {activity.amount}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-activities">
                    <FiActivity />
                    <p>No recent activity</p>
                    <span>Your transactions will appear here</span>
                  </div>
                )}
              </div>
            </div>

            {/* PERFORMANCE SUMMARY */}
            <div className="performance-section">
              <div className="section-header">
                <h3>Performance Summary</h3>
                <span className="period-badge">Real Data</span>
              </div>
              
              <div className="performance-metrics">
                <div className="performance-item">
                  <div className="performance-icon energy">
                    <FiZap />
                  </div>
                  <div className="performance-content">
                    <span className="performance-value">
                      {dashboardState.metrics.totalEnergyProduced?.toLocaleString() || '0'} kWh
                    </span>
                    <span className="performance-label">Energy Generated</span>
                    <span className="performance-change positive">Live Data</span>
                  </div>
                </div>

                <div className="performance-item">
                  <div className="performance-icon revenue">
                    <FiDollarSign />
                  </div>
                  <div className="performance-content">
                    <span className="performance-value">
                      ${dashboardState.metrics.totalRevenue?.toLocaleString() || '0'}
                    </span>
                    <span className="performance-label">Revenue Earned</span>
                    <span className="performance-change positive">From Trades</span>
                  </div>
                </div>

                <div className="performance-item">
                  <div className="performance-icon credits">
                    <FiGrid />
                  </div>
                  <div className="performance-content">
                    <span className="performance-value">
                      {dashboardState.metrics.carbonCredits || 0} Credits
                    </span>
                    <span className="performance-label">Carbon NFTs</span>
                    <span className="performance-change positive">Blockchain</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
