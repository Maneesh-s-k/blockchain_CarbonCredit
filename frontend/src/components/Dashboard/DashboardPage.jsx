import React, { useState } from "react";
import WalletConnect from "../Wallet/WalletConnect";
import { 
  FiZap, 
  FiDollarSign, 
  FiRefreshCw, 
  FiHome,
  FiTool,
  FiShoppingCart,
  FiBarChart2
} from 'react-icons/fi';

export default function DashboardPage({ setIsLoading }) {
  return (
    <div className="dashboard-content">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Welcome to Energy Trading</h1>
        <p className="hero-subtitle">
          Monitor your energy production, trade credits, and manage your devices
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Column - Stats and Chart */}
        <div className="dashboard-left">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FiZap />
              </div>
              <div className="stat-content">
                <div className="stat-value">1,234 kWh</div>
                <div className="stat-change positive">+12.5%</div>
                <div className="stat-label">Energy Produced</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <FiDollarSign />
              </div>
              <div className="stat-content">
                <div className="stat-value">$2,456</div>
                <div className="stat-change positive">+8.2%</div>
                <div className="stat-label">Credits Earned</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <FiRefreshCw />
              </div>
              <div className="stat-content">
                <div className="stat-value">23</div>
                <div className="stat-change positive">+3</div>
                <div className="stat-label">Active Trades</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <FiHome />
              </div>
              <div className="stat-content">
                <div className="stat-value">5</div>
                <div className="stat-change">-</div>
                <div className="stat-label">Registered Devices</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="chart-section">
            <div className="chart-header">
              <h3 className="chart-title">Energy Production Overview</h3>
              <div className="chart-timeframes">
                <button className="timeframe-btn active">24H</button>
                <button className="timeframe-btn">7D</button>
                <button className="timeframe-btn">30D</button>
                <button className="timeframe-btn">1Y</button>
              </div>
            </div>
            <div className="chart-placeholder">
              <FiBarChart2 style={{ fontSize: '48px', color: 'var(--text-muted)' }} />
              <p>Chart will be displayed here</p>
            </div>
          </div>
        </div>

        {/* Right Column - Wallet and Quick Actions */}
        <div className="dashboard-right">
          {/* Wallet Connection */}
          <div className="wallet-section">
            <WalletConnect />
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-btn">
                <span className="action-icon"><FiZap /></span>
                <span>Register Device</span>
              </button>
              <button className="quick-action-btn">
                <span className="action-icon"><FiDollarSign /></span>
                <span>Sell Energy</span>
              </button>
              <button className="quick-action-btn">
                <span className="action-icon"><FiShoppingCart /></span>
                <span>Buy Credits</span>
              </button>
              <button className="quick-action-btn">
                <span className="action-icon"><FiBarChart2 /></span>
                <span>View Reports</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">
                  <FiZap />
                </div>
                <div className="activity-content">
                  <p className="activity-title">Energy Sold</p>
                  <p className="activity-time">2 hours ago</p>
                </div>
                <div className="activity-amount">+$45.20</div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <FiRefreshCw />
                </div>
                <div className="activity-content">
                  <p className="activity-title">Trade Completed</p>
                  <p className="activity-time">5 hours ago</p>
                </div>
                <div className="activity-amount">+$128.50</div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <FiHome />
                </div>
                <div className="activity-content">
                  <p className="activity-title">Device Registered</p>
                  <p className="activity-time">1 day ago</p>
                </div>
                <div className="activity-amount">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
