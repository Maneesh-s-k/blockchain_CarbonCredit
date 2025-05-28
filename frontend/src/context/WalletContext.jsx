import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

const WalletContext = createContext();

const initialState = {
  isConnected: false,
  account: null,
  balance: null,
  chainId: null,
  provider: null,
  signer: null,
  isLoading: false,
  error: null,
  isMetaMaskInstalled: false
};

function walletReducer(state, action) {
  switch (action.type) {
    case 'WALLET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'WALLET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        account: action.payload.account,
        balance: action.payload.balance,
        chainId: action.payload.chainId,
        provider: action.payload.provider,
        signer: action.payload.signer,
        isLoading: false,
        error: null
      };
    case 'WALLET_DISCONNECTED':
      return {
        ...state,
        isConnected: false,
        account: null,
        balance: null,
        chainId: null,
        provider: null,
        signer: null,
        isLoading: false,
        error: null
      };
    case 'WALLET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'BALANCE_UPDATED':
      return {
        ...state,
        balance: action.payload
      };
    case 'METAMASK_DETECTED':
      return {
        ...state,
        isMetaMaskInstalled: action.payload
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = async () => {
      const provider = await detectEthereumProvider();
      dispatch({ type: 'METAMASK_DETECTED', payload: !!provider });
    };
    checkMetaMask();
  }, []);

  // Check for existing connection on load
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          dispatch({ type: 'WALLET_DISCONNECTED' });
        } else if (accounts[0] !== state.account) {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [state.account]);

  const connectWallet = useCallback(async () => {
    dispatch({ type: 'WALLET_LOADING' });
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = accounts[0];

      // Get balance
      const balance = await provider.getBalance(account);
      const formattedBalance = ethers.formatEther(balance);

      // Get chain ID
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();

      dispatch({
        type: 'WALLET_CONNECTED',
        payload: {
          account,
          balance: formattedBalance,
          chainId,
          provider,
          signer
        }
      });

      // Update user's wallet address in backend
      await updateUserWalletAddress(account);

      return { account, balance: formattedBalance, chainId };
    } catch (error) {
      console.error('Wallet connection error:', error);
      dispatch({ type: 'WALLET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    dispatch({ type: 'WALLET_DISCONNECTED' });
    localStorage.removeItem('walletConnected');
  }, []);

  const updateUserWalletAddress = async (walletAddress) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:3001/api/auth/update-wallet', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress }),
        });
      }
    } catch (error) {
      console.error('Error updating wallet address:', error);
    }
  };

  const getBalance = useCallback(async () => {
    if (state.provider && state.account) {
      try {
        const balance = await state.provider.getBalance(state.account);
        const formattedBalance = ethers.formatEther(balance);
        dispatch({ type: 'BALANCE_UPDATED', payload: formattedBalance });
        return formattedBalance;
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    }
  }, [state.provider, state.account]);

  const switchToMainnet = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // Mainnet
      });
    } catch (error) {
      console.error('Error switching to mainnet:', error);
      throw error;
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
      });
    } catch (error) {
      if (error.code === 4902) {
        // Chain not added, add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
          }]
        });
      } else {
        throw error;
      }
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchToMainnet,
    switchToSepolia,
    clearError
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
