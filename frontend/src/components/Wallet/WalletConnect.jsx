import React, { useState, useEffect } from 'react';
import { blockchainService } from '../../services/blockchainService';
import { NETWORK_CONFIG } from '../../config/contracts';
import { FiCreditCard, FiCheck, FiX, FiRefreshCw, FiEye, FiEyeOff } from 'react-icons/fi';

const WalletConnect = () => {
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: '',
    balance: '0',
    network: null,
    isCorrectNetwork: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
    
    return () => {
      removeEventListeners();
    };
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
      setWalletState({
        isConnected: false,
        address: '',
        balance: '0',
        network: null,
        isCorrectNetwork: false
      });
    } else {
      connectWallet();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const handleDisconnect = () => {
    setWalletState({
      isConnected: false,
      address: '',
      balance: '0',
      network: null,
      isCorrectNetwork: false
    });
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const address = await blockchainService.initialize();
      const balance = await blockchainService.getBalance(address);
      const network = await blockchainService.getNetwork();

      const isCorrectNetwork = network.chainId === NETWORK_CONFIG.chainId;

      setWalletState({
        isConnected: true,
        address,
        balance,
        network,
        isCorrectNetwork
      });

      if (!isCorrectNetwork) {
        setError(`Please switch to ${NETWORK_CONFIG.name}`);
      }

    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async () => {
    try {
      setLoading(true);
      
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
          console.error('Error adding network:', addError);
          setError('Failed to add network to MetaMask');
        }
      } else {
        console.error('Error switching network:', error);
        setError('Failed to switch network');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!walletState.isConnected) {
    return (
      <div className="wallet-connect-larger">
        <div className="wallet-header-larger">
          <FiCreditCard className="wallet-icon-larger" />
          <span className="wallet-title-larger">Wallet</span>
        </div>
        
        <button 
          onClick={connectWallet}
          disabled={loading}
          className="connect-btn-larger"
        >
          {loading ? (
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
        
        {error && (
          <div className="wallet-error-larger">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-connected-larger">
      <div className="wallet-header-larger">
        <FiCreditCard className="wallet-icon-larger" />
        <span className="wallet-title-larger">Wallet</span>
        <button 
          onClick={() => setShowBalance(!showBalance)}
          className="balance-toggle-larger"
        >
          {showBalance ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      <div className="wallet-address-larger">
        <span className="address-label-larger">Address:</span>
        <span className="address-value-larger">
          {walletState.address.slice(0, 6)}...{walletState.address.slice(-4)}
        </span>
      </div>

      <div className="wallet-balance-larger">
        <span className="balance-label-larger">TOTAL BALANCE</span>
        <span className="balance-value-larger">
          {showBalance ? `$${parseFloat(walletState.balance * 2000).toFixed(2)}` : '••••••'}
        </span>
      </div>

      <div className="balance-breakdown-larger">
        <div className="balance-item-larger">
          <span className="item-label-larger">AVAILABLE</span>
          <span className="item-value-larger available">
            {showBalance ? `$${(parseFloat(walletState.balance) * 2000 * 0.8).toFixed(2)}` : '••••'}
          </span>
        </div>
        <div className="balance-item-larger">
          <span className="item-label-larger">PENDING</span>
          <span className="item-value-larger pending">
            {showBalance ? `$${(parseFloat(walletState.balance) * 2000 * 0.2).toFixed(2)}` : '••••'}
          </span>
        </div>
      </div>

      <div className="network-status-larger">
        {walletState.isCorrectNetwork ? (
          <div className="network-correct-larger">
            <FiCheck />
            <span>Connected</span>
          </div>
        ) : (
          <div className="network-incorrect-larger">
            <FiX />
            <button onClick={switchNetwork} className="switch-network-btn-larger">
              Switch Network
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="wallet-error-larger">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
