import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../services/api';
import { 
  FiUser, 
  FiMail, 
  FiPhone,
  FiMapPin,
  FiEdit3,
  FiSave,
  FiX,
  FiCamera,
  FiLoader
} from 'react-icons/fi';

export default function Profile() {
  const { user, checkAuthStatus } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: ''
    }
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: {
          address: user.location?.address || '',
          city: user.location?.city || '',
          state: user.location?.state || '',
          country: user.location?.country || ''
        }
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
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
        [name]: value
      }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Upload avatar if selected
      if (avatarFile) {
        await apiClient.uploadAvatar(avatarFile);
      }

      // Update profile
      const response = await apiClient.updateProfile(profileData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setAvatarFile(null);
        await checkAuthStatus(); // Refresh user data
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setMessage({ type: '', text: '' });
    // Reset form data
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: {
          address: user.location?.address || '',
          city: user.location?.city || '',
          state: user.location?.state || '',
          country: user.location?.country || ''
        }
      });
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information and preferences</p>
        </div>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        <div className="profile-content">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              <div className="avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" />
                ) : (
                  <FiUser />
                )}
                {isEditing && (
                  <label className="avatar-upload">
                    <FiCamera />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              {avatarFile && (
                <div className="avatar-preview">
                  <span>New avatar selected: {avatarFile.name}</span>
                </div>
              )}
            </div>
            <div className="user-info">
              <h2>{user?.fullName || user?.username}</h2>
              <p>@{user?.username}</p>
              <span className="join-date">
                Member since {new Date(user?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            <div className="form-header">
              <h3>Personal Information</h3>
              {!isEditing ? (
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FiEdit3 />
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <FiX />
                    Cancel
                  </button>
                  <button 
                    className="save-btn"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? <FiLoader className="spinning" /> : <FiSave />}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  <FiUser />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="form-group">
                <label>
                  <FiUser />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your last name"
                />
              </div>

              <div className="form-group">
                <label>
                  <FiMail />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={true} // Email should not be editable
                  placeholder="Enter your email"
                />
                <small>Email cannot be changed. Contact support if needed.</small>
              </div>

              <div className="form-group">
                <label>
                  <FiPhone />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group full-width">
                <label>
                  <FiUser />
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows="3"
                  maxLength="500"
                />
                <small>{profileData.bio.length}/500 characters</small>
              </div>

              <div className="form-group">
                <label>
                  <FiMapPin />
                  Address
                </label>
                <input
                  type="text"
                  name="location.address"
                  value={profileData.location.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Street address"
                />
              </div>

              <div className="form-group">
                <label>
                  <FiMapPin />
                  City
                </label>
                <input
                  type="text"
                  name="location.city"
                  value={profileData.location.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="City"
                />
              </div>

              <div className="form-group">
                <label>
                  <FiMapPin />
                  State
                </label>
                <input
                  type="text"
                  name="location.state"
                  value={profileData.location.state}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="State"
                />
              </div>

              <div className="form-group">
                <label>
                  <FiMapPin />
                  Country
                </label>
                <input
                  type="text"
                  name="location.country"
                  value={profileData.location.country}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Account Statistics */}
          <div className="account-stats">
            <h3>Account Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{user?.statistics?.totalDevices || 0}</span>
                <span className="stat-label">Devices Registered</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user?.statistics?.totalTrades || 0}</span>
                <span className="stat-label">Total Trades</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user?.statistics?.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="stat-label">Average Rating</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user?.statistics?.totalEnergyProduced || 0} kWh</span>
                <span className="stat-label">Energy Produced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
