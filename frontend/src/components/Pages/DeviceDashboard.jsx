import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { blockchainService } from '../../services/blockchainService';
import {
  FiZap,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
  FiSettings,
  FiDownload,
  FiRefreshCw,
  FiSun,
  FiWind,
  FiDroplet,
  FiLoader,
  FiAlertTriangle,
  FiDollarSign,
  FiActivity,
  FiShield
} from 'react-icons/fi';

export default function DeviceDashboard() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    totalDevices: 0,
    approvedDevices: 0,
    pendingDevices: 0,
    totalCapacity: 0,
    totalEnergyProduced: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [userAddress, setUserAddress] = useState('');
  const [blockchainTokens, setBlockchainTokens] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [filter, currentPage]);

  const initializeData = async () => {
    try {
      // Initialize blockchain connection
      try {
        const address = await blockchainService.getAccount();
        setUserAddress(address);
        await loadBlockchainTokens(address);
      } catch (blockchainError) {
        console.log('Blockchain not available:', blockchainError.message);
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const loadBlockchainTokens = async (address) => {
    try {
      const tokens = await blockchainService.getUserTokens(address);
      setBlockchainTokens(tokens);
      console.log(`Found ${tokens.length} blockchain tokens for user`);
    } catch (error) {
      console.error('Error loading blockchain tokens:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: 10
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await apiService.getUserDevices(params);
      
      if (response.success) {
        // Enhance devices with blockchain token data
        const enhancedDevices = response.devices.map(device => {
          const blockchainToken = blockchainTokens.find(token => 
            token.projectHash && device.specifications?.serialNumber &&
            token.projectHash.includes(device.specifications.serialNumber.slice(-8))
          );
          
          return {
            ...device,
            blockchainToken: blockchainToken || null,
            hasBlockchainToken: !!blockchainToken
          };
        });

        setDevices(enhancedDevices);
        setPagination(response.pagination);
        setStats(response.stats);
      } else {
        setError(response.message || 'Failed to fetch devices');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to fetch devices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId, deviceName) => {
    if (!window.confirm(`Are you sure you want to delete "${deviceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiService.deleteDevice(deviceId);
      
      if (response.success) {
        setDevices(devices.filter(device => device._id !== deviceId));
        setStats(prev => ({
          ...prev,
          totalDevices: prev.totalDevices - 1
        }));
        alert('Device deleted successfully');
      } else {
        alert(response.message || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Failed to delete device. Please try again.');
    }
  };

  const handleMintBlockchainToken = async (device) => {
    if (!userAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const deviceData = {
        owner: userAddress,
        carbonAmount: Math.floor(parseFloat(device.capacity) * 100),
        energyAmount: Math.floor(parseFloat(device.capacity) * 1000),
        projectHash: `0x${device.specifications.serialNumber}${Date.now().toString(16)}`,
        projectType: device.deviceType,
        location: device.location.address,
        vintage: new Date(device.specifications.installationDate).getFullYear(),
        uri: `ipfs://device-${device._id}`
      };

      const proof = {
        a: ["0x1234567890abcdef", "0xfedcba0987654321"],
        b: [["0xabcdef1234567890", "0x0987654321fedcba"], ["0x1111111111111111", "0x2222222222222222"]],
        c: ["0x3333333333333333", "0x4444444444444444"],
        input: ["0x5555555555555555"]
      };

      const tx = await blockchainService.registerDevice(deviceData, proof);
      await tx.wait();
      
      alert('Blockchain token minted successfully! 🎉');
      await loadBlockchainTokens(userAddress);
      await fetchDevices();
      
    } catch (error) {
      console.error('Error minting blockchain token:', error);
      alert('Failed to mint blockchain token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setCurrentPage(1);
    await fetchDevices();
    if (userAddress) {
      await loadBlockchainTokens(userAddress);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="status-icon approved" />;
      case 'rejected':
        return <FiXCircle className="status-icon rejected" />;
      case 'pending':
        return <FiClock className="status-icon pending" />;
      default:
        return <FiClock className="status-icon pending" />;
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'solar':
        return { icon: <FiSun />, emoji: '☀️' };
      case 'wind':
        return { icon: <FiWind />, emoji: '💨' };
      case 'hydro':
        return { icon: <FiDroplet />, emoji: '💧' };
      case 'geothermal':
        return { icon: <FiZap />, emoji: '🌋' };
      case 'biomass':
        return { icon: <FiZap />, emoji: '🌿' };
      default:
        return { icon: <FiZap />, emoji: '⚡' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-text success">Approved</span>;
      case 'rejected':
        return <span className="status-text danger">Rejected</span>;
      case 'pending':
        return <span className="status-text warning">Pending</span>;
      default:
        return <span className="status-text warning">Pending</span>;
    }
  };

  const filteredDevices = devices.filter(device => {
    if (filter === 'all') return true;
    return device.verification.status === filter;
  });

  return (
    <div className="device-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Device Dashboard</h1>
            <p>Manage your registered energy devices and track their performance</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleRefresh} 
              className="refresh-btn"
              disabled={isLoading}
            >
              <FiRefreshCw className={isLoading ? 'spinning' : ''} />
            </button>
            <button 
              onClick={() => navigate('/register-device')} 
              className="add-device-btn"
            >
              <FiPlus />
              Add Device
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <FiAlertTriangle />
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Enhanced Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiZap />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalDevices}</div>
              <div className="stat-label">Total Devices</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.approvedDevices}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiBarChart2 />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalCapacity?.toFixed(1) || 0} kW</div>
              <div className="stat-label">Total Capacity</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiActivity />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalEnergyProduced?.toFixed(0) || 0} kWh</div>
              <div className="stat-label">Energy Produced</div>
            </div>
          </div>

          {userAddress && (
            <div className="stat-card">
              <div className="stat-icon">
                <FiShield />
              </div>
              <div className="stat-content">
                <div className="stat-value">{blockchainTokens.length}</div>
                <div className="stat-label">Blockchain Tokens</div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Devices
          </button>
          <button 
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        {/* Devices Section */}
        <div className="devices-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading devices...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FiZap />
              </div>
              <h3>No Devices Found</h3>
              <p>
                {filter === 'all' 
                  ? "You haven't registered any devices yet." 
                  : `No ${filter} devices found.`
                }
              </p>
              {filter === 'all' && (
                <button 
                  onClick={() => navigate('/register-device')} 
                  className="empty-action-btn"
                >
                  <FiPlus />
                  Register Your First Device
                </button>
              )}
            </div>
          ) : (
            <div className="devices-grid">
              {filteredDevices.map((device) => {
                const deviceTypeInfo = getDeviceIcon(device.deviceType);
                
                return (
                  <div key={device._id} className="device-card">
                    <div className="device-header">
                      <div className="device-type">
                        <span className="type-emoji">{deviceTypeInfo.emoji}</span>
                        <span className="type-name">{device.deviceType}</span>
                      </div>
                      <div className="device-status">
                        {getStatusIcon(device.verification.status)}
                        {getStatusText(device.verification.status)}
                      </div>
                    </div>
                    
                    <div className="device-content">
                      <h3 className="device-name">{device.deviceName}</h3>
                      
                      <div className="device-details">
                        <div className="detail-item">
                          <span className="detail-label">Capacity:</span>
                          <span className="detail-value">{device.capacity} kW</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{device.location.address}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Energy Produced:</span>
                          <span className="detail-value">{device.energyProduction?.totalProduced || 0} kWh</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Revenue:</span>
                          <span className="detail-value">${device.trading?.totalRevenue || 0}</span>
                        </div>
                        {device.hasBlockchainToken && (
                          <div className="detail-item">
                            <span className="detail-label">Blockchain Token:</span>
                            <span className="detail-value" style={{ color: 'var(--success)' }}>
                              ✅ Token #{device.blockchainToken.tokenId}
                            </span>
                          </div>
                        )}
                      </div>

                      {device.description && (
                        <div className="device-description">
                          <p>{device.description}</p>
                        </div>
                      )}

                      {device.verification.status === 'rejected' && device.verification.notes && (
                        <div className="rejection-notes">
                          <strong>Rejection Reason:</strong>
                          <p>{device.verification.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="device-actions">
                      <button 
                        className="action-btn view-btn" 
                        onClick={() => navigate(`/devices/${device._id}`)}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => navigate(`/devices/${device._id}/edit`)}
                        title="Edit Device"
                      >
                        <FiEdit3 />
                      </button>

                      {device.verification.status === 'approved' && !device.hasBlockchainToken && userAddress && (
                        <button 
                          className="action-btn settings-btn" 
                          onClick={() => handleMintBlockchainToken(device)}
                          title="Mint Blockchain Token"
                          disabled={isLoading}
                        >
                          <FiShield />
                        </button>
                      )}
                      
                      <button 
                        className="action-btn settings-btn" 
                        onClick={() => navigate(`/devices/${device._id}/settings`)}
                        title="Device Settings"
                      >
                        <FiSettings />
                      </button>
                      
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDeleteDevice(device._id, device.deviceName)}
                        title="Delete Device"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <span className="pagination-info">
              Page {pagination.current} of {pagination.pages} ({pagination.total} devices)
            </span>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
              disabled={currentPage === pagination.pages}
            >
              Next
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <div className="quick-action-card" onClick={() => navigate('/register-device')}>
              <div className="action-icon">
                <FiPlus />
              </div>
              <span>Register New Device</span>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/energy-exchange')}>
              <div className="action-icon">
                <FiDollarSign />
              </div>
              <span>Energy Trading</span>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/analytics')}>
              <div className="action-icon">
                <FiBarChart2 />
              </div>
              <span>View Analytics</span>
            </div>
            
            <div className="quick-action-card" onClick={handleRefresh}>
              <div className="action-icon">
                <FiRefreshCw />
              </div>
              <span>Refresh Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
