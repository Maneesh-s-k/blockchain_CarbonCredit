import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../services/api';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    totalSpent: 0
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletData();
    }
  }, [isAuthenticated]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getWalletInfo();
      
      if (response.success) {
        setWalletData(response.wallet);
        setPaymentMethods(response.paymentMethods || []);
        setTransactions(response.recentTransactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const addPaymentMethod = async (paymentMethodData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.addPaymentMethod(paymentMethodData);
      
      if (response.success) {
        await fetchWalletData(); // Refresh data
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const depositFunds = async (amount, paymentMethodId) => {
    try {
      setIsLoading(true);
      const response = await apiClient.depositFunds({ amount, paymentMethodId });
      
      if (response.success) {
        await fetchWalletData(); // Refresh data
        return { success: true, transaction: response.transaction };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Failed to deposit funds:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawFunds = async (amount, paymentMethodId) => {
    try {
      setIsLoading(true);
      const response = await apiClient.withdrawFunds({ amount, paymentMethodId });
      
      if (response.success) {
        await fetchWalletData(); // Refresh data
        return { success: true, transaction: response.transaction };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Failed to withdraw funds:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    walletData,
    paymentMethods,
    transactions,
    isLoading,
    error,
    fetchWalletData,
    addPaymentMethod,
    depositFunds,
    withdrawFunds
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
