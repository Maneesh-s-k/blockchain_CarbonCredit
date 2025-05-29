import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiShoppingCart, 
  FiZap, 
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

export default function EnergyExchange() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL parameters for buy/sell actions
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const action = urlParams.get('action');
    
    if (action === 'sell') {
      setShowSellModal(true);
      setActiveTab('my-listings');
    } else if (action === 'buy') {
      setShowBuyModal(true);
      setActiveTab('marketplace');
    }
  }, [location]);

  // Mock marketplace data
  const marketplaceData = [
    {
      id: 1,
      seller: 'Solar Farm A',
      energyType: 'solar',
      amount: 500,
      price: 0.12,
      location: 'California',
      timeRemaining: '2h 30m',
      rating: 4.8
    },
    {
      id: 2,
      seller: 'Wind Power Co',
      energyType: 'wind',
      amount: 750,
      price: 0.10,
      location: 'Texas',
      timeRemaining: '1h 15m',
      rating: 4.9
    },
    {
      id: 3,
      seller: 'Hydro Solutions',
      energyType: 'hydro',
      amount: 300,
      price: 0.08,
      location: 'Oregon',
      timeRemaining: '45m',
      rating: 4.7
    }
  ];

  const getEnergyIcon = (type) => {
    switch (type) {
      case 'solar': return '☀️';
      case 'wind': return '💨';
      case 'hydro': return '💧';
      default: return '⚡';
    }
  };

  const handleBuyEnergy = (listing) => {
    console.log('Buying energy from:', listing.seller);
    setShowBuyModal(true);
  };

  const handleSellEnergy = () => {
    setShowSellModal(true);
    setActiveTab('my-listings');
  };

  const handleBuyClick = () => {
    setShowBuyModal(true);
    setActiveTab('marketplace');
  };

  return (
    <div className="energy-exchange">
      <div className="exchange-container">
        {/* Header */}
        <div className="exchange-header">
          <div className="header-content">
            <h1>Energy Exchange</h1>
            <p>Trade renewable energy credits with verified producers and consumers</p>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={() => setIsLoading(true)}
            >
              <FiRefreshCw className={isLoading ? 'spinning' : ''} />
            </button>
            <button 
              className="sell-energy-btn"
              onClick={handleSellEnergy}
            >
              <FiDollarSign />
              Sell Energy
            </button>
            <button 
              className="buy-energy-btn"
              onClick={handleBuyClick}
            >
              <FiShoppingCart />
              Buy Energy
            </button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="market-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <FiZap />
            </div>
            <div className="stat-content">
              <div className="stat-value">2,450 kWh</div>
              <div className="stat-label">Available Energy</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <div className="stat-value">$0.11</div>
              <div className="stat-label">Avg Price/kWh</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <div className="stat-value">156</div>
              <div className="stat-label">Active Traders</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-value">+12.5%</div>
              <div className="stat-label">24h Volume</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="exchange-tabs">
          <button 
            className={`tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('marketplace')}
          >
            <FiShoppingCart />
            Marketplace
          </button>
          <button 
            className={`tab-btn ${activeTab === 'my-listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-listings')}
          >
            <FiDollarSign />
            My Listings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FiClock />
            Trade History
          </button>
        </div>

        {/* Filters */}
        <div className="exchange-filters">
          <div className="filter-group">
            <FiFilter />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Energy Types</option>
              <option value="solar">Solar</option>
              <option value="wind">Wind</option>
              <option value="hydro">Hydro</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select className="filter-select">
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="time">Time Remaining</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="exchange-content">
          {activeTab === 'marketplace' && (
            <div className="marketplace-grid">
              {marketplaceData.map(listing => (
                <div key={listing.id} className="listing-card">
                  <div className="listing-header">
                    <div className="energy-type">
                      <span className="energy-emoji">{getEnergyIcon(listing.energyType)}</span>
                      <span className="energy-name">{listing.energyType}</span>
                    </div>
                    <div className="time-remaining">
                      <FiClock />
                      {listing.timeRemaining}
                    </div>
                  </div>
                  
                  <div className="listing-content">
                    <h3 className="seller-name">{listing.seller}</h3>
                    <div className="listing-details">
                      <div className="detail-row">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value">{listing.amount} kWh</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value">${listing.price}/kWh</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{listing.location}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Rating:</span>
                        <span className="detail-value">⭐ {listing.rating}</span>
                      </div>
                    </div>
                    
                    <div className="total-price">
                      Total: ${(listing.amount * listing.price).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="listing-actions">
                    <button 
                      className="buy-btn"
                      onClick={() => handleBuyEnergy(listing)}
                    >
                      <FiShoppingCart />
                      Buy Now
                    </button>
                    <button className="details-btn">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'my-listings' && (
            <div className="my-listings">
              <div className="empty-state">
                <FiDollarSign className="empty-icon" />
                <h3>No Active Listings</h3>
                <p>You don't have any energy listings yet.</p>
                <button 
                  className="create-listing-btn"
                  onClick={handleSellEnergy}
                >
                  <FiDollarSign />
                  Create Your First Listing
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="trade-history">
              <div className="empty-state">
                <FiClock className="empty-icon" />
                <h3>No Trade History</h3>
                <p>Your completed trades will appear here.</p>
                <button 
                  className="browse-btn"
                  onClick={() => setActiveTab('marketplace')}
                >
                  <FiShoppingCart />
                  Browse Marketplace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buy Energy Credits</h3>
              <button className="modal-close" onClick={() => setShowBuyModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Energy Type</label>
                <select>
                  <option>Solar Energy</option>
                  <option>Wind Energy</option>
                  <option>Hydro Energy</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (kWh)</label>
                <input type="number" placeholder="Enter amount" min="1" />
              </div>
              <div className="form-group">
                <label>Max Price per kWh</label>
                <input type="number" placeholder="$0.12" step="0.01" min="0.01" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowBuyModal(false)}>Cancel</button>
              <button className="confirm-btn">Place Buy Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sell Energy Credits</h3>
              <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Device</label>
                <select>
                  <option>Solar Panel System - 5.5kW</option>
                  <option>Wind Turbine - 2.0kW</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount to Sell (kWh)</label>
                <input type="number" placeholder="Enter amount" min="1" />
              </div>
              <div className="form-group">
                <label>Price per kWh</label>
                <input type="number" placeholder="$0.12" step="0.01" min="0.01" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSellModal(false)}>Cancel</button>
              <button className="confirm-btn">Create Listing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
