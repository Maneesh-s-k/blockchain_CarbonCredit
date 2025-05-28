import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FiCreditCard,  // Replace FiWallet with FiCreditCard
  FiExternalLink, 
  FiCopy, 
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';

export default function WalletConnect() {
  const { 
    isConnected, 
    account, 
    balance, 
    chainId, 
    isLoading, 
    error, 
    isMetaMaskInstalled,
    connectWallet, 
    disconnectWallet, 
    getBalance,
    switchToSepolia,
    clearError 
  } = useWallet();
  
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case '1': return 'Ethereum Mainnet';
      case '11155111': return 'Sepolia Testnet';
      case '137': return 'Polygon';
      case '80001': return 'Mumbai Testnet';
      default: return 'Unknown Network';
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className="wallet-connect-card">
        <div className="wallet-header">
          <FiCreditCard className="wallet-icon" />
          <h3>MetaMask Required</h3>
        </div>
        <p className="wallet-description">
          You need MetaMask to connect your wallet and trade energy credits.
        </p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="wallet-button primary"
        >
          <FiExternalLink />
          Install MetaMask
        </a>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="wallet-connect-card connected">
        <div className="wallet-header">
          <div className="wallet-status">
            <FiCheckCircle className="status-icon connected" />
            <span>Wallet Connected</span>
          </div>
          <button 
            className="disconnect-btn"
            onClick={handleDisconnect}
            title="Disconnect Wallet"
          >
            <FiX />
          </button>
        </div>

        <div className="wallet-info">
          <div className="wallet-row">
            <span className="wallet-label">Address:</span>
            <div className="wallet-address">
              <span>{formatAddress(account)}</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(account)}
                title="Copy Address"
              >
                {copied ? <FiCheckCircle /> : <FiCopy />}
              </button>
            </div>
          </div>

          <div className="wallet-row">
            <span className="wallet-label">Balance:</span>
            <div className="wallet-balance">
              <span>{parseFloat(balance).toFixed(4)} ETH</span>
              <button
                className="refresh-btn"
                onClick={getBalance}
                title="Refresh Balance"
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>

          <div className="wallet-row">
            <span className="wallet-label">Network:</span>
            <div className="wallet-network">
              <span>{getNetworkName(chainId)}</span>
              {chainId !== '11155111' && (
                <button
                  className="network-switch-btn"
                  onClick={switchToSepolia}
                  title="Switch to Sepolia Testnet"
                >
                  Switch to Testnet
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="wallet-actions">
          <a
            href={`https://etherscan.io/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="wallet-button secondary"
          >
            <FiExternalLink />
            View on Etherscan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect-card">
      <div className="wallet-header">
        <FiCreditCard className="wallet-icon" />
        <h3>Connect Your Wallet</h3>
      </div>
      
      {error && (
        <div className="wallet-error">
          <FiAlertTriangle />
          <span>{error}</span>
          <button onClick={clearError} className="error-close">
            <FiX />
          </button>
        </div>
      )}

      <p className="wallet-description">
        Connect your MetaMask wallet to start trading energy credits on the blockchain.
      </p>

      <div className="wallet-features">
        <div className="feature-item">
          <FiCheckCircle className="feature-icon" />
          <span>Secure blockchain transactions</span>
        </div>
        <div className="feature-item">
          <FiCheckCircle className="feature-icon" />
          <span>Trade energy credits</span>
        </div>
        <div className="feature-item">
          <FiCheckCircle className="feature-icon" />
          <span>Track your earnings</span>
        </div>
      </div>

      <button
        className="wallet-button primary"
        onClick={handleConnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="spinner-small" />
            Connecting...
          </>
        ) : (
          <>
            <FiCreditCard />
            Connect MetaMask
          </>
        )}
      </button>

      <p className="wallet-disclaimer">
        By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

