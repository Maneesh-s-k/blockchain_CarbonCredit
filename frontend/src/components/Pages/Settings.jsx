import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavBar from "../Dashboard/SideNavBar.jsx";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState({
    email: "user@example.com",
    phone: "+1 (555) 123-4567",
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    privacy: {
      profileVisible: true,
      dataSharing: false,
    }
  });

  const handleNotificationChange = (type) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  return (
    <div className="dashboard-container">
      <SideNavBar />
      
      <div className="main-dashboard">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>Settings</h1>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            Account
          </button>
          <button 
            className={`tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </button>
          <button 
            className={`tab ${activeTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            Privacy
          </button>
        </div>

        <div className="page-content">
          {activeTab === "account" && (
            <div className="card">
              <h3>Account Information</h3>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={settings.email} readOnly />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" value={settings.phone} readOnly />
              </div>
              <div className="form-actions">
                <button className="btn-confirm">Edit Profile</button>
                <button className="btn-cancel">Change Password</button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="card">
              <h3>Notification Preferences</h3>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  Email Notifications
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.sms}
                    onChange={() => handleNotificationChange('sms')}
                  />
                  SMS Notifications
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                  Push Notifications
                </label>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="card">
              <h3>Privacy Settings</h3>
              <div className="setting-item">
                <label>
                  <input type="checkbox" checked={settings.privacy.profileVisible} readOnly />
                  Make profile visible to other users
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" checked={settings.privacy.dataSharing} readOnly />
                  Allow data sharing for analytics
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
