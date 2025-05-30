import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiPlus,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiLoader,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

export default function WalletConnect() {
  const { walletData, paymentMethods, isLoading } = useWallet();
  const [showBalance, setShowBalance] = useState(true);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const totalBalance = (walletData.balance || 0) + (walletData.pendingBalance || 0);

  return (
    <div className="wallet-connect">
      <div className="wallet-header">
        <h3>Wallet</h3>
        <button 
          className="balance-toggle"
          onClick={() => setShowBalance(!showBalance)}
          title={showBalance ? 'Hide balance' : 'Show balance'}
        >
          {showBalance ? <FiEye /> : <FiEyeOff />}
        </button>
      </div>

      <div className="wallet-balance">
        <div className="balance-main">
          <span className="balance-label">Total Balance</span>
          <span className="balance-amount">
            {showBalance ? formatCurrency(totalBalance) : '••••••'}
          </span>
        </div>
        
        <div className="balance-breakdown">
          <div className="balance-item">
            <span className="balance-item-label">Available</span>
            <span className="balance-item-amount available">
              {showBalance ? formatCurrency(walletData.balance) : '••••'}
            </span>
          </div>
          <div className="balance-item">
            <span className="balance-item-label">Pending</span>
            <span className="balance-item-amount pending">
              {showBalance ? formatCurrency(walletData.pendingBalance) : '••••'}
            </span>
          </div>
        </div>
      </div>

      <div className="wallet-actions">
        <button className="wallet-action-btn deposit">
          <FiArrowDownLeft />
          <span>Deposit</span>
        </button>
        <button className="wallet-action-btn withdraw">
          <FiArrowUpRight />
          <span>Withdraw</span>
        </button>
      </div>

      <div className="payment-methods">
        <div className="payment-methods-header">
          <span>Payment Methods</span>
          <button className="add-payment-btn">
            <FiPlus />
          </button>
        </div>
        
        <div className="payment-methods-list">
          {isLoading ? (
            <div className="payment-loading">
              <FiLoader className="spinning" />
              <span>Loading...</span>
            </div>
          ) : paymentMethods.length > 0 ? (
            paymentMethods.slice(0, 2).map(method => (
              <div key={method.id} className="payment-method-item">
                <FiCreditCard className="payment-icon" />
                <div className="payment-details">
                  <span className="payment-type">{method.type}</span>
                  <span className="payment-last4">•••• {method.last4}</span>
                </div>
                {method.isDefault && (
                  <span className="default-badge">Default</span>
                )}
              </div>
            ))
          ) : (
            <div className="no-payment-methods">
              <FiCreditCard className="no-payment-icon" />
              <span>No payment methods</span>
              <button className="add-first-payment">Add Payment Method</button>
            </div>
          )}
        </div>
      </div>

      <div className="wallet-stats">
        <div className="stat-item">
          <span className="stat-label">Total Earned</span>
          <span className="stat-value earned">
            {showBalance ? formatCurrency(walletData.totalEarnings) : '••••'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value spent">
            {showBalance ? formatCurrency(walletData.totalSpent) : '••••'}
          </span>
        </div>
      </div>
    </div>
  );
}
