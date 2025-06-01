import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { blockchainService } from '../../services/blockchainService';
import { 
  FiShoppingCart, 
  FiDollarSign, 
  FiTrendingUp, 
  FiFilter, 
  FiRefreshCw, 
  FiEye, 
  FiClock, 
  FiCheck, 
  FiX,
  FiZap,
  FiShield,
  FiLeaf,
  FiGlobe,
  FiCalendar,
  FiBarChart2,
  FiAlertTriangle,
  FiSend
} from 'react-icons/fi';

const CarbonCreditMarketplace = () => {
  const [marketplaceData, setMarketplaceData] = useState({
    listings: [],
    userTokens: [],
    marketStats: {
      totalListings: 0,
      activeListings: 0,
      totalVolume: 0,
      averagePrice: 0
    },
    userAddress: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    projectType: 'all',
    vintage: 'all',
    sortBy: 'newest'
  });
  
  const [sellFormData, setSellFormData] = useState({
    tokenId: '',
    price: '',
    amount: '',
    description: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      setError('');

      // Initialize blockchain connection
      let userAddress = '';
      try {
        userAddress = await blockchainService.initialize();
      } catch (blockchainError) {
        console.log('Blockchain not available:', blockchainError.message);
      }

      // Load carbon credit marketplace data from backend
      const [carbonCredits, userTokens, marketStats] = await Promise.all([
        apiService.getCarbonCreditMarketplace().catch(() => ({ success: false, carbonCredits: [] })),
        userAddress ? blockchainService.getUserTokens(userAddress).catch(() => []) : [],
        apiService.getCarbonCreditStats().catch(() => ({ success: false, stats: {} }))
      ]);

      // Transform carbon credits data
      const transformedListings = carbonCredits.success ? 
        carbonCredits.carbonCredits.map(credit => ({
          id: credit._id,
          tokenId: credit.blockchain?.creditId || credit._id,
          carbonAmount: credit.carbonAmount,
          energyAmount: credit.energyAmount,
          price: credit.trading?.price || 25, // Default price per tCO2
          projectType: credit.metadata?.projectType || 'solar',
          location: credit.metadata?.location?.country || 'Unknown',
          vintage: credit.metadata?.vintage || new Date().getFullYear(),
          verifier: credit.metadata?.certificationStandard || 'VCS',
          seller: credit.owner?.username || 'Anonymous',
          verified: credit.verification?.status === 'verified',
          isAvailable: credit.trading?.isAvailableForTrading && !credit.retirement?.isRetired,
          timestamp: new Date(credit.createdAt).getTime()
        })) : [];

      // Transform user tokens
      const transformedUserTokens = userTokens.map(token => ({
        ...token,
        isListed: false // Check if already listed
      }));

      // Calculate market stats
      const calculatedStats = {
        totalListings: transformedListings.length,
        activeListings: transformedListings.filter(l => l.isAvailable).length,
        totalVolume: transformedListings.reduce((sum, l) => sum + l.carbonAmount, 0),
        averagePrice: transformedListings.length > 0 ? 
          transformedListings.reduce((sum, l) => sum + l.price, 0) / transformedListings.length : 0
      };

      setMarketplaceData({
        listings: transformedListings,
        userTokens: transformedUserTokens,
        marketStats: calculatedStats,
        userAddress
      });

    } catch (error) {
      console.error('Error loading marketplace data:', error);
      setError('Failed to load marketplace data. Please check your connection.');
      
      // Fallback to demo data
      setMarketplaceData({
        listings: [
          {
            id: '1',
            tokenId: '1',
            carbonAmount: 50,
            energyAmount: 100,
            price: 25,
            projectType: 'solar',
            location: 'California, USA',
            vintage: 2024,
            verifier: 'VCS',
            seller: 'SolarFarm Co',
            verified: true,
            isAvailable: true,
            timestamp: Date.now()
          },
          {
            id: '2',
            tokenId: '2',
            carbonAmount: 100,
            energyAmount: 200,
            price: 30,
            projectType: 'wind',
            location: 'Texas, USA',
            vintage: 2024,
            verifier: 'Gold Standard',
            seller: 'WindPower LLC',
            verified: true,
            isAvailable: true,
            timestamp: Date.now()
          }
        ],
        userTokens: [],
        marketStats: {
          totalListings: 2,
          activeListings: 2,
          totalVolume: 150,
          averagePrice: 27.5
        },
        userAddress: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredit = async (listing) => {
    try {
      setLoading(true);
      setError('');

      // Try backend purchase first
      try {
        const purchaseData = {
          carbonCreditId: listing.id,
          amount: listing.carbonAmount,
          paymentMethod: 'wallet'
        };

        const response = await apiService.purchaseCarbonCredit(purchaseData);
        
        if (response.success) {
          setSuccess('Carbon credit purchased successfully! 🎉');
        } else {
          throw new Error(response.message || 'Backend purchase failed');
        }
      } catch (backendError) {
        console.log('Backend purchase failed, trying blockchain:', backendError.message);
        
        // Fallback to blockchain purchase
        if (marketplaceData.userAddress && listing.tokenId) {
          const tx = await blockchainService.purchaseCredit(listing.tokenId, listing.price);
          await tx.wait();
          setSuccess('Carbon credit purchased via blockchain! 🎉');
        } else {
          throw new Error('No payment method available');
        }
      }

      setShowModal(false);
      await loadMarketplaceData(); // Refresh data

    } catch (error) {
      console.error('Error purchasing credit:', error);
      setError('Failed to purchase credit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleListCredit = async () => {
    if (!sellFormData.tokenId || !sellFormData.price || !sellFormData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Try blockchain listing
      if (marketplaceData.userAddress) {
        const tx = await blockchainService.listCreditForSale(
          sellFormData.tokenId, 
          sellFormData.price
        );
        await tx.wait();
        setSuccess('Carbon credit listed for sale successfully! 🎉');
      } else {
        throw new Error('Blockchain not available');
      }

      setShowSellModal(false);
      setSellFormData({ tokenId: '', price: '', amount: '', description: '' });
      await loadMarketplaceData(); // Refresh data

    } catch (error) {
      console.error('Error listing credit:', error);
      setError('Failed to list credit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetireCredit = async (tokenId) => {
    try {
      setLoading(true);
      setError('');

      const tx = await blockchainService.retireCredit(tokenId, 'Environmental offset');
      await tx.wait();
      
      setSuccess('Carbon credit retired successfully! 🌱');
      await loadMarketplaceData();

    } catch (error) {
      console.error('Error retiring credit:', error);
      setError('Failed to retire credit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProjectIcon = (type) => {
    switch (type) {
      case 'solar': return '☀️';
      case 'wind': return '💨';
      case 'hydro': return '💧';
      case 'geothermal': return '🌋';
      case 'biomass': return '🌿';
      default: return '🌱';
    }
  };

  const filteredListings = marketplaceData.listings.filter(listing => {
    if (!listing.isAvailable) return false;
    
    if (filters.projectType !== 'all' && listing.projectType !== filters.projectType) {
      return false;
    }
    
    if (filters.priceRange !== 'all') {
      const price = listing.price;
      switch (filters.priceRange) {
        case 'low': return price < 20;
        case 'medium': return price >= 20 && price < 40;
        case 'high': return price >= 40;
        default: return true;
      }
    }
    
    if (filters.vintage !== 'all') {
      const currentYear = new Date().getFullYear();
      switch (filters.vintage) {
        case 'recent': return listing.vintage >= currentYear - 2;
        case 'older': return listing.vintage < currentYear - 2;
        default: return true;
      }
    }
    
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'carbon-high': return b.carbonAmount - a.carbonAmount;
      case 'newest': default: return b.timestamp - a.timestamp;
    }
  });

  return (
    <div className="carbon-marketplace">
      <div className="marketplace-container">
        {/* Header */}
        <div className="marketplace-header">
          <div className="header-content">
            <h1>Carbon Credit Marketplace</h1>
            <p>Trade verified carbon credits powered by blockchain technology</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={loadMarketplaceData} 
              className="refresh-btn"
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'spinning' : ''} />
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

        {/* Market Statistics */}
        <div className="market-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FiBarChart2 />
            </div>
            <div className="stat-content">
              <div className="stat-value">{marketplaceData.marketStats.totalListings}</div>
              <div className="stat-label">Total Credits</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiShoppingCart />
            </div>
            <div className="stat-content">
              <div className="stat-value">{marketplaceData.marketStats.activeListings}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiLeaf />
            </div>
            <div className="stat-content">
              <div className="stat-value">{marketplaceData.marketStats.totalVolume.toFixed(0)} tCO₂</div>
              <div className="stat-label">Total Volume</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <div className="stat-value">${marketplaceData.marketStats.averagePrice.toFixed(0)}</div>
              <div className="stat-label">Avg Price</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="marketplace-tabs">
          <button 
            className={`tab ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            <FiShoppingCart />
            Buy Credits
          </button>
          <button 
            className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            <FiDollarSign />
            My Credits
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiTrendingUp />
            Analytics
          </button>
        </div>

        {/* Buy Credits Tab */}
        {activeTab === 'buy' && (
          <div className="buy-credits-section">
            {/* Filters */}
            <div className="marketplace-filters">
              <div className="filter-group">
                <FiFilter />
                <label>Project Type:</label>
                <select 
                  value={filters.projectType} 
                  onChange={(e) => setFilters({...filters, projectType: e.target.value})}
                >
                  <option value="all">All Types</option>
                  <option value="solar">Solar</option>
                  <option value="wind">Wind</option>
                  <option value="hydro">Hydro</option>
                  <option value="geothermal">Geothermal</option>
                  <option value="biomass">Biomass</option>
                </select>
              </div>

              <div className="filter-group">
                <FiDollarSign />
                <label>Price Range:</label>
                <select 
                  value={filters.priceRange} 
                  onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                >
                  <option value="all">All Prices</option>
                  <option value="low">Under $20</option>
                  <option value="medium">$20 - $40</option>
                  <option value="high">Over $40</option>
                </select>
              </div>

              <div className="filter-group">
                <FiCalendar />
                <label>Vintage:</label>
                <select 
                  value={filters.vintage} 
                  onChange={(e) => setFilters({...filters, vintage: e.target.value})}
                >
                  <option value="all">All Years</option>
                  <option value="recent">Recent (2022+)</option>
                  <option value="older">Older (Pre-2022)</option>
                </select>
              </div>

              <div className="filter-group">
                <FiTrendingUp />
                <label>Sort By:</label>
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="carbon-high">Most Carbon</option>
                </select>
              </div>
            </div>

            {/* Credits Grid */}
            <div className="credits-grid">
              {loading ? (
                <div className="loading-state">
                  <FiRefreshCw className="spinning" />
                  <p>Loading marketplace...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="empty-state">
                  <FiShoppingCart />
                  <h3>No carbon credits available</h3>
                  <p>No carbon credits match your current filters.</p>
                </div>
              ) : (
                filteredListings.map((listing) => (
                  <div key={listing.id} className="credit-card">
                    <div className="credit-header">
                      <div className="project-type">
                        <span className="project-icon">{getProjectIcon(listing.projectType)}</span>
                        <span className="project-name">{listing.projectType}</span>
                      </div>
                      {listing.verified && (
                        <div className="verified-badge">
                          <FiShield />
                          Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="credit-content">
                      <div className="carbon-amount">
                        <span className="amount">{listing.carbonAmount}</span>
                        <span className="unit">tCO₂</span>
                      </div>
                      
                      <div className="credit-details">
                        <div className="detail">
                          <FiGlobe />
                          <span>Location: {listing.location}</span>
                        </div>
                        <div className="detail">
                          <FiCalendar />
                          <span>Vintage: {listing.vintage}</span>
                        </div>
                        <div className="detail">
                          <FiShield />
                          <span>Verified by {listing.verifier}</span>
                        </div>
                        <div className="detail">
                          <FiZap />
                          <span>Energy: {listing.energyAmount} kWh</span>
                        </div>
                      </div>
                      
                      <div className="price-section">
                        <div className="price">
                          <span className="amount">${listing.price}</span>
                          <span className="unit">per tCO₂</span>
                        </div>
                        <div className="total">
                          Total: ${(listing.carbonAmount * listing.price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="credit-actions">
                      <button 
                        className="view-btn"
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowModal(true);
                        }}
                      >
                        <FiEye />
                        View Details
                      </button>
                      <button 
                        className="buy-btn"
                        onClick={() => handleBuyCredit(listing)}
                        disabled={loading}
                      >
                        <FiShoppingCart />
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* My Credits Tab */}
        {activeTab === 'sell' && (
          <div className="my-credits-section">
            <div className="section-header">
              <h3>My Carbon Credits</h3>
              <button 
                className="sell-btn"
                onClick={() => setShowSellModal(true)}
                disabled={marketplaceData.userTokens.length === 0}
              >
                <FiDollarSign />
                List for Sale
              </button>
            </div>

            <div className="credits-grid">
              {marketplaceData.userTokens.length === 0 ? (
                <div className="empty-state">
                  <FiLeaf />
                  <h3>No carbon credits owned</h3>
                  <p>You don't have any carbon credits to sell.</p>
                </div>
              ) : (
                marketplaceData.userTokens.map((token) => (
                  <div key={token.tokenId} className="credit-card owned">
                    <div className="credit-header">
                      <div className="project-type">
                        <span className="project-icon">{getProjectIcon(token.projectType)}</span>
                        <span className="project-name">{token.projectType}</span>
                      </div>
                      <div className="token-id">#{token.tokenId}</div>
                    </div>
                    
                    <div className="credit-content">
                      <div className="carbon-amount">
                        <span className="amount">{token.carbonAmount}</span>
                        <span className="unit">tCO₂</span>
                      </div>
                      
                      <div className="credit-details">
                        <div className="detail">
                          <FiCalendar />
                          <span>Generated: {new Date(token.timestamp * 1000 || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="detail">
                          <FiGlobe />
                          <span>Location: {token.location}</span>
                        </div>
                        <div className="detail">
                          <FiZap />
                          <span>Energy: {token.energyAmount} kWh</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="credit-actions">
                      <button 
                        className="sell-btn"
                        onClick={() => {
                          setSellFormData({...sellFormData, tokenId: token.tokenId, amount: token.carbonAmount});
                          setShowSellModal(true);
                        }}
                        disabled={token.isListed}
                      >
                        <FiDollarSign />
                        {token.isListed ? 'Listed' : 'Sell'}
                      </button>
                      <button 
                        className="retire-btn"
                        onClick={() => handleRetireCredit(token.tokenId)}
                        disabled={loading}
                      >
                        <FiLeaf />
                        Retire
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h3>Market Analytics</h3>
            <div className="analytics-grid">
              <div className="chart-card">
                <h4>Price Trends</h4>
                <div className="chart-placeholder">
                  <FiTrendingUp />
                  <p>Price chart coming soon</p>
                </div>
              </div>
              <div className="chart-card">
                <h4>Volume Trends</h4>
                <div className="chart-placeholder">
                  <FiBarChart2 />
                  <p>Volume chart coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credit Details Modal */}
      {showModal && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Carbon Credit Details</h3>
              <button onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="credit-detail-grid">
                <div className="detail-section">
                  <h4>Project Information</h4>
                  <div className="detail-row">
                    <span>Project Type:</span>
                    <span>{getProjectIcon(selectedListing.projectType)} {selectedListing.projectType}</span>
                  </div>
                  <div className="detail-row">
                    <span>Location:</span>
                    <span>{selectedListing.location}</span>
                  </div>
                  <div className="detail-row">
                    <span>Vintage:</span>
                    <span>{selectedListing.vintage}</span>
                  </div>
                  <div className="detail-row">
                    <span>Verifier:</span>
                    <span>{selectedListing.verifier}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Credit Details</h4>
                  <div className="detail-row">
                    <span>Carbon Amount:</span>
                    <span>{selectedListing.carbonAmount} tCO₂</span>
                  </div>
                  <div className="detail-row">
                    <span>Energy Generated:</span>
                    <span>{selectedListing.energyAmount} kWh</span>
                  </div>
                  <div className="detail-row">
                    <span>Price per tCO₂:</span>
                    <span>${selectedListing.price}</span>
                  </div>
                  <div className="detail-row">
                    <span>Total Price:</span>
                    <span>${(selectedListing.carbonAmount * selectedListing.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button 
                className="buy-btn"
                onClick={() => handleBuyCredit(selectedListing)}
                disabled={loading}
              >
                {loading ? <FiRefreshCw className="spinning" /> : <FiShoppingCart />}
                Buy Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>List Carbon Credit for Sale</h3>
              <button onClick={() => setShowSellModal(false)}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Select Credit</label>
                <select
                  value={sellFormData.tokenId}
                  onChange={(e) => {
                    const token = marketplaceData.userTokens.find(t => t.tokenId === e.target.value);
                    setSellFormData({
                      ...sellFormData, 
                      tokenId: e.target.value,
                      amount: token?.carbonAmount || ''
                    });
                  }}
                >
                  <option value="">Select a credit</option>
                  {marketplaceData.userTokens.map(token => (
                    <option key={token.tokenId} value={token.tokenId}>
                      #{token.tokenId} - {token.carbonAmount} tCO₂ ({token.projectType})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Price per tCO₂ ($)</label>
                <input
                  type="number"
                  value={sellFormData.price}
                  onChange={(e) => setSellFormData({...sellFormData, price: e.target.value})}
                  placeholder="Enter price"
                  min="1"
                  max="1000"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>Amount (tCO₂)</label>
                <input
                  type="number"
                  value={sellFormData.amount}
                  onChange={(e) => setSellFormData({...sellFormData, amount: e.target.value})}
                  placeholder="Amount to sell"
                  min="0.1"
                  step="0.1"
                  readOnly
                />
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={sellFormData.description}
                  onChange={(e) => setSellFormData({...sellFormData, description: e.target.value})}
                  placeholder="Additional details about your carbon credit..."
                  rows="3"
                />
              </div>

              {sellFormData.amount && sellFormData.price && (
                <div className="total-value">
                  <strong>Total Value: ${(parseFloat(sellFormData.amount) * parseFloat(sellFormData.price)).toFixed(2)}</strong>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowSellModal(false)}
              >
                Cancel
              </button>
              <button 
                className="list-btn"
                onClick={handleListCredit}
                disabled={loading || !sellFormData.tokenId || !sellFormData.price}
              >
                {loading ? <FiRefreshCw className="spinning" /> : <FiSend />}
                List for Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbonCreditMarketplace;
