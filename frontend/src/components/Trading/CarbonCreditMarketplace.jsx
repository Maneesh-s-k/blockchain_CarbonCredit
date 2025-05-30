import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import blockchainService from '../../services/blockchainService';
import { 
  FiShoppingCart, 
  FiDollarSign, 
  FiTrendingUp,
  FiFilter,
  FiSearch,
  FiMapPin,
  FiCalendar,
  FiZap,
  FiShield,
  FiEye,
  FiHeart,
  FiShare2
} from 'react-icons/fi';

export default function CarbonCreditMarketplace() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    projectType: 'all',
    minPrice: '',
    maxPrice: '',
    vintage: 'all',
    location: 'all',
    verified: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price-asc');
  const [marketStats, setMarketStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalVolume: 0,
    averagePrice: 0
  });

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [listings, filters, searchTerm, sortBy]);

  const fetchMarketplaceData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch from your backend API
      const response = await fetch('/api/carbon-credits/marketplace');
      const data = await response.json();
      
      if (data.success) {
        setListings(data.carbonCredits);
        setMarketStats(data.marketStats.overall);
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...listings];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.metadata.projectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.metadata.location.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.projectType !== 'all') {
      filtered = filtered.filter(listing => listing.metadata.projectType === filters.projectType);
    }

    if (filters.vintage !== 'all') {
      filtered = filtered.filter(listing => listing.metadata.vintage.toString() === filters.vintage);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(listing => listing.trading.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(listing => listing.trading.price <= parseFloat(filters.maxPrice));
    }

    if (filters.verified) {
      filtered = filtered.filter(listing => listing.verification.status === 'verified');
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.trading.price - b.trading.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.trading.price - a.trading.price);
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.carbonAmount - a.carbonAmount);
        break;
      case 'vintage-desc':
        filtered.sort((a, b) => b.metadata.vintage - a.metadata.vintage);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    setFilteredListings(filtered);
  };

  const handlePurchase = async (listing) => {
    try {
      setIsLoading(true);
      
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Calculate total cost
      const totalCost = listing.carbonAmount * listing.trading.price;
      
      // Confirm purchase
      const confirmed = window.confirm(
        `Purchase ${listing.carbonAmount} carbon credits for $${totalCost.toFixed(2)}?`
      );
      
      if (!confirmed) return;

      // Execute blockchain transaction
      const result = await blockchainService.purchaseCarbonCredits(
        listing._id,
        listing.carbonAmount,
        listing.trading.price
      );

      if (result.success) {
        alert('Purchase successful! Transaction hash: ' + result.transactionHash);
        await fetchMarketplaceData(); // Refresh data
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectTypeIcon = (type) => {
    switch (type) {
      case 'solar': return '☀️';
      case 'wind': return '💨';
      case 'hydro': return '💧';
      case 'geothermal': return '🌋';
      case 'biomass': return '🌱';
      default: return '⚡';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="carbon-marketplace">
      <div className="marketplace-container">
        {/* Header */}
        <div className="marketplace-header">
          <div className="header-content">
            <h1>Carbon Credit Marketplace</h1>
            <p>Trade verified carbon credits with zero-knowledge privacy</p>
          </div>
          
          <div className="market-stats">
            <div className="stat-item">
              <div className="stat-value">{marketStats.activeListings}</div>
              <div className="stat-label">Active Listings</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{marketStats.totalVolume.toLocaleString()}</div>
              <div className="stat-label">Total Volume (tCO₂)</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatCurrency(marketStats.averagePrice)}</div>
              <div className="stat-label">Avg Price/tCO₂</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="marketplace-controls">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by project type, location, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <FiFilter />
              <select 
                value={filters.projectType} 
                onChange={(e) => setFilters({...filters, projectType: e.target.value})}
              >
                <option value="all">All Project Types</option>
                <option value="solar">Solar</option>
                <option value="wind">Wind</option>
                <option value="hydro">Hydro</option>
                <option value="geothermal">Geothermal</option>
                <option value="biomass">Biomass</option>
              </select>
            </div>

            <div className="filter-group">
              <FiCalendar />
              <select 
                value={filters.vintage} 
                onChange={(e) => setFilters({...filters, vintage: e.target.value})}
              >
                <option value="all">All Vintages</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>

            <div className="price-range">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              />
            </div>

            <div className="sort-group">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="vintage-desc">Newest Vintage</option>
                <option value="newest">Recently Listed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="listings-section">
          {isLoading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="listing-card skeleton">
                  <div className="skeleton-header"></div>
                  <div className="skeleton-content"></div>
                  <div className="skeleton-footer"></div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="empty-state">
              <FiZap className="empty-icon" />
              <h3>No carbon credits found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="listings-grid">
              {filteredListings.map(listing => (
                <div key={listing._id} className="listing-card">
                  <div className="listing-header">
                    <div className="project-info">
                      <span className="project-emoji">
                        {getProjectTypeIcon(listing.metadata.projectType)}
                      </span>
                      <div className="project-details">
                        <h3 className="project-type">{listing.metadata.projectType}</h3>
                        <div className="project-location">
                          <FiMapPin />
                          {listing.metadata.location.country}
                        </div>
                      </div>
                    </div>
                    
                    <div className="listing-actions">
                      <button className="action-btn favorite">
                        <FiHeart />
                      </button>
                      <button className="action-btn share">
                        <FiShare2 />
                      </button>
                    </div>
                  </div>

                  <div className="listing-content">
                    <div className="credit-amount">
                      <span className="amount">{listing.carbonAmount}</span>
                      <span className="unit">tCO₂</span>
                    </div>

                    <div className="price-info">
                      <div className="price-per-unit">
                        {formatCurrency(listing.trading.price)} <span>per tCO₂</span>
                      </div>
                      <div className="total-price">
                        Total: {formatCurrency(listing.carbonAmount * listing.trading.price)}
                      </div>
                    </div>

                    <div className="listing-details">
                      <div className="detail-row">
                        <span className="detail-label">Vintage:</span>
                        <span className="detail-value">{listing.metadata.vintage}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Standard:</span>
                        <span className="detail-value">{listing.metadata.certificationStandard}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Seller:</span>
                        <span className="detail-value">@{listing.owner.username}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Rating:</span>
                        <span className="detail-value">
                          ⭐ {listing.owner.statistics.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="verification-status">
                      <FiShield className="verified-icon" />
                      <span>ZK-Verified</span>
                      <div className="confidence-score">
                        {listing.verification.confidence}% confidence
                      </div>
                    </div>

                    <div className="environmental-impact">
                      <h4>Environmental Impact</h4>
                      <div className="impact-stats">
                        <div className="impact-item">
                          <span className="impact-value">
                            {listing.environmentalImpact.treesEquivalent}
                          </span>
                          <span className="impact-label">Trees Planted</span>
                        </div>
                        <div className="impact-item">
                          <span className="impact-value">
                            {listing.environmentalImpact.carsOffRoad}
                          </span>
                          <span className="impact-label">Cars Off Road</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="listing-footer">
                    <button 
                      className="view-details-btn"
                      onClick={() => {/* Navigate to details */}}
                    >
                      <FiEye />
                      View Details
                    </button>
                    
                    <button 
                      className="purchase-btn"
                      onClick={() => handlePurchase(listing)}
                      disabled={isLoading}
                    >
                      <FiShoppingCart />
                      {isLoading ? 'Processing...' : 'Purchase'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredListings.length > 0 && (
          <div className="load-more-section">
            <button className="load-more-btn">
              Load More Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
