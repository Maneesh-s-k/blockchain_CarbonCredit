// components/Wallet/WalletConnect.jsx - FIXED POSITIONING
import React, { useState, useEffect, useRef } from 'react';
import { blockchainService } from '../../services/blockchainService';
import { 
  FiCreditCard, FiX, FiMinus, FiMaximize2, FiMinimize2, 
  FiCopy, FiExternalLink, FiRefreshCw, FiShield, 
  FiAlertTriangle, FiCheck, FiEye, FiEyeOff 
} from 'react-icons/fi';

const WalletConnect = ({ blockchainData, onWalletUpdate, onRefresh, isInline = false }) => {
  // Icon position state (separate from window)
  const [iconPosition, setIconPosition] = useState({ 
    x: window.innerWidth - 100, // RIGHT SIDE with space
    y: window.innerHeight - 100  // BOTTOM with space
  });
  const [isIconDragging, setIsIconDragging] = useState(false);
  const [iconDragOffset, setIconDragOffset] = useState({ x: 0, y: 0 });
  
  // Window states
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ 
    x: (window.innerWidth - 400) / 2, // CENTER HORIZONTALLY
    y: (window.innerHeight - 500) / 2  // CENTER VERTICALLY
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

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

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
    const baseUrl = walletState.network?.chainId === 1 
      ? 'https://etherscan.io' 
      : 'https://sepolia.etherscan.io';
    window.open(`${baseUrl}/address/${walletState.address}`, '_blank');
  };

  const handleIconClick = () => {
    if (!isIconDragging) {
      setIsFloatingOpen(true);
      setIsMinimized(false);
    }
  };

  // If used inline (in sidebar), render the original wallet component
  if (isInline) {
    return (
      <div className="wallet-connect">
        {/* ... existing inline wallet code ... */}
      </div>
    );
  }

  // FLOATING WALLET ICON AND WINDOW
  return (
    <>
      {/* MOVABLE METAMASK ICON */}
      <div 
        ref={iconRef}
        className={`floating-wallet-icon ${walletState.isConnected ? 'connected' : 'disconnected'}`}
        style={{
          position: 'fixed',
          left: `${iconPosition.x}px`,
          top: `${iconPosition.y}px`,
          zIndex: 1000,
          cursor: isIconDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleIconMouseDown}
        onClick={handleIconClick}
        title={walletState.isConnected ? 'Wallet Connected - Drag to move' : 'Connect Wallet - Drag to move'}
      >
        <div className="metamask-icon">
          <svg width="32" height="32" viewBox="0 0 318.6 318.6">
            <path fill="#E2761B" d="M274.1 35.5l-99.5 73.9L193 65.8z"/>
            <path fill="#E4761B" d="M44.4 35.5l98.7 74.6-17.5-44.3z"/>
            <path fill="#D7C1B3" d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3z"/>
            <path fill="#233447" d="M33.9 207.7l16.2 55.3 56.7-15.6-26.5-40.6z"/>
            <path fill="#CD6116" d="M103.6 138.2l-15.8 23.9 56.3 2.5-1.9-60.6z"/>
            <path fill="#E4751F" d="M214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5z"/>
            <path fill="#F6851B" d="M106.8 247.4l33.8-16.5-29.2-22.8z"/>
            <path fill="#E4751F" d="M177.9 230.9l33.9 16.5-4.7-39.3z"/>
          </svg>
        </div>
        {walletState.isConnected && (
          <div className="connection-indicator"></div>
        )}
      </div>

      {/* MINIMIZED WINDOW */}
      {isFloatingOpen && isMinimized && (
        <div 
          className="floating-wallet-minimized"
          style={{
            left: `${windowPosition.x}px`,
            top: `${windowPosition.y}px`
          }}
          onClick={() => setIsMinimized(false)}
        >
          <div className="metamask-icon-mini">
            <svg width="16" height="16" viewBox="0 0 318.6 318.6">
              <path fill="#E2761B" d="M274.1 35.5l-99.5 73.9L193 65.8z"/>
              <path fill="#E4761B" d="M44.4 35.5l98.7 74.6-17.5-44.3z"/>
              <path fill="#D7C1B3" d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3z"/>
              <path fill="#233447" d="M33.9 207.7l16.2 55.3 56.7-15.6-26.5-40.6z"/>
              <path fill="#CD6116" d="M103.6 138.2l-15.8 23.9 56.3 2.5-1.9-60.6z"/>
              <path fill="#E4751F" d="M214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5z"/>
              <path fill="#F6851B" d="M106.8 247.4l33.8-16.5-29.2-22.8z"/>
              <path fill="#E4751F" d="M177.9 230.9l33.9 16.5-4.7-39.3z"/>
            </svg>
          </div>
          <span>Wallet</span>
        </div>
      )}

      {/* FLOATING WALLET WINDOW - OPENS IN CENTER */}
      {isFloatingOpen && !isMinimized && (
        <div 
          ref={windowRef}
          className="floating-wallet-window"
          style={{
            left: `${windowPosition.x}px`,
            top: `${windowPosition.y}px`,
            cursor: isWindowDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleWindowMouseDown}
        >
          {/* Window Header */}
          <div 
            ref={headerRef}
            className="floating-wallet-header"
            style={{ cursor: isWindowDragging ? 'grabbing' : 'grab' }}
          >
            <div className="window-title">
              <div className="metamask-icon">
                <svg width="20" height="20" viewBox="0 0 318.6 318.6">
                  <path fill="#E2761B" d="M274.1 35.5l-99.5 73.9L193 65.8z"/>
                  <path fill="#E4761B" d="M44.4 35.5l98.7 74.6-17.5-44.3z"/>
                  <path fill="#D7C1B3" d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3z"/>
                  <path fill="#233447" d="M33.9 207.7l16.2 55.3 56.7-15.6-26.5-40.6z"/>
                  <path fill="#CD6116" d="M103.6 138.2l-15.8 23.9 56.3 2.5-1.9-60.6z"/>
                  <path fill="#E4751F" d="M214.9 138.2l-39-34.8-1.3 61.2 56.2-2.5z"/>
                  <path fill="#F6851B" d="M106.8 247.4l33.8-16.5-29.2-22.8z"/>
                  <path fill="#E4751F" d="M177.9 230.9l33.9 16.5-4.7-39.3z"/>
                </svg>
              </div>
              <span>MetaMask Wallet</span>
            </div>
            
            <div className="window-controls">
              <button 
                className="window-control-btn minimize"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <FiMinus />
              </button>
              <button 
                className="window-control-btn close"
                onClick={() => setIsFloatingOpen(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Window Content - Same as before */}
          <div className="floating-wallet-content">
            {/* Connection Status */}
            <div className={`connection-status-card ${walletState.isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-indicator">
                {walletState.isConnected ? (
                  <>
                    <FiShield className="status-icon connected" />
                    <span>Wallet Connected</span>
                  </>
                ) : (
                  <>
                    <FiCreditCard className="status-icon disconnected" />
                    <span>Wallet Disconnected</span>
                  </>
                )}
              </div>
              
              {walletState.network && (
                <div className="network-info">
                  <span className="network-label">Network:</span>
                  <span className="network-name">{walletState.network.name || 'Unknown'}</span>
                </div>
              )}
            </div>

            {/* Rest of wallet content - same as before */}
            {walletState.isConnected ? (
              <div className="wallet-details">
                {/* Address */}
                <div className="wallet-address-section">
                  <label>Wallet Address</label>
                  <div className="address-display">
                    <span className="address-text">
                      {walletState.address}
                    </span>
                    <div className="address-actions">
                      <button 
                        className="icon-btn"
                        onClick={copyAddress}
                        title="Copy Address"
                      >
                        {copied ? <FiCheck /> : <FiCopy />}
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={openEtherscan}
                        title="View on Etherscan"
                      >
                        <FiExternalLink />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Balances */}
                <div className="wallet-balances">
                  <div className="balance-header">
                    <label>Balances</label>
                    <button 
                      className="toggle-balance-btn"
                      onClick={() => setShowBalance(!showBalance)}
                    >
                      {showBalance ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  <div className="balance-grid">
                    <div className="balance-item">
                      <div className="balance-label">ETH Balance</div>
                      <div className="balance-value">
                        {showBalance 
                          ? `${parseFloat(walletState.ethBalance).toFixed(4)} ETH`
                          : '••••••••'
                        }
                      </div>
                    </div>

                    <div className="balance-item">
                      <div className="balance-label">Carbon Credits</div>
                      <div className="balance-value">
                        {showBalance 
                          ? `${walletState.totalTokens} Credits`
                          : '••••••••'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="wallet-quick-actions">
                  <button 
                    className="wallet-action-btn secondary"
                    onClick={() => {
                      checkMetaMaskConnection();
                      onRefresh();
                    }}
                    disabled={loading}
                  >
                    <FiRefreshCw className={loading ? 'spinning' : ''} />
                    Refresh Data
                  </button>
                  
                  <button 
                    className="wallet-action-btn danger"
                    onClick={disconnectWallet}
                  >
                    <FiX />
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              /* Connect Wallet Section */
              <div className="connect-wallet-section">
                <div className="connect-info">
                  <FiCreditCard className="connect-icon" />
                  <h4>Connect Your Wallet</h4>
                  <p>Connect your MetaMask wallet to start trading energy and carbon credits on the blockchain.</p>
                </div>

                <button 
                  className="connect-wallet-btn"
                  onClick={connectWallet}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="spinning" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <FiCreditCard />
                      Connect MetaMask
                    </>
                  )}
                </button>

                <div className="connect-features">
                  <div className="feature">
                    <FiShield />
                    <span>Secure blockchain transactions</span>
                  </div>
                  <div className="feature">
                    <FiRefreshCw />
                    <span>Trade energy credits</span>
                  </div>
                  <div className="feature">
                    <FiCreditCard />
                    <span>Manage carbon NFTs</span>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="wallet-message error">
                <FiAlertTriangle />
                <span>{error}</span>
                <button onClick={() => setError('')}>×</button>
              </div>
            )}

            {success && (
              <div className="wallet-message success">
                <FiCheck />
                <span>{success}</span>
                <button onClick={() => setSuccess('')}>×</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnect;
