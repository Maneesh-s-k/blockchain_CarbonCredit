import React, { useState } from 'react';
import { 
  FiBarChart2, 
  FiDollarSign, 
  FiZap, 
  FiCalendar,
  FiDownload,
  FiFilter,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';

export default function History() {
  const [timeRange, setTimeRange] = useState('30d');
  const [filter, setFilter] = useState('all');

  // Mock transaction data
  const transactions = [
    {
      id: 1,
      type: 'sell',
      amount: 150,
      price: 0.12,
      total: 18.00,
      date: '2024-01-15',
      status: 'completed',
      counterparty: 'Green Energy Corp'
    },
    {
      id: 2,
      type: 'buy',
      amount: 75,
      price: 0.10,
      total: 7.50,
      date: '2024-01-14',
      status: 'completed',
      counterparty: 'Solar Solutions LLC'
    },
    {
      id: 3,
      type: 'sell',
      amount: 200,
      price: 0.11,
      total: 22.00,
      date: '2024-01-13',
      status: 'pending',
      counterparty: 'Wind Power Co'
    }
  ];

  const stats = {
    totalTrades: 45,
    totalVolume: 2450,
    totalRevenue: 294.50,
    avgPrice: 0.12
  };

  return (
    <div className="history-page">
      <div className="history-container">
        {/* Header */}
        <div className="history-header">
          <div className="header-content">
            <h1>Trading History</h1>
            <p>Track your energy trading performance and transaction history</p>
          </div>
          <div className="header-actions">
            <button className="export-btn">
              <FiDownload />
              Export Data
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FiBarChart2 />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalTrades}</div>
              <div className="stat-label">Total Trades</div>
              <div className="stat-change positive">+12% this month</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiZap />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalVolume} kWh</div>
              <div className="stat-label">Total Volume</div>
              <div className="stat-change positive">+8% this month</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <div className="stat-value">${stats.totalRevenue}</div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-change positive">+15% this month</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-value">${stats.avgPrice}</div>
              <div className="stat-label">Avg Price/kWh</div>
              <div className="stat-change negative">-2% this month</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="history-filters">
          <div className="filter-group">
            <FiCalendar />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="filter-select"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          
          <div className="filter-group">
            <FiFilter />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Transactions</option>
              <option value="buy">Purchases</option>
              <option value="sell">Sales</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="chart-section">
          <div className="chart-header">
            <h3>Trading Performance</h3>
            <div className="chart-controls">
              <button className="chart-btn active">Volume</button>
              <button className="chart-btn">Revenue</button>
              <button className="chart-btn">Price</button>
            </div>
          </div>
          <div className="chart-placeholder">
            <FiBarChart2 style={{ fontSize: '64px', color: 'var(--text-muted)' }} />
            <p>Trading performance chart will be displayed here</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="transaction-history">
          <h3>Recent Transactions</h3>
          <div className="transaction-table">
            <div className="table-header">
              <div className="header-cell">Type</div>
              <div className="header-cell">Amount</div>
              <div className="header-cell">Price</div>
              <div className="header-cell">Total</div>
              <div className="header-cell">Date</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Counterparty</div>
            </div>
            
            {transactions.map(transaction => (
              <div key={transaction.id} className="table-row">
                <div className="table-cell">
                  <div className={`transaction-type ${transaction.type}`}>
                    {transaction.type === 'sell' ? <FiTrendingUp /> : <FiTrendingDown />}
                    {transaction.type}
                  </div>
                </div>
                <div className="table-cell">{transaction.amount} kWh</div>
                <div className="table-cell">${transaction.price}</div>
                <div className="table-cell">${transaction.total}</div>
                <div className="table-cell">{new Date(transaction.date).toLocaleDateString()}</div>
                <div className="table-cell">
                  <span className={`status-badge ${transaction.status}`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="table-cell">{transaction.counterparty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
