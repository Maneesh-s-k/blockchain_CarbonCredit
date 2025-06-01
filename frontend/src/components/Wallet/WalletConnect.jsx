import React, { useState, useEffect } from 'react';
import { blockchainService } from '../../services/blockchainService';
import { NETWORK_CONFIG } from '../../config/contracts';
import { 
  FiCreditCard, 
  FiCheck, 
  FiX, 
  FiRefreshCw, 
  FiEye, 
  FiEyeOff,
  FiExternalLink,
  FiCopy,
  FiAlertTriangle,
  FiShield,
  FiWifi,
  FiWifiOff,
  FiSettings,
  FiDollarSign,
  FiZap
} from 'react-icons/fi';

const WalletConnect = ({ blockchainData, onWalletUpdate, onRefresh, isInline = false }) => {
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: '',
    balance: '0',
    carbonBalance: '0',
    network: null,
    isCorrectNetwork: false,
    loading: false,
    error: ''
  });

  const [showBalance, setShowBalance] = useState(true);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (blockchainData) {
      setWalletState(prev => ({
        ...prev,
        isConnected: blockchainData.isConnected || false,
        address: blockchainData.address || '',
        balance: blockchainData.ethBalance || '0',
        carbonBalance: blockchainData.carbonBalance || '0',
        network: blockchainData.network || null
      }));
    }
  }, [blockchainData]);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
    return () => removeEventListeners();
  }, []);

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  };

  const removeEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const connectWallet = async () => {
    try {
      setWalletState(prev => ({ ...prev, loading: true, error: '' }));

      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const address = await blockchainService.initialize();
      const [balance, carbonBalance, network] = await Promise.all([
        blockchainService.getBalance(address).catch(() => '0'),
        blockchainService.getCarbonBalance(address).catch(() => '0'),
        blockchainService.getNetwork().catch(() => null)
      ]);

      const isCorrectNetwork = network ? network.chainId === NETWORK_CONFIG.chainId : false;

      const newWalletState = {
        isConnected: true,
        address,
        balance: balance || '0',
        carbonBalance: carbonBalance.toString() || '0',
        network,
        isCorrectNetwork,
        loading: false,
        error: isCorrectNetwork ? '' : `Please switch to ${NETWORK_CONFIG.name}`
      };

      setWalletState(prev => ({ ...prev, ...newWalletState }));
      
      if (onWalletUpdate) {
        onWalletUpdate({
          isConnected: true,
          address,
          ethBalance: balance || '0',
          carbonBalance: carbonBalance.toString() || '0',
          network
        });
      }

      setRetryCount(0);

    } catch (error) {
      console.error('Error connecting wallet:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection rejected by user';
      } else if (error.message.includes('MetaMask')) {
        errorMessage = 'MetaMask not found. Please install MetaMask extension.';
      }
      
      setWalletState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  const disconnectWallet = () => {
    const disconnectedState = {
      isConnected: false,
      address: '',
      balance: '0',
      carbonBalance: '0',
      network: null,
      isCorrectNetwork: false,
      loading: false,
      error: ''
    };

    setWalletState(prev => ({ ...prev, ...disconnectedState }));
    
    if (onWalletUpdate) {
      onWalletUpdate(disconnectedState);
    }
  };

  const switchNetwork = async () => {
    try {
      setWalletState(prev => ({ ...prev, loading: true }));
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
      
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
              chainName: NETWORK_CONFIG.name,
              rpcUrls: [NETWORK_CONFIG.rpcUrl],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
            }],
          });
        } catch (addError) {
          setWalletState(prev => ({
            ...prev,
            error: 'Failed to add network to MetaMask',
            loading: false
          }));
        }
      } else {
        setWalletState(prev => ({
          ...prev,
          error: 'Failed to switch network',
          loading: false
        }));
      }
    } finally {
      setWalletState(prev => ({ ...prev, loading: false }));
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletState.address);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const refreshWallet = async () => {
    if (walletState.isConnected) {
      await connectWallet();
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  const retryConnection = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => connectWallet(), 1000 * Math.pow(2, retryCount));
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.001) return '<0.001';
    return num.toFixed(4);
  };

  // Inline wallet component for dashboard
  if (isInline) {
    if (!walletState.isConnected) {
      return (
        <div className="wallet-section-inline">
          <div className="wallet-connect-larger">
            <div className="wallet-header-larger">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCreditCard className="wallet-icon-larger" />
                <span className="wallet-title-larger">MetaMask</span>
              </div>
            </div>

            <div className="wallet-content-inline">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.6 }}>
                  <FiWifiOff />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0' }}>
                  Connect MetaMask to access blockchain features
                </p>
              </div>

              <button 
                className="connect-btn-larger"
                onClick={connectWallet}
                disabled={walletState.loading}
              >
                {walletState.loading ? (
                  <>
                    <FiRefreshCw className="spinning" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <FiCreditCard />
                    Connect Wallet
                  </>
                )}
              </button>

              {walletState.error && (
                <div className="wallet-error-larger">
                  <FiAlertTriangle style={{ marginRight: '4px' }} />
                  {walletState.error}
                  {retryCount < 3 && (
                    <button 
                      onClick={retryConnection}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'inherit', 
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        marginLeft: '8px',
                        fontSize: '10px'
                      }}
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {!window.ethereum && (
                <div className="wallet-error-larger">
                  <FiAlertTriangle style={{ marginRight: '4px' }} />
                  MetaMask not detected. 
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline', marginLeft: '4px' }}
                  >
                    Install MetaMask
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="wallet-section-inline">
        <div className="wallet-connected-larger">
          <div className="wallet-header-larger">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiShield className="wallet-icon-larger" style={{ color: 'var(--success)' }} />
              <span className="wallet-title-larger">Connected</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="balance-toggle-larger"
                onClick={() => setShowBalance(!showBalance)}
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <FiEyeOff /> : <FiEye />}
              </button>
              <button 
                className="balance-toggle-larger"
                onClick={refreshWallet}
                title="Refresh wallet data"
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>

          <div className="wallet-address-larger">
            <span className="address-label-larger">Address</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="address-value-larger">
                {showFullAddress ? walletState.address : formatAddress(walletState.address)}
              </span>
              <button 
                onClick={() => setShowFullAddress(!showFullAddress)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
                title={showFullAddress ? 'Show short address' : 'Show full address'}
              >
                <FiEye />
              </button>
              <button 
                onClick={copyAddress}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
                title="Copy address"
              >
                <FiCopy />
              </button>
            </div>
          </div>

          <div className="wallet-balance-larger">
            <span className="balance-label-larger">ETH Balance</span>
            <span className="balance-value-larger">
              {showBalance ? `${formatBalance(walletState.balance)} ETH` : '••••••'}
            </span>
          </div>

          <div className="balance-breakdown-larger">
            <div className="balance-item-larger">
              <span className="item-label-larger">Carbon Credits</span>
              <span className="item-value-larger available">
                {showBalance ? `${walletState.carbonBalance}` : '••••'}
              </span>
            </div>
            <div className="balance-item-larger">
              <span className="item-label-larger">Network</span>
              <span className="item-value-larger pending">
                {walletState.network?.name || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="network-status-larger">
            {walletState.isCorrectNetwork ? (
              <div className="network-correct-larger">
                <FiCheck />
                <span>Connected to {NETWORK_CONFIG.name}</span>
              </div>
            ) : (
              <div className="network-incorrect-larger">
                <FiX />
                <span>Wrong Network</span>
                <button 
                  className="switch-network-btn-larger"
                  onClick={switchNetwork}
                  disabled={walletState.loading}
                >
                  Switch to {NETWORK_CONFIG.name}
                </button>
              </div>
            )}
          </div>

          {walletState.error && (
            <div className="wallet-error-larger">
              <FiAlertTriangle style={{ marginRight: '4px' }} />
              {walletState.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full wallet component for dedicated wallet page
  if (!walletState.isConnected) {
    return (
      <div className="wallet-connect">
        <div className="wallet-header">
          <h3>
            <FiCreditCard style={{ marginRight: '8px' }} />
            MetaMask Wallet
          </h3>
        </div>

        <div className="wallet-content">
          <div className="wallet-icon-display">
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEyIiBoZWlnaHQ9IjE4OSIgdmlld0JveD0iMCAwIDIxMiAxODkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8xXzIpIj4KPHBhdGggZD0iTTEwNi4yNSAwTDEwNC4yNSA2Ljc1VjEyOS4yNUwxMDYuMjUgMTMxLjI1TDE2OS41IDk0LjVMMTA2LjI1IDBaIiBmaWxsPSIjMzQzNDM0Ii8+CjxwYXRoIGQ9Ik0xMDYuMjUgMEw0MyA5NC41TDEwNi4yNSAxMzEuMjVWNzAuNVYwWiIgZmlsbD0iIzhDOEM4QyIvPgo8cGF0aCBkPSJNMTA2LjI1IDE0Mi41TDEwNS4yNSAxNDMuNzVWMTg5TDEwNi4yNSAxODlMMTY5LjUgMTA1LjVMMTA2LjI1IDE0Mi41WiIgZmlsbD0iIzNDM0MzQiLvPgo8cGF0aCBkPSJNMTA2LjI1IDE4OVYxNDIuNUw0MyAxMDUuNUwxMDYuMjUgMTg5WiIgZmlsbD0iIzhDOEM4QyIvPgo8cGF0aCBkPSJNMTA2LjI1IDEzMS4yNUwxNjkuNSA5NC41TDEwNi4yNSA3MC41VjEzMS4yNVoiIGZpbGw9IiMxNDE0MTQiLz4KPHBhdGggZD0iTTQzIDk0LjVMMTA2LjI1IDEzMS4yNVY3MC41TDQzIDk0LjVaIiBmaWxsPSIjMzkzOTM5Ii8+CjwvZz4KPHN2ZyB3aWR0aD0iMjEyIiBoZWlnaHQ9IjE4OSIgdmlld0JveD0iMCAwIDIxMiAxODkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzFfMiI+CjxyZWN0IHdpZHRoPSIyMTIiIGhlaWdodD0iMTg5IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo="
              alt="MetaMask"
              width="64"
              height="64"
              style={{ marginBottom: '16px' }}
            />
          </div>
          
          <div className="wallet-description">
            <h4>Connect your MetaMask wallet</h4>
            <p>Connect with MetaMask to trade energy, manage carbon credits, and access blockchain features.</p>
          </div>

          <button 
            className="connect-btn-mini"
            onClick={connectWallet}
            disabled={walletState.loading}
          >
            {walletState.loading ? (
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

          {walletState.error && (
            <div className="wallet-error-mini">
              <FiAlertTriangle style={{ marginRight: '4px' }} />
              {walletState.error}
              {retryCount < 3 && (
                <button 
                  onClick={retryConnection}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'inherit', 
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {!window.ethereum && (
            <div className="wallet-error-mini">
              <FiAlertTriangle style={{ marginRight: '4px' }} />
              MetaMask not detected. Please install MetaMask extension.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <div className="wallet-header">
        <h3>
          <FiShield style={{ marginRight: '8px', color: 'var(--success)' }} />
          MetaMask Connected
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="balance-toggle"
            onClick={() => setShowBalance(!showBalance)}
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? <FiEyeOff /> : <FiEye />}
          </button>
          <button 
            className="balance-toggle"
            onClick={refreshWallet}
            title="Refresh wallet data"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="wallet-content">
        {/* Wallet Address */}
        <div className="wallet-address">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500' }}>
              Wallet Address
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => setShowFullAddress(!showFullAddress)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title={showFullAddress ? 'Show short address' : 'Show full address'}
              >
                <FiEye />
              </button>
              <button 
                onClick={copyAddress}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Copy address"
              >
                <FiCopy />
              </button>
              <a 
                href={`https://etherscan.io/address/${walletState.address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '12px',
                  textDecoration: 'none'
                }}
                title="View on Etherscan"
              >
                <FiExternalLink />
              </a>
            </div>
          </div>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '13px', 
            color: 'var(--text-primary)',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-glass)'
          }}>
            {showFullAddress ? walletState.address : formatAddress(walletState.address)}
          </div>
        </div>

        {/* Balance Information */}
        <div className="wallet-balance">
          <div className="balance-main">
            <span className="balance-label">ETH Balance</span>
            <span className="balance-amount">
              {showBalance ? `${formatBalance(walletState.balance)} ETH` : '••••••'}
            </span>
          </div>
        </div>

        <div className="balance-breakdown">
          <div className="balance-item">
            <span className="balance-item-label">Carbon Credits</span>
            <span className="balance-item-amount available">
              {showBalance ? `${walletState.carbonBalance}` : '••••'}
            </span>
          </div>
          <div className="balance-item">
            <span className="balance-item-label">Network</span>
            <span className="balance-item-amount pending">
              {walletState.network?.name || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Network Status */}
        <div className="network-status-mini">
          {walletState.isCorrectNetwork ? (
            <div className="network-correct-mini">
              <FiCheck />
              <span>Connected to {NETWORK_CONFIG.name}</span>
            </div>
          ) : (
            <div className="network-incorrect-mini">
              <FiX />
              <span>Wrong Network - Please switch to {NETWORK_CONFIG.name}</span>
              <button 
                onClick={switchNetwork}
                disabled={walletState.loading}
                style={{
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                {walletState.loading ? 'Switching...' : 'Switch Network'}
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {walletState.error && (
          <div className="wallet-error-mini">
            <FiAlertTriangle style={{ marginRight: '4px' }} />
            {walletState.error}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '12px',
          justifyContent: 'space-between'
        }}>
          <button 
            onClick={() => window.open('https://metamask.io/buy/', '_blank')}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <FiDollarSign />
            Buy ETH
          </button>
          <button 
            onClick={() => window.open(`https://etherscan.io/address/${walletState.address}`, '_blank')}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <FiExternalLink />
            Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
