import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
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
  FiAlertTriangle
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDevices();
  }, [filter, currentPage]);

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

      const response = await apiClient.getUserDevices(params);
      
      if (response.success) {
        setDevices(response.devices);
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
      const response = await apiClient.request(`/devices/${deviceId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setDevices(devices.filter(device => device._id !== deviceId));
        setStats(prev => ({
          ...prev,
          totalDevices: prev.totalDevices - 1
        }));
        // Show success message
        alert('Device deleted successfully');
      } else {
        alert(response.message || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Failed to delete device. Please try again.');
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchDevices();
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh"
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
            <FiAlertTriangle />
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
              <FiLoader className="spinning" />
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
            <>
              <div className="devices-grid">
                {devices.map(device => (
                  <div key={device._id} className="device-card">
                    <div className="device-header">
                      <div className="device-type">
                        <span className="type-emoji">{getDeviceTypeEmoji(device.deviceType)}</span>
                        <span className="type-name">{device.deviceType}</span>
                      </div>
                      <div className="device-status">
                        {getStatusIcon(device.verification?.status || 'pending')}
                        <span className={`status-text ${getStatusColor(device.verification?.status || 'pending')}`}>
                          {device.verification?.status || 'pending'}
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
                          <span className="detail-value">{device.location?.address || device.location}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Registered:</span>
                          <span className="detail-value">
                            {formatDate(device.createdAt)}
                          </span>
                        </div>
                        {device.energyProduction?.totalProduced > 0 && (
                          <div className="detail-item">
                            <span className="detail-label">Energy Produced:</span>
                            <span className="detail-value">{device.energyProduction.totalProduced} kWh</span>
                          </div>
                        )}
                        {device.specifications?.manufacturer && (
                          <div className="detail-item">
                            <span className="detail-label">Manufacturer:</span>
                            <span className="detail-value">{device.specifications.manufacturer}</span>
                          </div>
                        )}
                      </div>

                      {device.description && (
                        <div className="device-description">
                          <p>{device.description}</p>
                        </div>
                      )}

                      {device.verification?.notes && device.verification.status === 'rejected' && (
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
                      
                      {device.verification?.status !== 'approved' && (
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
                        onClick={() => handleDeleteDevice(device._id, device.deviceName)}
                        title="Delete Device"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="pagination-info">
                    Page {pagination.current} of {pagination.pages} 
                    ({pagination.total} total devices)
                  </div>
                  
                  <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
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
              onClick={() => {
                // Export functionality
                const csvData = devices.map(device => ({
                  name: device.deviceName,
                  type: device.deviceType,
                  capacity: device.capacity,
                  status: device.verification?.status,
                  registered: formatDate(device.createdAt)
                }));
                
                const csv = [
                  Object.keys(csvData[0]).join(','),
                  ...csvData.map(row => Object.values(row).join(','))
                ].join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'my-devices.csv';
                a.click();
              }}
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
