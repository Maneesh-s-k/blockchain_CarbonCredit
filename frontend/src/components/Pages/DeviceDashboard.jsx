import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  FiDroplet
} from 'react-icons/fi';

export default function DeviceDashboard() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    totalDevices: 0,
    approvedDevices: 0,
    pendingDevices: 0,
    totalCapacity: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock data for demonstration
  const mockDevices = [
    {
      _id: '1',
      deviceName: 'Rooftop Solar Panel System',
      deviceType: 'solar',
      capacity: 5.5,
      location: '123 Main St, San Francisco, CA',
      verificationStatus: 'approved',
      totalEnergyProduced: 1250.5,
      createdAt: '2024-01-15T10:30:00Z',
      description: 'High-efficiency solar panel system installed on residential rooftop'
    },
    {
      _id: '2',
      deviceName: 'Backyard Wind Turbine',
      deviceType: 'wind',
      capacity: 2.0,
      location: '456 Oak Ave, Portland, OR',
      verificationStatus: 'pending',
      totalEnergyProduced: 0,
      createdAt: '2024-02-20T14:15:00Z',
      description: 'Small residential wind turbine for supplemental energy'
    },
    {
      _id: '3',
      deviceName: 'Micro Hydro Generator',
      deviceType: 'hydro',
      capacity: 1.2,
      location: '789 River Rd, Seattle, WA',
      verificationStatus: 'rejected',
      totalEnergyProduced: 0,
      createdAt: '2024-03-10T09:45:00Z',
      description: 'Stream-powered micro hydro system'
    }
  ];

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, [filter]);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        let filteredDevices = mockDevices;
        if (filter !== 'all') {
          filteredDevices = mockDevices.filter(device => device.verificationStatus === filter);
        }
        setDevices(filteredDevices);
        setIsLoading(false);
      }, 1000);

      // Uncomment when backend is ready
      /*
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`http://localhost:3001/api/devices${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setDevices(data.devices);
      } else {
        setError(data.message);
      }
      */
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to fetch devices');
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats
      const mockStats = {
        totalDevices: mockDevices.length,
        approvedDevices: mockDevices.filter(d => d.verificationStatus === 'approved').length,
        pendingDevices: mockDevices.filter(d => d.verificationStatus === 'pending').length,
        totalCapacity: mockDevices.reduce((sum, d) => sum + d.capacity, 0)
      };
      setStats(mockStats);

      // Uncomment when backend is ready
      /*
      const response = await fetch('http://localhost:3001/api/devices/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
      */
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      // Mock delete
      setDevices(devices.filter(device => device._id !== deviceId));
      fetchStats();

      // Uncomment when backend is ready
      /*
      const response = await fetch(`http://localhost:3001/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setDevices(devices.filter(device => device._id !== deviceId));
        fetchStats();
      } else {
        setError(data.message);
      }
      */
    } catch (error) {
      console.error('Error deleting device:', error);
      setError('Failed to delete device');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="status-icon approved" />;
      case 'rejected':
        return <FiXCircle className="status-icon rejected" />;
      default:
        return <FiClock className="status-icon pending" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  const getDeviceTypeIcon = (type) => {
    switch (type) {
      case 'solar': return <FiSun />;
      case 'wind': return <FiWind />;
      case 'hydro': return <FiDroplet />;
      case 'geothermal': return <FiZap />;
      case 'biomass': return <FiZap />;
      default: return <FiZap />;
    }
  };

  const getDeviceTypeEmoji = (type) => {
    switch (type) {
      case 'solar': return '☀️';
      case 'wind': return '💨';
      case 'hydro': return '💧';
      case 'geothermal': return '🌋';
      case 'biomass': return '🌱';
      default: return '⚡';
    }
  };

  return (
    <div className="device-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Device Management</h1>
            <p>Manage your registered energy devices and track their performance</p>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={() => { fetchDevices(); fetchStats(); }}
              disabled={isLoading}
            >
              <FiRefreshCw className={isLoading ? 'spinning' : ''} />
            </button>
            <button 
              className="add-device-btn"
              onClick={() => navigate('/register-device')}
            >
              <FiPlus />
              Add Device
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <FiXCircle />
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiZap />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalDevices || 0}</div>
              <div className="stat-label">Total Devices</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.approvedDevices || 0}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiClock />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pendingDevices || 0}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiBarChart2 />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalCapacity?.toFixed(1) || '0.0'} kW</div>
              <div className="stat-label">Total Capacity</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Devices ({stats.totalDevices || 0})
          </button>
          <button 
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({stats.approvedDevices || 0})
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pendingDevices || 0})
          </button>
          <button 
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        {/* Devices Grid */}
        <div className="devices-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading devices...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="empty-state">
              <FiZap className="empty-icon" />
              <h3>No devices found</h3>
              <p>
                {filter === 'all' 
                  ? "You haven't registered any devices yet." 
                  : `No ${filter} devices found.`
                }
              </p>
              {filter === 'all' && (
                <button 
                  className="empty-action-btn"
                  onClick={() => navigate('/register-device')}
                >
                  <FiPlus />
                  Register Your First Device
                </button>
              )}
            </div>
          ) : (
            <div className="devices-grid">
              {devices.map(device => (
                <div key={device._id} className="device-card">
                  <div className="device-header">
                    <div className="device-type">
                      <span className="type-emoji">{getDeviceTypeEmoji(device.deviceType)}</span>
                      <span className="type-name">{device.deviceType}</span>
                    </div>
                    <div className="device-status">
                      {getStatusIcon(device.verificationStatus)}
                      <span className={`status-text ${getStatusColor(device.verificationStatus)}`}>
                        {device.verificationStatus}
                      </span>
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
                        <span className="detail-value">{device.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Registered:</span>
                        <span className="detail-value">
                          {new Date(device.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {device.totalEnergyProduced > 0 && (
                        <div className="detail-item">
                          <span className="detail-label">Energy Produced:</span>
                          <span className="detail-value">{device.totalEnergyProduced} kWh</span>
                        </div>
                      )}
                    </div>

                    {device.description && (
                      <div className="device-description">
                        <p>{device.description}</p>
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
                    
                    {device.verificationStatus !== 'approved' && (
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => navigate(`/devices/${device._id}/edit`)}
                        title="Edit Device"
                      >
                        <FiEdit3 />
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
                      onClick={() => handleDeleteDevice(device._id)}
                      title="Delete Device"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button 
              className="quick-action-card"
              onClick={() => navigate('/register-device')}
            >
              <FiPlus className="action-icon" />
              <span>Register New Device</span>
            </button>
            
            <button 
              className="quick-action-card"
              onClick={() => navigate('/energy-exchange')}
            >
              <FiBarChart2 className="action-icon" />
              <span>Energy Exchange</span>
            </button>
            
            <button 
              className="quick-action-card"
              onClick={() => {/* Export functionality */}}
            >
              <FiDownload className="action-icon" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
