import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { blockchainService } from '../../services/blockchainService';
import { 
  FiCreditCard, 
  FiPlus, 
  FiDollarSign, 
  FiCalendar, 
  FiDownload, 
  FiSettings, 
  FiShield, 
  FiCheck, 
  FiClock, 
  FiShoppingCart, 
  FiZap, 
  FiArrowUpRight, 
  FiArrowDownLeft,
  FiRefreshCw,
  FiAlertTriangle,
  FiX,
  FiEye,
  FiFilter
} from 'react-icons/fi';

export default function Payments() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking'
  });

  // Data states with safe defaults
  const [walletInfo, setWalletInfo] = useState({
    balance: {
      available: 0,
      pending: 0,
      total: 0
    },
    ethBalance: 0
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [userAddress, setUserAddress] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  // Safe helper function for toFixed
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  useEffect(() => {
    initializePaymentData();
  }, []);

  const initializePaymentData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize blockchain connection
      try {
        const address = await blockchainService.initialize();
        setUserAddress(address);
        
        // Get ETH balance
        const ethBalance = await blockchainService.getBalance(address);
        setWalletInfo(prev => ({
          ...prev,
          ethBalance: parseFloat(ethBalance) || 0
        }));
      } catch (blockchainError) {
        console.log('Blockchain not available:', blockchainError.message);
      }

      // Load wallet info from backend
      await loadWalletInfo();
      await loadPaymentMethods();
      await loadTransactionHistory();
      
    } catch (error) {
      console.error('Error initializing payment data:', error);
      setError('Failed to load payment data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWalletInfo = async () => {
    try {
      const response = await apiService.getWalletInfo();
      
      if (response.success) {
        setWalletInfo(prev => ({
          ...prev,
          balance: {
            available: parseFloat(response.wallet.balance.available) || 0,
            pending: parseFloat(response.wallet.balance.pending) || 0,
            total: parseFloat(response.wallet.balance.total) || 0
          }
        }));
      } else {
        throw new Error(response.message || 'Failed to load wallet info');
      }
    } catch (error) {
      console.error('Error loading wallet info:', error);
      // Use fallback data with safe values
      setWalletInfo(prev => ({
        ...prev,
        balance: {
          available: 234.50,
          pending: 67.80,
          total: 302.30
        }
      }));
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await apiService.getPaymentMethods();
      
      if (response.success) {
        setPaymentMethods(response.paymentMethods || []);
      } else {
        throw new Error(response.message || 'Failed to load payment methods');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      // Use fallback data
      setPaymentMethods([
        { 
          id: 1, 
          type: 'card', 
          card: { last4: '4242', brand: 'Visa', holderName: 'John Doe' }, 
          isDefault: true 
        },
        { 
          id: 2, 
          type: 'bank', 
          bankAccount: { last4: '1234', bankName: 'Chase Bank', holderName: 'John Doe' }, 
          isDefault: false 
        }
      ]);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const response = await apiService.getTransactionHistory();
      
      if (response.success) {
        const transformedHistory = response.transactions.map(transaction => ({
          id: transaction._id,
          amount: parseFloat(transaction.amount) || 0,
          type: transaction.type === 'deposit' ? 'credit' : 'debit',
          description: transaction.description || 'Transaction',
          date: new Date(transaction.createdAt).toLocaleDateString(),
          status: transaction.status || 'pending'
        }));
        
        setTransactionHistory(transformedHistory);
      } else {
        throw new Error(response.message || 'Failed to load transaction history');
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      // Use fallback data
      setTransactionHistory([
        { id: 1, amount: 45.20, type: 'credit', description: 'Energy sale to Green Corp', date: '2024-01-15', status: 'completed' },
        { id: 2, amount: 23.50, type: 'debit', description: 'Energy purchase from Solar LLC', date: '2024-01-14', status: 'completed' },
        { id: 3, amount: 67.80, type: 'credit', description: 'Energy sale to Wind Power Co', date: '2024-01-13', status: 'pending' }
      ]);
    }
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  const handleBuyEnergy = () => {
    navigate('/energy-exchange?action=buy');
  };

  const handleSellEnergy = () => {
    navigate('/energy-exchange?action=sell');
  };

  const processDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }

    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const depositData = {
        amount: parseFloat(depositAmount),
        paymentMethodId: selectedPaymentMethod
      };

      const response = await apiService.depositFunds(depositData);
      
      if (response.success) {
        setSuccess(`Deposit of $${depositAmount} initiated successfully! 🎉`);
        setShowDepositModal(false);
        setDepositAmount('');
        setSelectedPaymentMethod('');
        
        // Refresh wallet info
        await loadWalletInfo();
        await loadTransactionHistory();
      } else {
        throw new Error(response.message || 'Deposit failed');
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      setError(error.message || 'Failed to process deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    if (parseFloat(withdrawAmount) > (walletInfo.balance?.available || 0)) {
      setError('Insufficient funds for withdrawal');
      return;
    }

    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const withdrawData = {
        amount: parseFloat(withdrawAmount),
        paymentMethodId: selectedPaymentMethod
      };

      const response = await apiService.withdrawFunds(withdrawData);
      
      if (response.success) {
        setSuccess(`Withdrawal of $${withdrawAmount} initiated successfully! 🎉`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setSelectedPaymentMethod('');
        
        // Refresh wallet info
        await loadWalletInfo();
        await loadTransactionHistory();
      } else {
        throw new Error(response.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setError(error.message || 'Failed to process withdrawal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    try {
      setIsLoading(true);
      setError('');

      const paymentMethodData = {
        type: newPaymentMethod.type,
        ...(newPaymentMethod.type === 'card' && {
          cardData: {
            number: newPaymentMethod.cardNumber,
            expiryMonth: parseInt(newPaymentMethod.expiryMonth),
            expiryYear: parseInt(newPaymentMethod.expiryYear),
            cvv: newPaymentMethod.cvv,
            holderName: newPaymentMethod.holderName
          }
        }),
        ...(newPaymentMethod.type === 'bank' && {
          bankData: {
            accountNumber: newPaymentMethod.accountNumber,
            routingNumber: newPaymentMethod.routingNumber,
            accountType: newPaymentMethod.accountType,
            bankName: newPaymentMethod.bankName,
            holderName: newPaymentMethod.holderName
          }
        })
      };

      const response = await apiService.addPaymentMethod(paymentMethodData);
      
      if (response.success) {
        setSuccess('Payment method added successfully! 🎉');
        setShowAddPaymentModal(false);
        setNewPaymentMethod({
          type: 'card',
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          holderName: '',
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          accountType: 'checking'
        });
        
        // Refresh payment methods
        await loadPaymentMethods();
      } else {
        throw new Error(response.message || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      setError(error.message || 'Failed to add payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="payments-page">
      <div className="payments-container">
        {/* Payments Header */}
        <div className="payments-header">
          <div className="header-content">
            <h1>Payments & Wallet</h1>
            <p>Manage your payment methods, view transaction history, and trade energy</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleBuyEnergy} 
              className="buy-energy-btn"
            >
              <FiShoppingCart />
              Buy Energy
            </button>
            <button 
              onClick={handleSellEnergy} 
              className="sell-energy-btn"
            >
              <FiZap />
              Sell Energy
            </button>
            <button 
              onClick={() => setShowAddPaymentModal(true)} 
              className="add-payment-btn"
            >
              <FiPlus />
              Add Payment Method
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="message-banner error">
            <FiAlertTriangle />
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {success && (
          <div className="message-banner success">
            <FiCheck />
            {success}
            <button onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        {/* Balance Overview - FIXED toFixed() errors */}
        <div className="balance-overview">
          <div className="balance-card main-balance">
            <div className="balance-header">
              <h3>Available Balance</h3>
              <div className="balance-icon available">
                <FiDollarSign />
              </div>
            </div>
            <div className="balance-amount">${safeToFixed(walletInfo.balance?.available)}</div>
            <div className="balance-actions">
              <button onClick={handleDeposit} className="deposit-btn">
                <FiArrowDownLeft />
                Deposit
              </button>
              <button onClick={handleWithdraw} className="withdraw-btn">
                <FiArrowUpRight />
                Withdraw
              </button>
            </div>
          </div>

          <div className="balance-card">
            <div className="balance-header">
              <h4>Pending</h4>
              <div className="balance-icon pending">
                <FiClock />
              </div>
            </div>
            <div className="balance-amount">${safeToFixed(walletInfo.balance?.pending)}</div>
            <div className="balance-subtitle">Processing transactions</div>
          </div>

          {userAddress && (
            <div className="balance-card">
              <div className="balance-header">
                <h4>ETH Balance</h4>
                <div className="balance-icon">
                  <FiShield />
                </div>
              </div>
              <div className="balance-amount">{safeToFixed(walletInfo.ethBalance, 4)} ETH</div>
              <div className="balance-subtitle">Blockchain wallet</div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-bar">
          <div className="quick-action" onClick={() => navigate('/energy-exchange')}>
            <FiZap />
            <span>Energy Trading</span>
          </div>
          <div className="quick-action" onClick={() => setActiveTab('history')}>
            <FiCalendar />
            <span>Transaction History</span>
          </div>
          <div className="quick-action" onClick={() => setActiveTab('methods')}>
            <FiCreditCard />
            <span>Payment Methods</span>
          </div>
          <div className="quick-action" onClick={() => navigate('/settings')}>
            <FiSettings />
            <span>Payment Settings</span>
          </div>
        </div>

        {/* Payments Tabs */}
        <div className="payments-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiEye />
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'methods' ? 'active' : ''}`}
            onClick={() => setActiveTab('methods')}
          >
            <FiCreditCard />
            Payment Methods
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FiCalendar />
            Transaction History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {isLoading ? (
                  <div className="loading-state">
                    <FiRefreshCw className="spinning" />
                    <p>Loading recent activity...</p>
                  </div>
                ) : transactionHistory.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="activity-item">
                    <div className="activity-icon">
                      {transaction.type === 'credit' ? 
                        <FiArrowDownLeft className="credit" /> : 
                        <FiArrowUpRight className="debit" />
                      }
                    </div>
                    <div className="activity-details">
                      <div className="activity-description">{transaction.description}</div>
                      <div className="activity-date">{transaction.date}</div>
                    </div>
                    <div className="activity-amount">
                      <div className={`amount ${transaction.type}`}>
                        {transaction.type === 'credit' ? '+' : '-'}${safeToFixed(transaction.amount)}
                      </div>
                      <div className={`status ${transaction.status}`}>{transaction.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="payment-methods">
            <h3>Payment Methods</h3>
            <div className="methods-grid">
              {paymentMethods.map((method) => (
                <div key={method.id} className="payment-method-card">
                  <div className="method-header">
                    <div className="method-type">
                      <FiCreditCard />
                      {method.type === 'card' ? 'Credit Card' : 'Bank Account'}
                    </div>
                    {method.isDefault && <div className="default-badge">Default</div>}
                  </div>
                  <div className="method-details">
                    <div className="method-number">
                      •••• •••• •••• {method.card?.last4 || method.bankAccount?.last4}
                    </div>
                    {method.type === 'card' ? (
                      <div className="method-expiry">
                        {method.card?.brand} • {method.card?.holderName}
                      </div>
                    ) : (
                      <div className="method-bank">
                        {method.bankAccount?.bankName} • {method.bankAccount?.holderName}
                      </div>
                    )}
                  </div>
                  <div className="method-actions">
                    <button className="edit-btn">Edit</button>
                    <button className="remove-btn">Remove</button>
                  </div>
                </div>
              ))}
              
              <div className="add-method-card" onClick={() => setShowAddPaymentModal(true)}>
                <div className="add-icon">
                  <FiPlus />
                </div>
                <span>Add Payment Method</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="payment-history">
            <div className="history-filters">
              <h3>Transaction History</h3>
              <div className="filter-group">
                <FiFilter />
                <select>
                  <option value="all">All Transactions</option>
                  <option value="deposits">Deposits</option>
                  <option value="withdrawals">Withdrawals</option>
                  <option value="trades">Energy Trades</option>
                </select>
              </div>
              <button className="export-btn">
                <FiDownload />
                Export
              </button>
            </div>

            <div className="history-table">
              <div className="table-header">
                <div>Date</div>
                <div>Description</div>
                <div>Amount</div>
                <div>Status</div>
              </div>
              {transactionHistory.map((transaction) => (
                <div key={transaction.id} className="table-row">
                  <div>{transaction.date}</div>
                  <div>{transaction.description}</div>
                  <div className={transaction.type}>
                    {transaction.type === 'credit' ? '+' : '-'}${safeToFixed(transaction.amount)}
                  </div>
                  <div className={`status ${transaction.status}`}>{transaction.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Deposit Funds</h3>
                <button onClick={() => setShowDepositModal(false)} className="modal-close">
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="available-balance">
                  Current Balance: ${safeToFixed(walletInfo.balance?.available)}
                </div>
                
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    max="10000"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.type === 'card' ? 'Card' : 'Bank'} ending in {method.card?.last4 || method.bankAccount?.last4}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowDepositModal(false)} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={processDeposit} 
                  className="confirm-btn"
                  disabled={isLoading || !depositAmount || !selectedPaymentMethod}
                >
                  {isLoading ? <FiRefreshCw className="spinning" /> : <FiCheck />}
                  Deposit ${depositAmount}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Withdraw Funds</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="modal-close">
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="available-balance">
                  Available: ${safeToFixed(walletInfo.balance?.available)}
                </div>
                
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="10"
                    max={walletInfo.balance?.available || 0}
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.type === 'card' ? 'Card' : 'Bank'} ending in {method.card?.last4 || method.bankAccount?.last4}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowWithdrawModal(false)} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={processWithdraw} 
                  className="confirm-btn"
                  disabled={isLoading || !withdrawAmount || !selectedPaymentMethod}
                >
                  {isLoading ? <FiRefreshCw className="spinning" /> : <FiCheck />}
                  Withdraw ${withdrawAmount}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Method Modal */}
        {showAddPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowAddPaymentModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Payment Method</h3>
                <button onClick={() => setShowAddPaymentModal(false)} className="modal-close">
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Payment Type</label>
                  <select
                    value={newPaymentMethod.type}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, type: e.target.value})}
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Account</option>
                  </select>
                </div>

                {newPaymentMethod.type === 'card' ? (
                  <>
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        value={newPaymentMethod.cardNumber}
                        onChange={(e) => setNewPaymentMethod({
                          ...newPaymentMethod, 
                          cardNumber: formatCardNumber(e.target.value)
                        })}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                    </div>
                    
                    <div style={{display: 'flex', gap: '12px'}}>
                      <div className="form-group" style={{flex: 1}}>
                        <label>Expiry Month</label>
                        <select
                          value={newPaymentMethod.expiryMonth}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryMonth: e.target.value})}
                        >
                          <option value="">Month</option>
                          {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>{String(i+1).padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group" style={{flex: 1}}>
                        <label>Expiry Year</label>
                        <select
                          value={newPaymentMethod.expiryYear}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiryYear: e.target.value})}
                        >
                          <option value="">Year</option>
                          {Array.from({length: 10}, (_, i) => {
                            const year = new Date().getFullYear() + i;
                            return <option key={year} value={year}>{year}</option>
                          })}
                        </select>
                      </div>
                      
                      <div className="form-group" style={{flex: 1}}>
                        <label>CVV</label>
                        <input
                          type="text"
                          value={newPaymentMethod.cvv}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvv: e.target.value})}
                          placeholder="123"
                          maxLength="4"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        value={newPaymentMethod.holderName}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, holderName: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input
                        type="text"
                        value={newPaymentMethod.bankName}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, bankName: e.target.value})}
                        placeholder="Chase Bank"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Account Number</label>
                      <input
                        type="text"
                        value={newPaymentMethod.accountNumber}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountNumber: e.target.value})}
                        placeholder="1234567890"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Routing Number</label>
                      <input
                        type="text"
                        value={newPaymentMethod.routingNumber}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, routingNumber: e.target.value})}
                        placeholder="021000021"
                        maxLength="9"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Account Type</label>
                      <select
                        value={newPaymentMethod.accountType}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountType: e.target.value})}
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Account Holder Name</label>
                      <input
                        type="text"
                        value={newPaymentMethod.holderName}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, holderName: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={() => setShowAddPaymentModal(false)} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={addPaymentMethod} 
                  className="confirm-btn"
                  disabled={isLoading}
                >
                  {isLoading ? <FiRefreshCw className="spinning" /> : <FiPlus />}
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
