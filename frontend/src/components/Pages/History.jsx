import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { 
  FiBarChart2, 
  FiDollarSign, 
  FiZap, 
  FiCalendar, 
  FiDownload, 
  FiFilter, 
  FiTrendingUp, 
  FiTrendingDown,
  FiRefreshCw,
  FiAlertTriangle,
  FiLoader
} from 'react-icons/fi';

export default function History() {
  const [timeRange, setTimeRange] = useState('30d');
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTrades: 45,
    totalVolume: 2450,
    totalRevenue: 294.50,
    avgPrice: 0.12
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchTransactionData();
  }, [timeRange, filter]);

  const fetchTransactionData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const params = {
        role: 'both',
        page: 1,
        limit: 50,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await apiService.getUserTransactions(params);
      
      if (response.success) {
        // Transform data to match your existing format
        const transformedTransactions = response.transactions.map(transaction => ({
          id: transaction._id,
          type: transaction.buyer._id === user.id ? 'buy' : 'sell',
          amount: transaction.energy.amount,
          price: transaction.energy.pricePerKwh,
          total: transaction.energy.totalPrice,
          date: new Date(transaction.createdAt).toLocaleDateString(),
          status: transaction.status,
          counterparty: transaction.buyer._id === user.id 
            ? transaction.seller.username 
            : transaction.buyer.username
        }));

        setTransactions(transformedTransactions);
        
        // Calculate stats from the data
        const calculatedStats = {
          totalTrades: transformedTransactions.length,
          totalVolume: transformedTransactions.reduce((sum, t) => sum + t.amount, 0),
          totalRevenue: transformedTransactions
            .filter(t => t.type === 'sell')
            .reduce((sum, t) => sum + t.total, 0),
          avgPrice: transformedTransactions.length > 0 
            ? transformedTransactions.reduce((sum, t) => sum + t.price, 0) / transformedTransactions.length 
            : 0.12
        };

        setStats(calculatedStats);
      } else {
        throw new Error(response.message || 'Failed to fetch transaction data');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Unable to load transaction data. Showing demo data.');
      
      // Fallback to your original mock data
      setTransactions([
        { id: 1, type: 'sell', amount: 150, price: 0.12, total: 18.00, date: '2024-01-15', status: 'completed', counterparty: 'Green Energy Corp' },
        { id: 2, type: 'buy', amount: 75, price: 0.10, total: 7.50, date: '2024-01-14', status: 'completed', counterparty: 'Solar Solutions LLC' },
        { id: 3, type: 'sell', amount: 200, price: 0.11, total: 22.00, date: '2024-01-13', status: 'pending', counterparty: 'Wind Power Co' },
        { id: 4, type: 'buy', amount: 100, price: 0.09, total: 9.00, date: '2024-01-12', status: 'completed', counterparty: 'Hydro Power Inc' },
        { id: 5, type: 'sell', amount: 300, price: 0.13, total: 39.00, date: '2024-01-11', status: 'completed', counterparty: 'Renewable Solutions' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csvData = transactions.map(transaction => ({
      'Date': transaction.date,
      'Type': transaction.type.toUpperCase(),
      'Amount (kWh)': transaction.amount,
      'Price per kWh': `$${transaction.price}`,
      'Total': `$${transaction.total}`,
      'Status': transaction.status,
      'Counterparty': transaction.counterparty
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy-trading-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter transactions based on current filter
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  return (
    <div className="history-page">
      <div className="history-container">
        {/* Using your exact CSS class names */}
        <div className="history-header">
          <div className="header-content">
            <h1>Trading History</h1>
            <p>Track your energy trading performance and transaction history</p>
          </div>
          <div className="header-actions">
            <button onClick={fetchTransactionData} className="refresh-btn" disabled={isLoading}>
              <FiRefreshCw className={isLoading ? 'spinning' : ''} />
            </button>
            <button onClick={handleExport} className="export-btn" disabled={transactions.length === 0}>
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <FiAlertTriangle />
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Using your exact glassmorphism CSS classes */}
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
              <div className="stat-value">{stats.totalVolume.toFixed(0)} kWh</div>
              <div className="stat-label">Total Volume</div>
              <div className="stat-change positive">+8% this month</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-change positive">+15% this month</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-value">${stats.avgPrice.toFixed(3)}</div>
              <div className="stat-label">Avg Price</div>
              <div className="stat-change negative">-2% this month</div>
            </div>
          </div>
        </div>

        {/* Using your exact glassmorphism CSS classes */}
        <div className="history-filters">
          <div className="filter-group">
            <FiCalendar />
            <label>Time Range:</label>
            <select 
              className="filter-select"
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          <div className="filter-group">
            <FiFilter />
            <label>Filter:</label>
            <select 
              className="filter-select"
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Using your exact glassmorphism CSS classes */}
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
            {isLoading ? (
              <div className="loading-chart">
                <FiLoader className="spinning" />
                <p>Loading chart data...</p>
              </div>
            ) : (
              <>
                <FiBarChart2 style={{ fontSize: '48px', marginBottom: '16px' }} />
                <p>Trading performance chart will be displayed here</p>
              </>
            )}
          </div>
        </div>

        {/* Using your exact glassmorphism CSS classes */}
        <div className="transaction-history">
          <h3>Recent Transactions</h3>
          
          {isLoading ? (
            <div className="loading-transactions">
              <FiLoader className="spinning" />
              <p>Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="no-transactions">
              <FiBarChart2 />
              <p>No transactions found for the selected criteria.</p>
            </div>
          ) : (
            <div className="transaction-table">
              <div className="table-header">
                <div>Date</div>
                <div>Type</div>
                <div>Amount</div>
                <div>Price</div>
                <div>Total</div>
                <div>Status</div>
                <div>Counterparty</div>
              </div>
              
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="table-row">
                  <div className="table-cell">{transaction.date}</div>
                  <div className="table-cell">
                    <span className={`transaction-type ${transaction.type}`}>
                      {transaction.type === 'buy' ? <FiTrendingDown /> : <FiTrendingUp />}
                      {transaction.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="table-cell">{transaction.amount} kWh</div>
                  <div className="table-cell">${transaction.price}</div>
                  <div className="table-cell">${transaction.total.toFixed(2)}</div>
                  <div className="table-cell">
                    <span className={`status-badge ${transaction.status}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <div className="table-cell">{transaction.counterparty}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
