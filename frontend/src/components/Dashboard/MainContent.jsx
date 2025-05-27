import React from "react";

export default function MainContent() {
  return (
    <div className="ocswap-layout">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="nav-links">
          <span className="nav-link active">Swap</span>
          <span className="nav-link">Liquidity</span>
          <span className="nav-link">Staking</span>
          <span className="nav-link">History</span>
        </div>
        <div className="top-actions">
          <div className="network-selector">
            <span className="network-icon">🌐</span>
            <span>Ethereum</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          <button className="connect-wallet-btn">Connect Wallet</button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Content */}
        <div className="left-content">
          {/* Hero Section */}
          <div className="hero-section">
            <h1 className="hero-title">Instantly Exchange Your Tokens on OCS!</h1>
            <p className="hero-subtitle">
              Enjoy quick and smooth token swaps using our user-friendly platform. 
              Our service makes it a breeze for you to exchange tokens without any hassle.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">$42,069.69</div>
                <div className="stat-change positive">+0.82%</div>
                <div className="stat-label">OCS/USDT</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">$98,430,320.06</div>
                <div className="stat-label">Market Cap</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-value">$98,430,320.06</div>
                <div className="stat-label">Volume Traded</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="chart-section">
            <div className="chart-header">
              <h3 className="chart-title">Overview Statistic</h3>
              <div className="chart-timeframes">
                <button className="timeframe-btn active">15m</button>
                <button className="timeframe-btn">1h</button>
                <button className="timeframe-btn">4h</button>
                <button className="timeframe-btn">1d</button>
                <button className="timeframe-btn">3d</button>
                <button className="timeframe-btn">1w</button>
                <button className="timeframe-btn">1m</button>
                <button className="timeframe-btn">5s</button>
              </div>
            </div>
            <div className="chart-placeholder">
              <div className="chart-content">
                📊 Trading Chart Will Appear Here
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Swap Panel */}
        <div className="swap-panel">
          <div className="swap-header">
            <h3 className="swap-title">Swap</h3>
            <div className="swap-actions">
              <span className="gwei-indicator">0.6 GWEI</span>
              <button className="settings-btn">⚙️</button>
            </div>
          </div>

          <div className="swap-form">
            {/* You Send */}
            <div className="token-input">
              <div className="token-input-header">
                <span className="token-label">You Send</span>
                <span className="token-balance">Bal: 32.6</span>
              </div>
              <div className="token-input-body">
                <input 
                  type="text" 
                  className="amount-input" 
                  placeholder="0.0"
                  defaultValue="6,832.42"
                />
                <div className="token-selector">
                  <span className="token-icon">🪙</span>
                  <span>OCS</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
              </div>
              <div className="token-value">MAX 6,832.42</div>
            </div>

            {/* Swap Arrow */}
            <div className="swap-arrow">
              <button className="swap-arrow-btn">
                ↕️
              </button>
            </div>

            {/* You Receive */}
            <div className="token-input">
              <div className="token-input-header">
                <span className="token-label">You Receive</span>
                <span className="token-balance">Bal: 10,034</span>
              </div>
              <div className="token-input-body">
                <input 
                  type="text" 
                  className="amount-input" 
                  placeholder="0.0"
                  defaultValue="6,832.42"
                />
                <div className="token-selector">
                  <span className="token-icon">💵</span>
                  <span>USDT</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
              </div>
            </div>

            {/* Swap Details */}
            <div className="swap-details">
              <div className="swap-detail-row">
                <span className="detail-label">Slippage Tolerance</span>
                <span className="detail-value">0.5%</span>
              </div>
              <div className="swap-detail-row">
                <span className="detail-label">Minimum Received</span>
                <span className="detail-value">100.423 USDT</span>
              </div>
              <div className="swap-detail-row">
                <span className="detail-label">Trading Fee</span>
                <span className="detail-value">0.0000043 BNB</span>
              </div>
              <div className="swap-detail-row">
                <span className="detail-label">Price Impact</span>
                <span className="detail-value">0.5%</span>
              </div>
            </div>

            <div className="receive-option">
              <label>
                <input type="checkbox" />
                Receive new tokens in another wallet?
              </label>
            </div>

            <button className="connect-wallet-btn-large">Connect Wallet</button>
          </div>
        </div>
      </div>
    </div>
  );
}
