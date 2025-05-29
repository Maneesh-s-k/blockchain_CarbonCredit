import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FiArrowDownLeft
} from 'react-icons/fi';

export default function Payments() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const navigate = useNavigate();

  // Mock payment data
  const paymentMethods = [
    {
      id: 1,
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      isDefault: true,
      expiryMonth: 12,
      expiryYear: 2025
    },
    {
      id: 2,
      type: 'bank',
      last4: '1234',
      bank: 'Chase Bank',
      isDefault: false
    }
  ];

  const recentPayments = [
    {
      id: 1,
      amount: 45.20,
      type: 'credit',
      description: 'Energy sale to Green Corp',
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: 2,
      amount: 23.50,
      type: 'debit',
      description: 'Energy purchase from Solar LLC',
      date: '2024-01-14',
      status: 'completed'
    },
    {
      id: 3,
      amount: 67.80,
      type: 'credit',
      description: 'Energy sale to Wind Power Co',
      date: '2024-01-13',
      status: 'pending'
    }
  ];

  const balance = {
    available: 234.50,
    pending: 67.80,
    total: 302.30
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

  const processDeposit = () => {
    if (depositAmount && parseFloat(depositAmount) > 0) {
      console.log('Processing deposit:', depositAmount);
      // Add deposit logic here
      setShowDepositModal(false);
      setDepositAmount('');
      // Show success message
      alert(`Deposit of $${depositAmount} initiated successfully!`);
    }
  };

  const processWithdraw = () => {
    if (withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= balance.available) {
      console.log('Processing withdrawal:', withdrawAmount);
      // Add withdrawal logic here
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      // Show success message
      alert(`Withdrawal of $${withdrawAmount} initiated successfully!`);
    } else {
      alert('Invalid withdrawal amount or insufficient funds!');
    }
  };

  return (
    <div className="payments-page">
      <div className="payments-container">
        {/* Header */}
        <div className="payments-header">
          <div className="header-content">
            <h1>Payment Management</h1>
            <p>Manage your payment methods, view transaction history, and trade energy</p>
          </div>
          <div className="header-actions">
            <button className="buy-energy-btn" onClick={handleBuyEnergy}>
              <FiShoppingCart />
              Buy Energy
            </button>
            <button className="sell-energy-btn" onClick={handleSellEnergy}>
              <FiZap />
              Sell Energy
            </button>
            <button className="add-payment-btn">
              <FiPlus />
              Add Payment Method
            </button>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="balance-overview">
          <div className="balance-card main-balance">
            <div className="balance-header">
              <h3>Total Balance</h3>
              <FiDollarSign className="balance-icon" />
            </div>
            <div className="balance-amount">${balance.total.toFixed(2)}</div>
            <div className="balance-actions">
              <button className="withdraw-btn" onClick={handleWithdraw}>
                <FiArrowUpRight />
                Withdraw
              </button>
              <button className="deposit-btn" onClick={handleDeposit}>
                <FiArrowDownLeft />
                Deposit
              </button>
            </div>
          </div>
          
          <div className="balance-card">
            <div className="balance-header">
              <h4>Available</h4>
              <FiCheck className="balance-icon available" />
            </div>
            <div className="balance-amount">${balance.available.toFixed(2)}</div>
            <div className="balance-subtitle">Ready to use</div>
          </div>
          
          <div className="balance-card">
            <div className="balance-header">
              <h4>Pending</h4>
              <FiClock className="balance-icon pending" />
            </div>
            <div className="balance-amount">${balance.pending.toFixed(2)}</div>
            <div className="balance-subtitle">Processing</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-bar">
          <button className="quick-action" onClick={handleBuyEnergy}>
            <FiShoppingCart />
            <span>Buy Energy Credits</span>
          </button>
          <button className="quick-action" onClick={handleSellEnergy}>
            <FiZap />
            <span>Sell Energy</span>
          </button>
          <button className="quick-action" onClick={() => navigate('/devices')}>
            <FiSettings />
            <span>Manage Devices</span>
          </button>
          <button className="quick-action" onClick={() => navigate('/history')}>
            <FiCalendar />
            <span>View History</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="payments-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiDollarSign />
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
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings />
            Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="payments-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {recentPayments.map(payment => (
                    <div key={payment.id} className="activity-item">
                      <div className="activity-icon">
                        <FiDollarSign className={payment.type} />
                      </div>
                      <div className="activity-details">
                        <div className="activity-description">{payment.description}</div>
                        <div className="activity-date">{new Date(payment.date).toLocaleDateString()}</div>
                      </div>
                      <div className="activity-amount">
                        <span className={`amount ${payment.type}`}>
                          {payment.type === 'credit' ? '+' : '-'}${payment.amount.toFixed(2)}
                        </span>
                        <span className={`status ${payment.status}`}>{payment.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'methods' && (
            <div className="payment-methods">
              <div className="methods-grid">
                {paymentMethods.map(method => (
                  <div key={method.id} className="payment-method-card">
                    <div className="method-header">
                      <div className="method-type">
                        <FiCreditCard />
                        {method.type === 'card' ? method.brand : 'Bank Account'}
                      </div>
                      {method.isDefault && <span className="default-badge">Default</span>}
                    </div>
                    <div className="method-details">
                      <div className="method-number">
                        •••• •••• •••• {method.last4}
                      </div>
                      {method.type === 'card' && (
                        <div className="method-expiry">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </div>
                      )}
                      {method.type === 'bank' && (
                        <div className="method-bank">{method.bank}</div>
                      )}
                    </div>
                    <div className="method-actions">
                      <button className="edit-btn">Edit</button>
                      <button className="remove-btn">Remove</button>
                    </div>
                  </div>
                ))}
                
                <div className="add-method-card">
                  <FiPlus className="add-icon" />
                  <span>Add New Payment Method</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="payment-history">
              <div className="history-filters">
                <select className="filter-select">
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                </select>
                <select className="filter-select">
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 3 Months</option>
                  <option value="1y">Last Year</option>
                </select>
                <button className="export-btn">
                  <FiDownload />
                  Export
                </button>
              </div>
              
              <div className="history-table">
                <div className="table-header">
                  <div className="header-cell">Date</div>
                  <div className="header-cell">Description</div>
                  <div className="header-cell">Amount</div>
                  <div className="header-cell">Status</div>
                </div>
                
                {recentPayments.map(payment => (
                  <div key={payment.id} className="table-row">
                    <div className="table-cell">{new Date(payment.date).toLocaleDateString()}</div>
                    <div className="table-cell">{payment.description}</div>
                    <div className="table-cell">
                      <span className={`amount ${payment.type}`}>
                        {payment.type === 'credit' ? '+' : '-'}${payment.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="table-cell">
                      <span className={`status-badge ${payment.status}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="payment-settings">
              <div className="settings-section">
                <h3>
                  <FiShield />
                  Security Settings
                </h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your payments</p>
                  </div>
                  <button className="setting-toggle">Enable</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Payment Notifications</h4>
                    <p>Get notified about payment activities</p>
                  </div>
                  <button className="setting-toggle active">Enabled</button>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>
                  <FiDollarSign />
                  Payment Preferences
                </h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Auto-withdraw</h4>
                    <p>Automatically withdraw earnings to your default payment method</p>
                  </div>
                  <button className="setting-toggle">Enable</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Minimum Balance</h4>
                    <p>Set minimum balance before auto-withdrawal</p>
                  </div>
                  <input type="number" className="setting-input" placeholder="$100" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit Funds</h3>
              <button className="modal-close" onClick={() => setShowDepositModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount to Deposit</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select>
                  <option>Visa ending in 4242 (Default)</option>
                  <option>Bank Account ending in 1234</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDepositModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={processDeposit}>Deposit ${depositAmount}</button>
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
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="available-balance">
                Available Balance: ${balance.available.toFixed(2)}
              </div>
              <div className="form-group">
                <label>Amount to Withdraw</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={balance.available}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Withdraw To</label>
                <select>
                  <option>Visa ending in 4242 (Default)</option>
                  <option>Bank Account ending in 1234</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={processWithdraw}>Withdraw ${withdrawAmount}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
