import React, { useState } from "react";

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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">1,234 kWh</div>
            <div className="stat-change positive">+12.5%</div>
            <div className="stat-label">Energy Produced</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">$2,456</div>
            <div className="stat-change positive">+8.2%</div>
            <div className="stat-label">Credits Earned</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">23</div>
            <div className="stat-change positive">+3</div>
            <div className="stat-label">Active Trades</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏠</div>
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
          📊 Chart will be displayed here
        </div>
      </div>
    </div>
  );
}
