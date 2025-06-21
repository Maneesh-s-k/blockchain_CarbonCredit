// components/Wallet/WalletConnect.jsx - FIXED POSITIONING WITH TOOLTIP
import React, { useState, useEffect, useRef } from 'react';
import { blockchainService } from '../../services/blockchainService';
import { FiCreditCard, FiX, FiMinus, FiMaximize2, FiMinimize2, FiCopy, FiExternalLink, FiRefreshCw, FiShield, FiAlertTriangle, FiCheck, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';

const WalletConnect = ({ blockchainData, onWalletUpdate, onRefresh, isInline = false }) => {
  // Icon position state (separate from window)
  const [iconPosition, setIconPosition] = useState({
    x: window.innerWidth - 100, // RIGHT SIDE with space
    y: window.innerHeight - 100 // BOTTOM with space
  });
  const [isIconDragging, setIsIconDragging] = useState(false);
  const [iconDragOffset, setIconDragOffset] = useState({ x: 0, y: 0 });

  // ✅ NEW: Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);

  // Window states
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowPosition, setWindowPosition] = useState({
    x: (window.innerWidth - 400) / 2, // CENTER HORIZONTALLY
    y: (window.innerHeight - 500) / 2 // CENTER VERTICALLY
  });
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [windowDragOffset, setWindowDragOffset] = useState({ x: 0, y: 0 });

  // Wallet states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: '',
    ethBalance: '0',
    carbonBalance: '0',
    totalTokens: 0,
    network: null
  });

  const windowRef = useRef(null);
  const headerRef = useRef(null);
  const iconRef = useRef(null);

  // MONITOR METAMASK CONNECTION CHANGES
  useEffect(() => {
    checkMetaMaskConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // UPDATE POSITIONS ON WINDOW RESIZE
  useEffect(() => {
    const handleResize = () => {
      // Keep icon in bounds
      setIconPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80)
      }));
      // Keep window in bounds
      setWindowPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 400),
        y: Math.min(prev.y, window.innerHeight - 500)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ICON DRAGGING
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isIconDragging) {
        const newX = Math.max(0, Math.min(e.clientX - iconDragOffset.x, window.innerWidth - 60));
        const newY = Math.max(0, Math.min(e.clientY - iconDragOffset.y, window.innerHeight - 60));
        setIconPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsIconDragging(false);
    };

    if (isIconDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isIconDragging, iconDragOffset]);

  // WINDOW DRAGGING
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isWindowDragging) {
        const newX = Math.max(0, Math.min(e.clientX - windowDragOffset.x, window.innerWidth - 400));
        const newY = Math.max(0, Math.min(e.clientY - windowDragOffset.y, window.innerHeight - 500));
        setWindowPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsWindowDragging(false);
    };

    if (isWindowDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isWindowDragging, windowDragOffset]);

  const handleIconMouseDown = (e) => {
    e.preventDefault();
    setIsIconDragging(true);
    setShowTooltip(false); // ✅ Hide tooltip when dragging
    const rect = iconRef.current.getBoundingClientRect();
    setIconDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleWindowMouseDown = (e) => {
    if (headerRef.current && headerRef.current.contains(e.target)) {
      setIsWindowDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setWindowDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const checkMetaMaskConnection = async () => {
    try {
      if (!window.ethereum) {
        setWalletState(prev => ({ ...prev, isConnected: false }));
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await loadWalletData(accounts[0]);
      } else {
        setWalletState(prev => ({ ...prev, isConnected: false }));
      }
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
      setWalletState(prev => ({ ...prev, isConnected: false }));
    }
  };

  const loadWalletData = async (address) => {
    try {
      const [ethBalance, carbonBalance, network] = await Promise.all([
        blockchainService.getBalance(address).catch(() => '0'),
        blockchainService.getCarbonBalance(address).catch(() => '0'),
        blockchainService.getNetwork().catch(() => null)
      ]);

      const walletData = {
        isConnected: true,
        address,
        ethBalance: ethBalance || '0',
        carbonBalance: carbonBalance.toString() || '0',
        totalTokens: parseInt(carbonBalance) || 0,
        network
      };
      setWalletState(walletData);
      onWalletUpdate(walletData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      const disconnectedData = {
        isConnected: false,
        address: '',
        ethBalance: '0',
        carbonBalance: '0',
        totalTokens: 0,
        network: null
      };
      setWalletState(disconnectedData);
      onWalletUpdate(disconnectedData);
      setSuccess('Wallet disconnected');
    } else {
      loadWalletData(accounts[0]);
      setSuccess('Account changed');
    }
  };

  const handleChainChanged = (chainId) => {
    checkMetaMaskConnection();
    setSuccess('Network changed');
  };

  const handleDisconnect = () => {
    const disconnectedData = {
      isConnected: false,
      address: '',
      ethBalance: '0',
      carbonBalance: '0',
      totalTokens: 0,
      network: null
    };
    setWalletState(disconnectedData);
    onWalletUpdate(disconnectedData);
    setSuccess('Wallet disconnected');
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        await loadWalletData(accounts[0]);
        setSuccess('Wallet connected successfully! 🎉');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    const disconnectedData = {
      isConnected: false,
      address: '',
      ethBalance: '0',
      carbonBalance: '0',
      totalTokens: 0,
      network: null
    };
    setWalletState(disconnectedData);
    onWalletUpdate(disconnectedData);
    setSuccess('Wallet disconnected locally. To fully disconnect, use MetaMask extension.');
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const openEtherscan = () => {
    const baseUrl = walletState.network?.chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
    window.open(`${baseUrl}/address/${walletState.address}`, '_blank');
  };

  const handleIconClick = () => {
    if (!isIconDragging) {
      setIsFloatingOpen(true);
      setIsMinimized(false);
      setShowTooltip(false); // ✅ Hide tooltip when opening
    }
  };

  // If used inline (in sidebar), render the original wallet component
  if (isInline) {
    return (
      <div className="wallet-connect-inline">
        <div className="wallet-header">
          <h3>Wallet Connection</h3>
          <div className={`connection-status-card ${walletState.isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-indicator">
              <FiCreditCard className={`status-icon ${walletState.isConnected ? 'connected' : 'disconnected'}`} />
              <span>{walletState.isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {walletState.network && (
              <div className="network-info">
                <span className="network-label">Network:</span>
                <span className="network-name">{walletState.network.name || 'Unknown'}</span>
              </div>
            )}
          </div>
        </div>

        {walletState.isConnected ? (
          <div className="wallet-details">
            <div className="wallet-address-section">
              <label>Wallet Address</label>
              <div className="address-display">
                <span className="address-text">
                  {`${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`}
                </span>
                <div className="address-actions">
                  <button className="icon-btn" onClick={copyAddress} title="Copy Address">
                    {copied ? <FiCheck /> : <FiCopy />}
                  </button>
                  <button className="icon-btn" onClick={openEtherscan} title="View on Etherscan">
                    <FiExternalLink />
                  </button>
                </div>
              </div>
            </div>

            <div className="balance-section">
              <div className="balance-header">
                <label>Balances</label>
                <button className="toggle-balance-btn" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="balance-grid">
                <div className="balance-item">
                  <div className="balance-label">ETH</div>
                  <div className="balance-value">
                    {showBalance ? parseFloat(walletState.ethBalance).toFixed(4) : '••••'}
                  </div>
                </div>
                <div className="balance-item">
                  <div className="balance-label">Carbon Credits</div>
                  <div className="balance-value">
                    {showBalance ? walletState.totalTokens : '••••'}
                  </div>
                </div>
              </div>
            </div>

            <div className="wallet-quick-actions">
              <button className="wallet-action-btn secondary" onClick={onRefresh}>
                <FiRefreshCw />
                Refresh
              </button>
              <button className="wallet-action-btn danger" onClick={disconnectWallet}>
                <FiX />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="connect-wallet-section">
            <div className="connect-info">
              <FiCreditCard className="connect-icon" />
              <h4>Connect Wallet</h4>
              <p>Connect your MetaMask wallet to start trading energy and carbon credits on the blockchain.</p>
            </div>
            <button 
              className="connect-wallet-btn" 
              onClick={connectWallet}
              disabled={loading}
            >
              {loading ? <FiRefreshCw className="spinning" /> : <FiCreditCard />}
              {loading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
            <div className="connect-features">
              <div className="feature">
                <FiShield />
                <span>Secure blockchain transactions</span>
              </div>
              <div className="feature">
                <FiZap />
                <span>Trade energy credits</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="wallet-message error">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="wallet-message success">
            <FiCheck />
            <span>{success}</span>
          </div>
        )}
      </div>
    );
  }

  // Floating wallet icon with tooltip
  return (
    <>
      {/* ✅ SIMPLE: Floating Wallet Icon with Hover Tooltip */}
      <div 
        className="floating-wallet-icon-container"
        style={{
          position: 'fixed',
          left: `${iconPosition.x}px`,
          top: `${iconPosition.y}px`,
          zIndex: 1000
        }}
      >
        <div
          ref={iconRef}
          className={`floating-wallet-icon ${walletState.isConnected ? 'connected' : 'disconnected'}`}
          onMouseDown={handleIconMouseDown}
          onClick={handleIconClick}
          onMouseEnter={() => !isIconDragging && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="metamask-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M30.04 1.96L18.04 10.96L20.24 5.76L30.04 1.96Z" fill="#E17726"/>
              <path d="M1.96 1.96L13.76 11.12L11.76 5.76L1.96 1.96Z" fill="#E27625"/>
              <path d="M25.68 23.04L22.64 27.68L29.44 29.6L31.44 23.2L25.68 23.04Z" fill="#E27625"/>
              <path d="M0.56 23.2L2.56 29.6L9.36 27.68L6.32 23.04L0.56 23.2Z" fill="#E27625"/>
              <path d="M9.04 14.08L7.28 16.8L14 17.12L13.76 9.76L9.04 14.08Z" fill="#E27625"/>
              <path d="M22.96 14.08L18.08 9.6L18.04 17.12L24.72 16.8L22.96 14.08Z" fill="#E27625"/>
              <path d="M9.36 27.68L13.44 25.68L9.92 23.28L9.36 27.68Z" fill="#E27625"/>
              <path d="M18.56 25.68L22.64 27.68L22.08 23.28L18.56 25.68Z" fill="#E27625"/>
            </svg>
          </div>
          {walletState.isConnected && (
            <div className="connection-indicator"></div>
          )}
        </div>
        
        {/* ✅ SIMPLE: Tooltip that appears on hover */}
        {showTooltip && (
          <div className="wallet-tooltip">
            Wallet
          </div>
        )}
      </div>

      {/* Floating wallet window */}
      {isFloatingOpen && !isMinimized && (
        <div 
          ref={windowRef}
          className="floating-wallet-window"
          style={{
            left: `${windowPosition.x}px`,
            top: `${windowPosition.y}px`
          }}
          onMouseDown={handleWindowMouseDown}
        >
          <div ref={headerRef} className="floating-wallet-header">
            <div className="window-title">
              <FiCreditCard />
              MetaMask Wallet
            </div>
            <div className="window-controls">
              <button 
                className="window-control-btn minimize"
                onClick={() => setIsMinimized(true)}
              >
                <FiMinus />
              </button>
              <button 
                className="window-control-btn close"
                onClick={() => setIsFloatingOpen(false)}
              >
                <FiX />
              </button>
            </div>
          </div>
          <div className="floating-wallet-content">
            {/* Same content as inline version */}
            <div className={`connection-status-card ${walletState.isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-indicator">
                <FiCreditCard className={`status-icon ${walletState.isConnected ? 'connected' : 'disconnected'}`} />
                <span>{walletState.isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {walletState.network && (
                <div className="network-info">
                  <span className="network-label">Network:</span>
                  <span className="network-name">{walletState.network.name || 'Unknown'}</span>
                </div>
              )}
            </div>

            {walletState.isConnected ? (
              <div className="wallet-details">
                <div className="wallet-address-section">
                  <label>Wallet Address</label>
                  <div className="address-display">
                    <span className="address-text">
                      {`${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`}
                    </span>
                    <div className="address-actions">
                      <button className="icon-btn" onClick={copyAddress} title="Copy Address">
                        {copied ? <FiCheck /> : <FiCopy />}
                      </button>
                      <button className="icon-btn" onClick={openEtherscan} title="View on Etherscan">
                        <FiExternalLink />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="balance-section">
                  <div className="balance-header">
                    <label>Balances</label>
                    <button className="toggle-balance-btn" onClick={() => setShowBalance(!showBalance)}>
                      {showBalance ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <div className="balance-grid">
                    <div className="balance-item">
                      <div className="balance-label">ETH</div>
                      <div className="balance-value">
                        {showBalance ? parseFloat(walletState.ethBalance).toFixed(4) : '••••'}
                      </div>
                    </div>
                    <div className="balance-item">
                      <div className="balance-label">Carbon Credits</div>
                      <div className="balance-value">
                        {showBalance ? walletState.totalTokens : '••••'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wallet-quick-actions">
                  <button className="wallet-action-btn secondary" onClick={onRefresh}>
                    <FiRefreshCw />
                    Refresh
                  </button>
                  <button className="wallet-action-btn danger" onClick={disconnectWallet}>
                    <FiX />
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="connect-wallet-section">
                <div className="connect-info">
                  <FiCreditCard className="connect-icon" />
                  <h4>Connect Wallet</h4>
                  <p>Connect your MetaMask wallet to start trading energy and carbon credits on the blockchain.</p>
                </div>
                <button 
                  className="connect-wallet-btn" 
                  onClick={connectWallet}
                  disabled={loading}
                >
                  {loading ? <FiRefreshCw className="spinning" /> : <FiCreditCard />}
                  {loading ? 'Connecting...' : 'Connect MetaMask'}
                </button>
                <div className="connect-features">
                  <div className="feature">
                    <FiShield />
                    <span>Secure blockchain transactions</span>
                  </div>
                  <div className="feature">
                    <FiZap />
                    <span>Trade energy credits</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="wallet-message error">
                <FiAlertTriangle />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="wallet-message success">
                <FiCheck />
                <span>{success}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnect;
