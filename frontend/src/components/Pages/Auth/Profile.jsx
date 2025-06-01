import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/apiService';
import { blockchainService } from '../../../services/blockchainService';
import '../../../styles/components/profile.css';

// Icons (same as before)
const Icons = {
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Chart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Camera: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>,
  Dollar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  TrendUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  Star: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Loader: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  AlertTriangle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Profile data from API
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
    },
    preferences: {
      notifications: {
        email: true,
        push: false,
        trading: true,
        marketing: false
      },
      privacy: {
        profileVisible: true,
        tradingHistoryVisible: false
      }
    }
  });

  // User statistics from API
  const [userStats, setUserStats] = useState({
    totalTrades: 0,
    totalEnergyTraded: 0,
    totalRevenue: 0,
    carbonCreditsOwned: 0,
    devicesRegistered: 0,
    joinDate: '',
    lastLogin: '',
    verificationLevel: 'basic',
    averageRating: 0,
    totalRatings: 0
  });

  // Blockchain info from API
  const [blockchainInfo, setBlockchainInfo] = useState({
    address: '',
    ethBalance: 0,
    tokensOwned: 0,
    isConnected: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const { user } = useAuth();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Icons.User },
    { id: 'edit', label: 'Edit Profile', icon: Icons.Edit },
    { id: 'stats', label: 'Statistics', icon: Icons.Chart },
    { id: 'blockchain', label: 'Blockchain', icon: Icons.Shield }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  // Load all profile data from APIs
  const loadAllData = async () => {
    try {
      setDataLoading(true);
      setError('');

      // Load profile data, stats, and blockchain info in parallel
      await Promise.all([
        loadProfileData(),
        loadUserStatistics(),
        loadBlockchainData()
      ]);

    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load some profile data. Please refresh the page.');
    } finally {
      setDataLoading(false);
    }
  };

  // Load user profile data
  const loadProfileData = async () => {
    try {
      const response = await apiService.getProfile();
      
      if (response.success && response.user) {
        setProfileData({
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          email: response.user.email || user?.email || '',
          phone: response.user.phone || '',
          bio: response.user.bio || '',
          avatar: response.user.avatar || null,
          location: {
            address: response.user.location?.address || '',
            city: response.user.location?.city || '',
            state: response.user.location?.state || '',
            country: response.user.location?.country || '',
            zipCode: response.user.location?.zipCode || ''
          },
          preferences: {
            notifications: {
              email: response.user.preferences?.notifications?.email ?? true,
              push: response.user.preferences?.notifications?.push ?? false,
              trading: response.user.preferences?.notifications?.trading ?? true,
              marketing: response.user.preferences?.notifications?.marketing ?? false
            },
            privacy: {
              profileVisible: response.user.preferences?.privacy?.profileVisible ?? true,
              tradingHistoryVisible: response.user.preferences?.privacy?.tradingHistoryVisible ?? false
            }
          }
        });
      } else {
        // Use fallback data from AuthContext
        setProfileData(prev => ({
          ...prev,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      // Use fallback data from AuthContext
      setProfileData(prev => ({
        ...prev,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
      }));
    }
  };

  // Load user statistics
  const loadUserStatistics = async () => {
    try {
      // Load dashboard data
      const dashboardResponse = await apiService.getDashboardData();
      
      // Load trading analytics
      const tradingResponse = await apiService.getTradingAnalytics('30d');
      
      // Load user devices
      const devicesResponse = await apiService.getUserDevices();
      
      // Load transaction history for additional stats
      const transactionsResponse = await apiService.getUserTransactions({ limit: 100 });

      // Calculate statistics from API responses
      const stats = {
        totalTrades: 0,
        totalEnergyTraded: 0,
        totalRevenue: 0,
        carbonCreditsOwned: 0,
        devicesRegistered: 0,
        joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        lastLogin: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : new Date().toLocaleDateString(),
        verificationLevel: user?.verification?.status || 'basic',
        averageRating: 0,
        totalRatings: 0
      };

      // Process dashboard data
      if (dashboardResponse.success) {
        stats.carbonCreditsOwned = dashboardResponse.carbonCredits?.length || 0;
      }

      // Process trading analytics
      if (tradingResponse.success && tradingResponse.statistics) {
        stats.totalTrades = tradingResponse.statistics.totalTransactions || 0;
        stats.totalEnergyTraded = tradingResponse.statistics.totalVolume || 0;
        stats.totalRevenue = tradingResponse.statistics.totalValue || 0;
      }

      // Process devices data
      if (devicesResponse.success) {
        stats.devicesRegistered = devicesResponse.devices?.length || 0;
      }

      // Process transactions for additional stats
      if (transactionsResponse.success && transactionsResponse.transactions) {
        const transactions = transactionsResponse.transactions;
        
        // Calculate total trades if not available from analytics
        if (stats.totalTrades === 0) {
          stats.totalTrades = transactions.filter(t => t.type === 'trade').length;
        }
        
        // Calculate total revenue if not available from analytics
        if (stats.totalRevenue === 0) {
          stats.totalRevenue = transactions
            .filter(t => t.type === 'sale')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        }
      }

      // Get user ratings/reviews (if available)
      try {
        const userPublicProfile = await apiService.getUserPublicProfile(user?.id);
        if (userPublicProfile.success) {
          stats.averageRating = userPublicProfile.user.averageRating || 0;
          stats.totalRatings = userPublicProfile.user.totalRatings || 0;
        }
      } catch (error) {
        console.log('User public profile not available');
      }

      setUserStats(stats);

    } catch (error) {
      console.error('Error loading user statistics:', error);
      // Keep default values if API calls fail
    }
  };

  // Load blockchain data
  const loadBlockchainData = async () => {
    try {
      // Check if wallet is connected
      const account = await blockchainService.getAccount();
      
      if (account) {
        // Get wallet balance
        const balance = await blockchainService.getBalance(account);
        
        // Get user tokens
        const tokens = await blockchainService.getUserTokens(account);
        
        setBlockchainInfo({
          address: account,
          ethBalance: parseFloat(balance) || 0,
          tokensOwned: tokens?.length || 0,
          isConnected: true
        });
      } else {
        setBlockchainInfo({
          address: '',
          ethBalance: 0,
          tokensOwned: 0,
          isConnected: false
        });
      }
    } catch (error) {
      console.error('Error loading blockchain data:', error);
      setBlockchainInfo({
        address: '',
        ethBalance: 0,
        tokensOwned: 0,
        isConnected: false
      });
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      setError('');

      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location
      };

      const response = await apiService.updateProfile(updateData);

      if (response.success) {
        setSuccess('Profile updated successfully! 🎉');
        
        // Reload profile data to get updated info
        await loadProfileData();
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
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

  // Upload avatar
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

  // Update notification preferences
  const handleNotificationUpdate = async (preferences) => {
    try {
      const response = await apiService.updateNotificationPreferences(preferences);
      
      if (response.success) {
        setProfileData(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            notifications: preferences
          }
        }));
        setSuccess('Notification preferences updated! 🎉');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      setError('Failed to update notification preferences');
    }
  };

  // Update privacy settings
  const handlePrivacyUpdate = async (privacySettings) => {
    try {
      const response = await apiService.updatePrivacySettings(privacySettings);
      
      if (response.success) {
        setProfileData(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            privacy: privacySettings
          }
        }));
        setSuccess('Privacy settings updated! 🎉');
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setError('Failed to update privacy settings');
    }
  };

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      await blockchainService.connectWallet();
      await loadBlockchainData();
      setSuccess('Wallet connected successfully! 🎉');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get verification badge
  const getVerificationBadge = () => {
    switch (userStats.verificationLevel) {
      case 'verified':
        return { icon: Icons.Shield, text: 'Verified', color: '#10B981' };
      case 'premium':
        return { icon: Icons.Star, text: 'Premium', color: '#F59E0B' };
      default:
        return { icon: Icons.User, text: 'Basic', color: '#6B7280' };
    }
  };

  const verificationBadge = getVerificationBadge();

  // Show loading screen while data is loading
  if (dataLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="glass-panel profile-header">
            <div className="loading-content">
              <Icons.Loader />
              <span>Loading profile data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="profile-tab-content">
            <div className="profile-overview-layout">
              <div className="glass-card profile-main-card">
                <div className="profile-header-section">
                  <div className="avatar-section">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Profile" className="profile-avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        <Icons.User />
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h2>{profileData.firstName} {profileData.lastName}</h2>
                    <p className="profile-email">{profileData.email}</p>
                    <div className="glass-badge verification-badge" style={{ color: verificationBadge.color }}>
                      <verificationBadge.icon />
                      <span>{verificationBadge.text}</span>
                    </div>
                    <div className="rating-display">
                      <Icons.Star />
                      <span>{userStats.averageRating.toFixed(1)} ({userStats.totalRatings} reviews)</span>
                    </div>
                  </div>
                </div>
                
                {profileData.bio && (
                  <div className="bio-section">
                    <h4>About</h4>
                    <p>{profileData.bio}</p>
                  </div>
                )}

                <div className="contact-info">
                  <div className="info-item">
                    <Icons.Phone />
                    <span>{profileData.phone || 'No phone number'}</span>
                  </div>
                  <div className="info-item">
                    <Icons.MapPin />
                    <span>
                      {profileData.location.city && profileData.location.state 
                        ? `${profileData.location.city}, ${profileData.location.state}`
                        : 'Location not set'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <Icons.Calendar />
                    <span>Joined {userStats.joinDate || 'Recently'}</span>
                  </div>
                  <div className="info-item">
                    <Icons.Activity />
                    <span>Last active {userStats.lastLogin || 'Today'}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card stats-sidebar">
                <h3>Quick Stats</h3>
                <div className="stats-list">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Icons.Zap />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{userStats.totalTrades}</span>
                      <span className="stat-label">Total Trades</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-icon">
                      <Icons.Dollar />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">${userStats.totalRevenue.toFixed(0)}</span>
                      <span className="stat-label">Total Revenue</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-icon">
                      <Icons.TrendUp />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{userStats.totalEnergyTraded} kWh</span>
                      <span className="stat-label">Energy Traded</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-icon">
                      <Icons.Shield />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{userStats.devicesRegistered}</span>
                      <span className="stat-label">Devices</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'edit':
        return (
          <div className="profile-tab-content">
            <div className="edit-sections">
              <div className="glass-card">
                <h3>Profile Picture</h3>
                <div className="avatar-upload-section">
                  <div className="current-avatar">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Profile" className="profile-avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        <Icons.User />
                      </div>
                    )}
                  </div>
                  <div className="upload-controls">
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="avatar-upload" className="glass-button upload-btn">
                      <Icons.Camera />
                      Change Photo
                    </label>
                    <p>JPG, PNG up to 5MB</p>
                  </div>
                </div>
              </div>

              <div className="glass-card">
                <h3>Personal Information</h3>
                <div className="form-grid">
                  <div className="glass-form-group">
                    <label className="glass-label">First Name</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-label">Last Name</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-label">Email Address</label>
                    <input
                      type="email"
                      className="glass-input disabled"
                      value={profileData.email}
                      disabled
                    />
                    <small>Email cannot be changed</small>
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-label">Phone Number</label>
                    <input
                      type="tel"
                      className="glass-input"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="glass-form-group full-width">
                    <label className="glass-label">Bio</label>
                    <textarea
                      className="glass-textarea"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
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

              <div className="glass-card">
                <h3>Location</h3>
                <div className="form-grid">
                  <div className="glass-form-group">
                    <label className="glass-label">Address</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={profileData.location.address}
                      onChange={(e) => setProfileData({
                        ...profileData, 
                        location: {...profileData.location, address: e.target.value}
                      })}
                      placeholder="Enter your address"
                    />
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-label">City</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={profileData.location.city}
                      onChange={(e) => setProfileData({
                        ...profileData, 
                        location: {...profileData.location, city: e.target.value}
                      })}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-label">State</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={profileData.location.state}
                      onChange={(e) => setProfileData({
                        ...profileData, 
                        location: {...profileData.location, state: e.target.value}
                      })}
                      placeholder="Enter your state"
                    />
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-label">Country</label>
                    <input
                      type="text"
                      className="glass-input"
                      value={profileData.location.country}
                      onChange={(e) => setProfileData({
                        ...profileData, 
                        location: {...profileData.location, country: e.target.value}
                      })}
                      placeholder="Enter your country"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="glass-card">
                <h3>Notification Preferences</h3>
                <div className="preferences-grid">
                  <div className="preference-item">
                    <label className="preference-label">
                      <input
                        type="checkbox"
                        checked={profileData.preferences.notifications.email}
                        onChange={(e) => handleNotificationUpdate({
                          ...profileData.preferences.notifications,
                          email: e.target.checked
                        })}
                      />
                      Email Notifications
                    </label>
                  </div>
                  <div className="preference-item">
                    <label className="preference-label">
                      <input
                        type="checkbox"
                        checked={profileData.preferences.notifications.push}
                        onChange={(e) => handleNotificationUpdate({
                          ...profileData.preferences.notifications,
                          push: e.target.checked
                        })}
                      />
                      Push Notifications
                    </label>
                  </div>
                  <div className="preference-item">
                    <label className="preference-label">
                      <input
                        type="checkbox"
                        checked={profileData.preferences.notifications.trading}
                        onChange={(e) => handleNotificationUpdate({
                          ...profileData.preferences.notifications,
                          trading: e.target.checked
                        })}
                      />
                      Trading Updates
                    </label>
                  </div>
                  <div className="preference-item">
                    <label className="preference-label">
                      <input
                        type="checkbox"
                        checked={profileData.preferences.notifications.marketing}
                        onChange={(e) => handleNotificationUpdate({
                          ...profileData.preferences.notifications,
                          marketing: e.target.checked
                        })}
                      />
                      Marketing Emails
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="profile-tab-content">
            <div className="stats-grid">
              <div className="glass-card stat-card">
                <div className="stat-header">
                  <Icons.Zap />
                  <h4>Energy Trading</h4>
                </div>
                <div className="stat-metrics">
                  <div className="metric">
                    <span className="metric-value">{userStats.totalTrades}</span>
                    <span className="metric-label">Total Trades</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{userStats.totalEnergyTraded} kWh</span>
                    <span className="metric-label">Energy Traded</span>
                  </div>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <Icons.Dollar />
                  <h4>Financial Performance</h4>
                </div>
                <div className="stat-metrics">
                  <div className="metric">
                    <span className="metric-value">${userStats.totalRevenue.toFixed(2)}</span>
                    <span className="metric-label">Total Revenue</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">${(userStats.totalRevenue / Math.max(userStats.totalTrades, 1)).toFixed(2)}</span>
                    <span className="metric-label">Avg per Trade</span>
                  </div>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <Icons.Star />
                  <h4>Reputation</h4>
                </div>
                <div className="stat-metrics">
                  <div className="metric">
                    <span className="metric-value">{userStats.averageRating.toFixed(1)}/5.0</span>
                    <span className="metric-label">Average Rating</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{userStats.totalRatings}</span>
                    <span className="metric-label">Total Reviews</span>
                  </div>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <Icons.Shield />
                  <h4>Assets</h4>
                </div>
                <div className="stat-metrics">
                  <div className="metric">
                    <span className="metric-value">{userStats.devicesRegistered}</span>
                    <span className="metric-label">Devices</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{userStats.carbonCreditsOwned}</span>
                    <span className="metric-label">Carbon Credits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'blockchain':
        return (
          <div className="profile-tab-content">
            <div className="glass-card blockchain-card">
              <h3>Blockchain Information</h3>
              
              {blockchainInfo.isConnected ? (
                <div className="blockchain-connected">
                  <div className="glass-badge success connection-status">
                    <Icons.Shield />
                    <span>Wallet Connected</span>
                  </div>

                  <div className="blockchain-details">
                    <div className="blockchain-item">
                      <label>Wallet Address:</label>
                      <span className="address">{blockchainInfo.address}</span>
                    </div>
                    <div className="blockchain-item">
                      <label>ETH Balance:</label>
                      <span>{blockchainInfo.ethBalance.toFixed(4)} ETH</span>
                    </div>
                    <div className="blockchain-item">
                      <label>Carbon Credit Tokens:</label>
                      <span>{blockchainInfo.tokensOwned} tokens</span>
                    </div>
                  </div>

                  <div className="blockchain-actions">
                    <button 
                      className="glass-button secondary"
                      onClick={loadBlockchainData}
                    >
                      <Icons.Loader />
                      Refresh Data
                    </button>
                  </div>
                </div>
              ) : (
                <div className="blockchain-disconnected">
                  <div className="glass-badge danger connection-status">
                    <Icons.X />
                    <span>Wallet Not Connected</span>
                  </div>
                  <p>Connect your wallet to view blockchain information and trade carbon credits.</p>
                  <button 
                    className="glass-button primary connect-wallet-btn"
                    onClick={handleConnectWallet}
                    disabled={isLoading}
                  >
                    {isLoading ? <Icons.Loader /> : <Icons.Shield />}
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="glass-panel profile-header">
          <div className="header-content">
            <h1 className="gradient-text">Profile</h1>
            <p>Manage your account information and view your trading statistics</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setShowPasswordModal(true)} 
              className="glass-button secondary"
            >
              <Icons.Lock />
              <span>Change Password</span>
            </button>
            <button 
              onClick={handleSaveProfile} 
              className="glass-button primary"
              disabled={isLoading}
            >
              {isLoading ? <Icons.Loader /> : <Icons.Save />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-badge danger message-banner">
            <Icons.AlertTriangle />
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="glass-badge success message-banner">
            <Icons.Check />
            {success}
            <button onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        {/* Fixed Navigation Tabs - Full Width */}
        <div className="profile-navigation-wrapper">
          <div className="glass-nav profile-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon />
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {renderTabContent()}
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="glass-overlay modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="glass-modal modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)}>
                  <Icons.X />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="glass-form-group">
                  <label className="glass-label">Current Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      className="glass-input"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                      className="password-toggle"
                    >
                      {showPassword.current ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>

                <div className="glass-form-group">
                  <label className="glass-label">New Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      className="glass-input"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                      className="password-toggle"
                    >
                      {showPassword.new ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>

                <div className="glass-form-group">
                  <label className="glass-label">Confirm New Password</label>
                  <div className="password-input">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      className="glass-input"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                      className="password-toggle"
                    >
                      {showPassword.confirm ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowPasswordModal(false)} 
                  className="glass-button secondary"
                >
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={handlePasswordChange} 
                  className="glass-button primary"
                  disabled={isLoading}
                >
                  {isLoading ? <Icons.Loader /> : <Icons.Check />}
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
