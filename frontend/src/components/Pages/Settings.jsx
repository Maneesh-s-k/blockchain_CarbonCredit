import React, { useState } from 'react';
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
  FiSmartphone
} from 'react-icons/fi';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      trading: true,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      tradingHistoryVisible: false,
      twoFactor: false
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC-8'
    }
  });

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Implement save logic
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="header-content">
            <h1>Settings</h1>
            <p>Manage your account preferences and security settings</p>
          </div>
          <div className="header-actions">
            <button className="save-btn" onClick={handleSave}>
              <FiSave />
              Save Changes
            </button>
          </div>
        </div>

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
              <FiMoon />
              Preferences
            </button>
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {activeSection === 'profile' && (
              <div className="settings-section">
                <h2>Profile Information</h2>
                
                <div className="profile-avatar">
                  <div className="avatar-placeholder">
                    <FiUser />
                  </div>
                  <button className="change-avatar-btn">
                    <FiEdit3 />
                    Change Avatar
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" defaultValue="John" />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" defaultValue="Doe" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" defaultValue="john.doe@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                  <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea 
                      rows="3" 
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>
                
                <div className="security-item">
                  <div className="security-header">
                    <FiLock />
                    <div>
                      <h3>Password</h3>
                      <p>Change your account password</p>
                    </div>
                  </div>
                  <button className="security-action">Change Password</button>
                </div>

                <div className="security-item">
                  <div className="security-header">
                    <FiSmartphone />
                    <div>
                      <h3>Two-Factor Authentication</h3>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.twoFactor}
                      onChange={(e) => handleSettingChange('privacy', 'twoFactor', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="security-item">
                  <div className="security-header">
                    <FiMail />
                    <div>
                      <h3>Email Verification</h3>
                      <p>Verify your email address for account security</p>
                    </div>
                  </div>
                  <span className="verification-status verified">Verified</span>
                </div>
              </div>
            )}

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
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.email}
                        onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Push Notifications</h4>
                      <p>Receive push notifications on your device</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.push}
                        onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="notification-group">
                  <h3>Trading</h3>
                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Trading Alerts</h4>
                      <p>Get notified about trading opportunities and completed trades</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.trading}
                        onChange={(e) => handleSettingChange('notifications', 'trading', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="notification-group">
                  <h3>Marketing</h3>
                  <div className="notification-item">
                    <div className="notification-info">
                      <h4>Marketing Emails</h4>
                      <p>Receive updates about new features and promotions</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.marketing}
                        onChange={(e) => handleSettingChange('notifications', 'marketing', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="settings-section">
                <h2>App Preferences</h2>
                
                <div className="preference-group">
                  <h3>Appearance</h3>
                  <div className="preference-item">
                    <label>Theme</label>
                    <select 
                      value={settings.preferences.theme}
                      onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div className="preference-group">
                  <h3>Localization</h3>
                  <div className="preference-item">
                    <label>Language</label>
                    <select 
                      value={settings.preferences.language}
                      onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div className="preference-item">
                    <label>Currency</label>
                    <select 
                      value={settings.preferences.currency}
                      onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  
                  <div className="preference-item">
                    <label>Timezone</label>
                    <select 
                      value={settings.preferences.timezone}
                      onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                    >
                      <option value="UTC-8">Pacific Time (UTC-8)</option>
                      <option value="UTC-5">Eastern Time (UTC-5)</option>
                      <option value="UTC+0">GMT (UTC+0)</option>
                      <option value="UTC+1">Central European Time (UTC+1)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
