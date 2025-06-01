import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { blockchainService } from '../../services/blockchainService';
import { 
  FiUser, 
  FiShield, 
  FiBell, 
  FiMoon, 
  FiGlobe, 
  FiSave, 
  FiEdit3, 
  FiLock, 
  FiMail, 
  FiSmartphone,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiCheck,
  FiAlertTriangle,
  FiX,
  FiCamera,
  FiMapPin,
  FiDollarSign,
  FiZap
} from 'react-icons/fi';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    avatar: null,
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });

  // Settings state matching your User model
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      trading: true,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      tradingHistoryVisible: false
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC-8',
      autoAcceptOffers: false,
      maxTradeAmount: 1000,
      preferredEnergyTypes: []
    },
    security: {
      twoFactorAuth: {
        enabled: false
      }
    }
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // User stats
  const [userStats, setUserStats] = useState({
    totalDevices: 0,
    totalTrades: 0,
    totalEnergyProduced: 0,
    totalEnergyTraded: 0,
    averageRating: 0,
    totalRatings: 0
  });

  const { user, logout } = useAuth();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data
      const profileResponse = await apiService.getProfile();
      
      if (profileResponse.success) {
        const userData = profileResponse.user;
        
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          avatar: userData.avatar || null,
          location: {
            address: userData.location?.address || '',
            city: userData.location?.city || '',
            state: userData.location?.state || '',
            country: userData.location?.country || '',
            zipCode: userData.location?.zipCode || ''
          }
        });

        setSettings({
          notifications: {
            email: userData.preferences?.notifications?.email ?? true,
            push: userData.preferences?.notifications?.push ?? false,
            trading: userData.preferences?.notifications?.trading ?? true,
            marketing: userData.preferences?.notifications?.marketing ?? false
          },
          privacy: {
            profileVisible: userData.preferences?.privacy?.profileVisible ?? true,
            tradingHistoryVisible: userData.preferences?.privacy?.tradingHistoryVisible ?? false
          },
          preferences: {
            theme: 'dark',
            language: 'en',
            currency: 'USD',
            timezone: 'UTC-8',
            autoAcceptOffers: userData.preferences?.trading?.autoAcceptOffers ?? false,
            maxTradeAmount: userData.preferences?.trading?.maxTradeAmount ?? 1000,
            preferredEnergyTypes: userData.preferences?.trading?.preferredEnergyTypes || []
          },
          security: {
            twoFactorAuth: {
              enabled: userData.security?.twoFactorAuth?.enabled ?? false
            }
          }
        });

        setUserStats({
          totalDevices: userData.statistics?.totalDevices || 0,
          totalTrades: userData.statistics?.totalTrades || 0,
          totalEnergyProduced: userData.statistics?.totalEnergyProduced || 0,
          totalEnergyTraded: userData.statistics?.totalEnergyTraded || 0,
          averageRating: userData.statistics?.averageRating || 0,
          totalRatings: userData.statistics?.totalRatings || 0
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleProfileChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');

      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location,
        preferences: {
          notifications: settings.notifications,
          privacy: settings.privacy,
          trading: {
            autoAcceptOffers: settings.preferences.autoAcceptOffers,
            maxTradeAmount: settings.preferences.maxTradeAmount,
            preferredEnergyTypes: settings.preferences.preferredEnergyTypes
          }
        }
      };

      const response = await apiService.updateProfile(updateData);
      
      if (response.success) {
        setSuccess('Settings saved successfully! 🎉');
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        setSuccess('Password changed successfully! 🎉');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG and PNG images are allowed');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiService.uploadAvatar(formData);
      
      if (response.success) {
        setProfileData(prev => ({ ...prev, avatar: response.avatarUrl }));
        setSuccess('Avatar updated successfully! 🎉');
      } else {
        throw new Error(response.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const energyTypes = ['solar', 'wind', 'hydro', 'geothermal', 'biomass'];

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Settings Header */}
        <div className="settings-header">
          <div className="header-content">
            <h1>Settings</h1>
            <p>Manage your account preferences and security settings</p>
          </div>
          <button 
            onClick={handleSave} 
            className="save-btn"
            disabled={isLoading}
          >
            {isLoading ? <FiRefreshCw className="spinning" /> : <FiSave />}
            Save Changes
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="message-banner error">
            <FiAlertTriangle />
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {success && (
          <div className="message-banner success">
            <FiCheck />
            {success}
            <button onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        <div className="settings-layout">
          {/* Settings Navigation */}
          <div className="settings-nav">
            <button 
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <FiUser />
              Profile
            </button>
            <button 
              className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => setActiveSection('security')}
            >
              <FiShield />
              Security
            </button>
            <button 
              className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <FiBell />
              Notifications
            </button>
            <button 
              className={`nav-item ${activeSection === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveSection('preferences')}
            >
              <FiGlobe />
              Preferences
            </button>
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="settings-section">
                <h2>Profile Information</h2>
                
                {/* Profile Avatar */}
                <div className="profile-avatar">
                  <div className="avatar-container">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Profile" className="avatar-image" />
                    ) : (
                      <div className="avatar-placeholder">
                        <FiUser />
                      </div>
                    )}
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="avatar-upload" className="change-avatar-btn">
                      <FiCamera />
                      Change Avatar
                    </label>
                  </div>
                  <div className="avatar-info">
                    <h3>{profileData.firstName} {profileData.lastName}</h3>
                    <p>{profileData.email}</p>
                    <div className="user-stats">
                      <span><FiZap /> {userStats.totalTrades} trades</span>
                      <span><FiDollarSign /> {userStats.averageRating.toFixed(1)} rating</span>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      placeholder="Email cannot be changed"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={profileData.location.address}
                      onChange={(e) => handleProfileChange('location.address', e.target.value)}
                      placeholder="Enter your address"
                    />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={profileData.location.city}
                      onChange={(e) => handleProfileChange('location.city', e.target.value)}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={profileData.location.state}
                      onChange={(e) => handleProfileChange('location.state', e.target.value)}
                      placeholder="Enter your state"
                    />
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={profileData.location.country}
                      onChange={(e) => handleProfileChange('location.country', e.target.value)}
                      placeholder="Enter your country"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows="4"
                      maxLength="500"
                    />
                    <div className="char-count">
                      {profileData.bio?.length || 0}/500
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>
                
                <div className="security-item">
                  <div className="security-header">
                    <FiLock />
                    <div>
                      <h3>Change Password</h3>
                      <p>Change your account password</p>
                    </div>
                  </div>
                  <button 
                    className="security-action"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </button>
                </div>

                <div className="security-item">
                  <div className="security-header">
                    <FiShield />
                    <div>
                      <h3>Two-Factor Authentication</h3>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactorAuth.enabled}
                      onChange={(e) => handleSettingChange('security', 'twoFactorAuth', { enabled: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-header">
                    <FiMail />
                    <div>
                      <h3>Email Verification</h3>
                      <p>Verify your email address for account security</p>
                    </div>
                  </div>
                  <div className="verification-status verified">
                    Verified
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Preferences</h2>
                
                <div className="notification-group">
                  <h3>Communication</h3>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Email Notifications</h4>
                      <p>Receive notifications via email</p>
                    </div>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Push Notifications</h4>
                      <p>Receive push notifications on your device</p>
                    </div>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.push}
                        onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>
                </div>

                <div className="notification-group">
                  <h3>Trading</h3>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Trading Alerts</h4>
                      <p>Get notified about trading opportunities and completed trades</p>
                    </div>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.trading}
                        onChange={(e) => handleSettingChange('notifications', 'trading', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>

                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Marketing Emails</h4>
                      <p>Receive updates about new features and promotions</p>
                    </div>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.marketing}
                        onChange={(e) => handleSettingChange('notifications', 'marketing', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="settings-section">
                <h2>Trading Preferences</h2>
                
                <div className="preference-group">
                  <h3>Trading Settings</h3>
                  
                  <div className="preference-item">
                    <label>Auto-Accept Offers</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.preferences.autoAcceptOffers}
                        onChange={(e) => handleSettingChange('preferences', 'autoAcceptOffers', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>

                  <div className="preference-item">
                    <label>Maximum Trade Amount ($)</label>
                    <input
                      type="number"
                      value={settings.preferences.maxTradeAmount}
                      onChange={(e) => handleSettingChange('preferences', 'maxTradeAmount', parseInt(e.target.value))}
                      min="0"
                      max="100000"
                      step="100"
                    />
                  </div>

                  <div className="preference-item">
                    <label>Profile Visibility</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.privacy.profileVisible}
                        onChange={(e) => handleSettingChange('privacy', 'profileVisible', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>

                  <div className="preference-item">
                    <label>Trading History Visibility</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.privacy.tradingHistoryVisible}
                        onChange={(e) => handleSettingChange('privacy', 'tradingHistoryVisible', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </div>
                </div>

                <div className="preference-group">
                  <h3>Preferred Energy Types</h3>
                  <div className="energy-types-grid">
                    {energyTypes.map(type => (
                      <div key={type} className="energy-type-item">
                        <input
                          type="checkbox"
                          id={type}
                          checked={settings.preferences.preferredEnergyTypes.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...settings.preferences.preferredEnergyTypes, type]
                              : settings.preferences.preferredEnergyTypes.filter(t => t !== type);
                            handleSettingChange('preferences', 'preferredEnergyTypes', newTypes);
                          }}
                        />
                        <label htmlFor={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)}>
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                      className="password-toggle"
                    >
                      {showPassword.current ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                      className="password-toggle"
                    >
                      {showPassword.new ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                      className="password-toggle"
                    >
                      {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowPasswordModal(false)} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePasswordChange} 
                  className="confirm-btn"
                  disabled={isLoading}
                >
                  {isLoading ? <FiRefreshCw className="spinning" /> : <FiCheck />}
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
