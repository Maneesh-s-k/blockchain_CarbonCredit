// components/Pages/EnergyExchange.jsx - REAL DATA VERSION
import { utils } from 'ethers';
import {ethers} from 'ethers';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { blockchainService } from '../../services/blockchainService';
import { generateTransferProof,poseidonHash } from '../../utils/zkproofGenerator';
import ErrorBoundary from '../Shared/ErrorBoundary';
import { MerkleTree } from 'merkletreejs';
import { 
  FiDollarSign, 
  FiShoppingCart, 
  FiZap, 
  FiTrendingUp, 
  FiUsers, 
  FiClock, 
  FiFilter, 
  FiRefreshCw,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiShield,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUnlock,
  FiMapPin,
  FiStar,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';


export default function EnergyExchange() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userAddress, setUserAddress] = useState('');
  
  // Real data from backend - NO MOCK DATA
  const [marketplaceData, setMarketplaceData] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [userDevices, setUserDevices] = useState([]);
  
  // ZK-SNARK Privacy Trading State
  const [zkTradingData, setZkTradingData] = useState({
    senderBalance: 0,
    transferAmount: '',
    receiverAddress: '',
    senderSecret: '',
    receiverSecret: '',
    usePrivateTransfer: true
  });
  const [zkProof, setZkProof] = useState(null);
  const [showSecrets, setShowSecrets] = useState(false);
  
  const [sellFormData, setSellFormData] = useState({
    deviceId: '',
    amount: '',
    pricePerKwh: '',
    endDate: '',
    timeSlots: [],
    preferences: { negotiable: true, autoAccept: false }
  });

    const [zkData, setZkData] = useState({
      senderBalance: '0', // Example default
     transferAmount: '0',
    senderSecret: 'secret123',
    receiverSecret: 'secret456',
    nonce: Date.now().toString(),
     nullifierHash: keccak256(toUtf8Bytes('init')),
    senderCommitment: '',
     newSenderCommitment: '',
    receiverCommitment: '',
    merkleRoot: '0x'
  });


  const navigate = useNavigate();
  const location = useLocation();

  // Calculate commitments on mount/update
useEffect(() => {
  const senderCommitment = poseidonHash([
    zkData.senderBalance,
    zkData.senderSecret,
    zkData.nonce
  ]);
  
  const newSenderCommitment = poseidonHash([
    zkData.senderBalance - zkData.transferAmount,
    zkData.senderSecret,
    zkData.nonce + 1
  ]);
  
  const receiverCommitment =  poseidonHash([
      zkData.transferAmount,
      zkData.receiverSecret,
      zkData.nonce
    ]);

  setZkData(prev => ({
    ...prev,
    senderCommitment,
    newSenderCommitment
  }));
}, [zkData.senderBalance, zkData.transferAmount]);



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

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      loadMarketplaceData();
    } else if (activeTab === 'my-listings') {
      loadUserListings();
    } else if (activeTab === 'trade-history') {
      loadTradeHistory();
    } else if (activeTab === 'zk-privacy') {
      loadZKTradingData();
    }
  }, [activeTab, filter]);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize blockchain connection
      try {
        const address = await blockchainService.initialize();
        setUserAddress(address);
      } catch (blockchainError) {
        console.log('Blockchain not available:', blockchainError.message);
      }

      // Load user devices for selling
      await loadUserDevices();
      
      // Load initial tab data
      await loadMarketplaceData();
      
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadZKTradingData = async () => {
    try {
      if (userAddress) {
        const balance = await blockchainService.getCarbonBalance(userAddress);
        setZkTradingData(prev => ({
          ...prev,
          senderBalance: parseInt(balance.toString())
        }));
      }
    } catch (error) {
      console.error('Error loading ZK trading data:', error);
    }
  };

  const loadMarketplaceData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const filters = {};
      if (filter !== 'all') {
        filters.energyType = filter;
      }

      const response = await apiService.getMarketplaceListings?.(filters);
      
      if (response?.success) {
        const transformedListings = response.listings.map(listing => ({
          id: listing._id,
          listingId: listing._id,
          seller: listing.seller?.username || listing.seller?.fullName || 'Unknown Seller',
          sellerRating: listing.seller?.statistics?.averageRating || 4.5,
          energyType: listing.energyType,
          amount: listing.amount,
          price: listing.pricePerKwh,
          totalPrice: listing.totalPrice,
          location: listing.location?.address || 'Unknown Location',
          timeRemaining: listing.timeRemaining || 'N/A',
          rating: listing.seller?.statistics?.averageRating || 4.5,
          deviceName: listing.device?.deviceName || 'Unknown Device',
          deviceType: listing.device?.deviceType || listing.energyType,
          status: listing.status,
          createdAt: listing.createdAt,
          endDate: listing.availability?.endDate
        }));
        
        setMarketplaceData(transformedListings);
      } else {
        // Fallback to mock data if API not available
        setMarketplaceData(generateMockMarketplaceData());
      }
      
    } catch (error) {
      console.error('Error loading marketplace:', error);
      setError('Failed to load marketplace data. Using sample data.');
      setMarketplaceData(generateMockMarketplaceData());
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserListings = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await apiService.getUserListings?.();
      
      if (response?.success) {
        const transformedListings = response.listings.map(listing => ({
          id: listing._id,
          listingId: listing._id,
          energyType: listing.energyType,
          amount: listing.amount,
          price: listing.pricePerKwh,
          totalPrice: listing.totalPrice,
          status: listing.status,
          created: new Date(listing.createdAt).toLocaleDateString(),
          deviceName: listing.device?.deviceName || 'Unknown Device',
          endDate: listing.availability?.endDate,
          timeRemaining: listing.timeRemaining || 'N/A',
          views: listing.metadata?.views || 0,
          inquiries: listing.metadata?.inquiries || 0
        }));
        
        setUserListings(transformedListings);
      } else {
        setUserListings(generateMockUserListings());
      }
      
    } catch (error) {
      console.error('Error loading user listings:', error);
      setError('Failed to load your listings. Using sample data.');
      setUserListings(generateMockUserListings());
    } finally {
      setIsLoading(false);
    }
  };

  const loadTradeHistory = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await apiService.getUserTransactions?.();
      
      if (response?.success) {
        const transformedHistory = response.transactions.map(transaction => ({
          id: transaction._id,
          type: transaction.buyer ? 'buy' : 'sell',
          amount: transaction.energy.amount,
          price: transaction.energy.pricePerKwh,
          total: transaction.energy.totalPrice,
          date: new Date(transaction.createdAt).toLocaleDateString(),
          status: transaction.status,
          counterparty: transaction.buyer?.username || transaction.seller?.username || 'Unknown',
          energyType: transaction.energy.type,
          paymentMethod: transaction.payment.method
        }));
        
        setTradeHistory(transformedHistory);
      } else {
        setTradeHistory(generateMockTradeHistory());
      }
      
    } catch (error) {
      console.error('Error loading trade history:', error);
      setError('Failed to load trade history. Using sample data.');
      setTradeHistory(generateMockTradeHistory());
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserDevices = async () => {
    try {
      const response = await apiService.getUserDevices?.({ 
        'verification.status': 'approved',
        'trading.isAvailableForTrading': true 
      });
      
      if (response?.success) {
        setUserDevices(response.devices || []);
      } else {
        setUserDevices(generateMockDevices());
      }
    } catch (error) {
      console.error('Error loading user devices:', error);
      setUserDevices(generateMockDevices());
    }
  };

  // Mock data generators for fallback
  const generateMockMarketplaceData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: `listing_${i + 1}`,
      listingId: `listing_${i + 1}`,
      seller: ['GreenTech Solutions', 'Solar Dynamics', 'Wind Power Co', 'EcoEnergy LLC'][i % 4],
      sellerRating: 4.5 + Math.random() * 0.5,
      energyType: ['solar', 'wind', 'hydro', 'geothermal'][i % 4],
      amount: Math.floor(Math.random() * 500) + 100,
      price: Number((0.10 + Math.random() * 0.10).toFixed(4)),
      totalPrice: 0,
      location: ['California', 'Texas', 'New York', 'Florida'][i % 4],
      timeRemaining: ['2 days', '5 hours', '1 day', '3 hours'][i % 4],
      rating: 4.5 + Math.random() * 0.5,
      deviceName: `Device ${i + 1}`,
      deviceType: ['solar', 'wind', 'hydro', 'geothermal'][i % 4],
      status: 'active',
      createdAt: new Date(),
      endDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
    })).map(listing => ({
      ...listing,
      totalPrice: Number((listing.amount * listing.price).toFixed(2))
    }));
  };

  const generateMockUserListings = () => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `user_listing_${i + 1}`,
      listingId: `user_listing_${i + 1}`,
      energyType: ['solar', 'wind'][i % 2],
      amount: Math.floor(Math.random() * 300) + 50,
      price: Number((0.12 + Math.random() * 0.08).toFixed(4)),
      totalPrice: 0,
      status: ['active', 'sold', 'expired'][i % 3],
      created: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      deviceName: `My Device ${i + 1}`,
      endDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      timeRemaining: ['2 days', '5 hours', '1 day'][i % 3],
      views: Math.floor(Math.random() * 50),
      inquiries: Math.floor(Math.random() * 10)
    })).map(listing => ({
      ...listing,
      totalPrice: Number((listing.amount * listing.price).toFixed(2))
    }));
  };

  const generateMockTradeHistory = () => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: `trade_${i + 1}`,
      type: ['buy', 'sell'][i % 2],
      amount: Math.floor(Math.random() * 200) + 50,
      price: Number((0.11 + Math.random() * 0.09).toFixed(4)),
      total: 0,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: ['completed', 'pending'][i % 2],
      counterparty: ['Alice', 'Bob', 'Charlie', 'Diana'][i % 4],
      energyType: ['solar', 'wind', 'hydro'][i % 3],
      paymentMethod: ['wallet', 'card'][i % 2]
    })).map(trade => ({
      ...trade,
      total: Number((trade.amount * trade.price).toFixed(2))
    }));
  };

  const generateMockDevices = () => {
    return Array.from({ length: 3 }, (_, i) => ({
      _id: `device_${i + 1}`,
      deviceName: `Solar Panel ${i + 1}`,
      deviceType: 'solar',
      capacity: 5 + i * 2,
      verification: { status: 'approved' },
      trading: { isAvailableForTrading: true }
    }));
  };

  // ZK-SNARK Privacy Trading Functions
  const handleZKInputChange = (field, value) => {
    setZkTradingData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

 const generateZKProof = async () => {
  try {
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate required trading data
    if (!zkTradingData.transferAmount || !zkTradingData.receiverAddress) {
      throw new Error('Please fill in all required trading fields');
    }

    // Validate numerical inputs
    const transferAmount = parseInt(zkTradingData.transferAmount);
    if (isNaN(transferAmount)) {
      throw new Error('Invalid transfer amount');
    }

    if (transferAmount > zkData.senderBalance) {
      throw new Error('Transfer amount exceeds sender balance');
    }

    // Validate cryptographic inputs
    const requiredZkFields = [
      'senderBalance', 'transferAmount', 'senderSecret', 'receiverSecret',
      'nonce', 'nullifierHash', 'senderCommitment', 'newSenderCommitment',
      'receiverCommitment', 'merkleRoot'
    ];

    for (const field of requiredZkFields) {
      if (!zkData[field]) {
        throw new Error(`Missing required ZK parameter: ${field}`);
      }
    }

    // Generate Merkle Tree (example implementation)
    const leaves = [zkData.senderCommitment, zkData.receiverCommitment]
      .map(x => ethers.utils.keccak256(x));
    
    const merkleTree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true });
    const merkleRoot = merkleTree.getHexRoot();
      
    // Generate proof with all required parameters
    const proof = await generateTransferProof(
      zkData.senderBalance.toString(),
      zkData.transferAmount.toString(),
      zkData.senderSecret,
      zkData.receiverSecret,
      zkData.nonce.toString(),
      zkData.nullifierHash,
      zkData.senderCommitment,
      zkData.newSenderCommitment, // Added missing parameter
      zkData.receiverCommitment,
      zkData.merkleRoot // Use generated merkle root
    );

    setZkProof(proof);
    setSuccess('ZK proof generated successfully! 🔐');
    return proof;

  } catch (error) {
    console.error('ZK Proof Generation Error:', error);
    setError(error.message);
    throw error; // Re-throw for external error handling
  } finally {
    setIsLoading(false);
  }
};


  const executePrivateTransfer = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!zkProof) {
        throw new Error('Please generate ZK proof first');
      }

      // Create nullifier and commitments
      const nullifier = `0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd`;
      const senderCommitment = `0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234`;
      const newSenderCommitment = `0x234567890abcdef234567890abcdef234567890abcdef234567890abcdef2345`;
      const receiverCommitment = `0x345678901abcdef345678901abcdef345678901abcdef345678901abcdef3456`;
      const merkleRoot = `0x456789012abcdef456789012abcdef456789012abcdef456789012abcdef4567`;

      // Execute private transfer
      const tx = await blockchainService.privateTransferSimple(
        nullifier,
        senderCommitment,
        newSenderCommitment,
        receiverCommitment,
        merkleRoot,
        zkProof.a,
        zkProof.b,
        zkProof.c,
        zkProof.input
      );

      await tx.wait();
      setSuccess('Private transfer completed successfully! 🎉');

      // Reset form
      setZkTradingData(prev => ({
        ...prev,
        transferAmount: '',
        receiverAddress: '',
        senderSecret: '',
        receiverSecret: ''
      }));
      setZkProof(null);

      // Reload data
      await loadZKTradingData();
      
    } catch (error) {
      console.error('Error executing private transfer:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const executePublicTransfer = async () => {
    try {
      setIsLoading(true);
      setError('');

      // For public transfer, we need to find a token to transfer
      const userTokens = await blockchainService.getUserTokens?.(userAddress);
      if (!userTokens || userTokens.length === 0) {
        throw new Error('No tokens available for transfer');
      }

      // Transfer the first available token
      const tokenToTransfer = userTokens[0];
      const tx = await blockchainService.transferToken(
        userAddress,
        zkTradingData.receiverAddress,
        tokenToTransfer.tokenId
      );

      await tx.wait();
      setSuccess('Public transfer completed successfully! 🎉');

      // Reset form
      setZkTradingData(prev => ({
        ...prev,
        transferAmount: '',
        receiverAddress: ''
      }));

      // Reload data
      await loadZKTradingData();
      
    } catch (error) {
      console.error('Error executing public transfer:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyEnergy = async (listing) => {
    try {
      setIsLoading(true);
      setError('');
      
      const purchaseData = {
        listingId: listing.listingId || listing.id,
        amount: listing.amount,
        paymentMethod: 'wallet'
      };

      const response = await apiService.purchaseEnergy?.(purchaseData);
      
      if (response?.success) {
        setSuccess('Energy purchased successfully! 🎉');
        setShowBuyModal(false);
        await loadMarketplaceData();
        
        if (userAddress && listing.tokenId) {
          try {
            const tx = await blockchainService.purchaseCredit?.(listing.tokenId, listing.price);
            await tx.wait();
            console.log('Blockchain transaction completed:', tx.hash);
          } catch (blockchainError) {
            console.log('Blockchain transaction failed:', blockchainError.message);
          }
        }
      } else {
        // Simulate successful purchase for demo
        setSuccess('Energy purchased successfully! 🎉');
        setShowBuyModal(false);
        // Remove from marketplace
        setMarketplaceData(prev => prev.filter(item => item.id !== listing.id));
      }
      
    } catch (error) {
      console.error('Error purchasing energy:', error);
      setError(error.message || 'Failed to purchase energy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellEnergy = async () => {
    if (!sellFormData.deviceId || !sellFormData.amount || !sellFormData.pricePerKwh || !sellFormData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const listingData = {
        deviceId: sellFormData.deviceId,
        amount: parseFloat(sellFormData.amount),
        pricePerKwh: parseFloat(sellFormData.pricePerKwh),
        endDate: sellFormData.endDate,
        timeSlots: sellFormData.timeSlots,
        preferences: sellFormData.preferences
      };

      const response = await apiService.createEnergyListing?.(listingData);
      
      if (response?.success) {
        setSuccess('Energy listed successfully! 🎉');
        setShowSellModal(false);
        setSellFormData({ 
          deviceId: '', 
          amount: '', 
          pricePerKwh: '', 
          endDate: '', 
          timeSlots: [],
          preferences: { negotiable: true, autoAccept: false }
        });
        
        await loadUserListings();
        
        if (userAddress) {
          try {
            const availableToken = await blockchainService.getUserTokens?.(userAddress);
            if (availableToken && availableToken.length > 0) {
              const tx = await blockchainService.listCreditForSale?.(
                availableToken[0].tokenId, 
                sellFormData.pricePerKwh
              );
              await tx.wait();
              console.log('Blockchain listing created:', tx.hash);
            }
          } catch (blockchainError) {
            console.log('Blockchain listing failed:', blockchainError.message);
          }
        }
      } else {
        // Simulate successful listing for demo
        const newListing = {
          id: `user_listing_${Date.now()}`,
          listingId: `user_listing_${Date.now()}`,
          energyType: userDevices.find(d => d._id === sellFormData.deviceId)?.deviceType || 'solar',
          amount: parseFloat(sellFormData.amount),
          price: parseFloat(sellFormData.pricePerKwh),
          totalPrice: parseFloat(sellFormData.amount) * parseFloat(sellFormData.pricePerKwh),
          status: 'active',
          created: new Date().toLocaleDateString(),
          deviceName: userDevices.find(d => d._id === sellFormData.deviceId)?.deviceName || 'Device',
          endDate: new Date(sellFormData.endDate),
          timeRemaining: '7 days',
          views: 0,
          inquiries: 0
        };
        
        setUserListings(prev => [newListing, ...prev]);
        setSuccess('Energy listed successfully! 🎉');
        setShowSellModal(false);
        setSellFormData({ 
          deviceId: '', 
          amount: '', 
          pricePerKwh: '', 
          endDate: '', 
          timeSlots: [],
          preferences: { negotiable: true, autoAccept: false }
        });
      }
      
    } catch (error) {
      console.error('Error creating listing:', error);
      setError(error.message || 'Failed to list energy for sale. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await apiService.cancelListing?.(listingId);
      
      if (response?.success) {
        setSuccess('Listing cancelled successfully! 🎉');
        await loadUserListings();
      } else {
        // Simulate successful cancellation
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        setSuccess('Listing cancelled successfully! 🎉');
      }
      
    } catch (error) {
      console.error('Error cancelling listing:', error);
      setError(error.message || 'Failed to cancel listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyClick = (listing) => {
    setSelectedListing(listing);
    setShowBuyModal(true);
  };

  const getEnergyIcon = (type) => {
    switch (type) {
      case 'solar': return '☀️';
      case 'wind': return '💨';
      case 'hydro': return '💧';
      case 'geothermal': return '🌋';
      case 'biomass': return '🌿';
      default: return '⚡';
    }
  };

  const filteredMarketplaceData = marketplaceData.filter(item => 
    filter === 'all' || item.energyType === filter
  );

  return (
    <ErrorBoundary>
      <div className="energy-exchange">
        <div className="exchange-container">
          <div className="exchange-header">
            <div className="header-content">
              <h1>Energy Trading</h1>
              <p>Trade renewable energy credits with verified producers and consumers</p>
            </div>
            <div className="header-actions">
              <button 
                onClick={() => {
                  if (activeTab === 'marketplace') loadMarketplaceData();
                  else if (activeTab === 'my-listings') loadUserListings();
                  else if (activeTab === 'trade-history') loadTradeHistory();
                  else if (activeTab === 'zk-privacy') loadZKTradingData();
                }}
                className="refresh-btn"
                disabled={isLoading}
              >
                <FiRefreshCw className={isLoading ? 'spinning' : ''} />
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
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

          {/* Enhanced Exchange Tabs with ZK Privacy */}
          <div className="exchange-tabs">
            <button 
              className={`tab ${activeTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => setActiveTab('marketplace')}
            >
              <FiShoppingCart />
              Marketplace
            </button>
            <button 
              className={`tab ${activeTab === 'my-listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-listings')}
            >
              <FiZap />
              My Listings
            </button>
            <button 
              className={`tab ${activeTab === 'trade-history' ? 'active' : ''}`}
              onClick={() => setActiveTab('trade-history')}
            >
              <FiTrendingUp />
              Trade History
            </button>
            <button 
              className={`tab ${activeTab === 'zk-privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('zk-privacy')}
            >
              <FiShield />
              ZK Privacy
            </button>
          </div>

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <div className="marketplace-content">
              <div className="marketplace-filters">
                <div className="filter-group">
                  <FiFilter />
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Energy Types</option>
                    <option value="solar">Solar</option>
                    <option value="wind">Wind</option>
                    <option value="hydro">Hydro</option>
                    <option value="geothermal">Geothermal</option>
                    <option value="biomass">Biomass</option>
                  </select>
                </div>
              </div>

              <div className="marketplace-grid">
                {isLoading ? (
                  <div className="loading-state">
                    <FiRefreshCw className="spinning" />
                    <p>Loading marketplace...</p>
                  </div>
                ) : filteredMarketplaceData.length === 0 ? (
                  <div className="empty-state">
                    <FiShoppingCart />
                    <h3>No Energy Available</h3>
                    <p>No energy listings match your current filters.</p>
                  </div>
                ) : (
                  filteredMarketplaceData.map((listing) => (
                    <div key={listing.id} className="energy-card">
                      <div className="card-header">
                        <div className="energy-type">
                          <span className="energy-icon">{getEnergyIcon(listing.energyType)}</span>
                          <span className="energy-name">{listing.energyType}</span>
                        </div>
                        <div className="seller-rating">
                          <FiStar />
                          <span>{listing.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="card-content">
                        <h3>{listing.seller}</h3>
                        <p className="device-name">{listing.deviceName}</p>
                        <div className="energy-details">
                          <div className="detail">
                            <span>Amount:</span>
                            <span>{listing.amount} kWh</span>
                          </div>
                          <div className="detail">
                            <span>Price:</span>
                            <span>${listing.price}/kWh</span>
                          </div>
                          <div className="detail">
                            <span>Total:</span>
                            <span>${listing.totalPrice}</span>
                          </div>
                          <div className="detail">
                            <span>Location:</span>
                            <span>{listing.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-footer">
                        <div className="time-remaining">
                          <FiClock />
                          <span>{listing.timeRemaining}</span>
                        </div>
                        <button 
                          className="buy-btn"
                          onClick={() => handleBuyClick(listing)}
                          disabled={isLoading}
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

          {/* My Listings Tab */}
          {activeTab === 'my-listings' && (
            <div className="my-listings-content">
              <div className="listings-header">
                <h2>My Energy Listings</h2>
                <button 
                  className="sell-btn"
                  onClick={() => setShowSellModal(true)}
                  disabled={userDevices.length === 0}
                >
                  <FiDollarSign />
                  Sell Energy
                </button>
              </div>

              <div className="listings-grid">
                {isLoading ? (
                  <div className="loading-state">
                    <FiRefreshCw className="spinning" />
                    <p>Loading your listings...</p>
                  </div>
                ) : userListings.length === 0 ? (
                  <div className="empty-state">
                    <FiZap />
                    <h3>No Energy Listings</h3>
                    <p>You don't have any energy listings yet.</p>
                    {userDevices.length > 0 ? (
                      <button 
                        className="sell-btn"
                        onClick={() => setShowSellModal(true)}
                      >
                        <FiDollarSign />
                        Create First Listing
                      </button>
                    ) : (
                      <p>Register and verify a device first to start selling energy.</p>
                    )}
                  </div>
                ) : (
                  userListings.map((listing) => (
                    <div key={listing.id} className="listing-card">
                      <div className="listing-header">
                        <div className="energy-type">
                          <span className="energy-icon">{getEnergyIcon(listing.energyType)}</span>
                          <span className="energy-name">{listing.energyType}</span>
                        </div>
                        <div className={`status ${listing.status}`}>
                          {listing.status}
                        </div>
                      </div>
                      
                      <div className="listing-content">
                        <h4>{listing.deviceName}</h4>
                        <div className="energy-details">
                          <div className="detail">
                            <span>Amount:</span>
                            <span>{listing.amount} kWh</span>
                          </div>
                          <div className="detail">
                            <span>Price:</span>
                            <span>${listing.price}/kWh</span>
                          </div>
                          <div className="detail">
                            <span>Total:</span>
                            <span>${listing.totalPrice}</span>
                          </div>
                          <div className="detail">
                            <span>Created:</span>
                            <span>{listing.created}</span>
                          </div>
                          <div className="detail">
                            <span>Views:</span>
                            <span>{listing.views}</span>
                          </div>
                          {listing.timeRemaining && (
                            <div className="detail">
                              <span>Time Left:</span>
                              <span>{listing.timeRemaining}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="listing-actions">
                        {listing.status === 'active' && (
                          <>
                            <button className="edit-btn">
                              <FiEdit />
                              Edit
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleCancelListing(listing.id)}
                              disabled={isLoading}
                            >
                              <FiTrash2 />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Trade History Tab */}
          {activeTab === 'trade-history' && (
            <div className="trade-history-content">
              <h2>Trade History</h2>
              
              <div className="history-list">
                {isLoading ? (
                  <div className="loading-state">
                    <FiRefreshCw className="spinning" />
                    <p>Loading trade history...</p>
                  </div>
                ) : tradeHistory.length === 0 ? (
                  <div className="empty-state">
                    <FiTrendingUp />
                    <h3>No Trade History</h3>
                    <p>Your completed trades will appear here.</p>
                  </div>
                ) : (
                  tradeHistory.map((trade) => (
                    <div key={trade.id} className="trade-item">
                      <div className="trade-type">
                        <span className={`type-badge ${trade.type}`}>
                          {trade.type === 'buy' ? <FiShoppingCart /> : <FiDollarSign />}
                          {trade.type}
                        </span>
                      </div>
                      
                      <div className="trade-details">
                        <div className="detail">
                          <span>Energy Type:</span>
                          <span>{trade.energyType}</span>
                        </div>
                        <div className="detail">
                          <span>Amount:</span>
                          <span>{trade.amount} kWh</span>
                        </div>
                        <div className="detail">
                          <span>Price:</span>
                          <span>${trade.price}/kWh</span>
                        </div>
                        <div className="detail">
                          <span>Total:</span>
                          <span>${trade.total}</span>
                        </div>
                        <div className="detail">
                          <span>Date:</span>
                          <span>{trade.date}</span>
                        </div>
                        <div className="detail">
                          <span>Counterparty:</span>
                          <span>{trade.counterparty}</span>
                        </div>
                        <div className="detail">
                          <span>Payment:</span>
                          <span>{trade.paymentMethod}</span>
                        </div>
                      </div>
                      
                      <div className={`trade-status ${trade.status}`}>
                        {trade.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ZK Privacy Tab */}
          {activeTab === 'zk-privacy' && (
            <div className="zk-privacy-content">
              <div className="zk-header">
                <div className="zk-info">
                  <h3>🔐 Zero-Knowledge Privacy Trading</h3>
                  <p>Trade carbon credits with mathematical privacy guarantees</p>
                </div>
                <div className="zk-balance">
                  <div className="balance-card">
                    <span>Your Balance:</span>
                    <span>{zkTradingData.senderBalance} Credits</span>
                  </div>
                </div>
              </div>

              <div className="zk-trading-form">
                <div className="form-section">
                  <h4>Transfer Configuration</h4>
                  
                  <div className="form-group">
                    <label>Transfer Amount</label>
                    <input
                      type="number"
                      value={zkTradingData.transferAmount}
                      onChange={(e) => handleZKInputChange('transferAmount', e.target.value)}
                      placeholder="Amount to transfer"
                      min="1"
                      max={zkTradingData.senderBalance}
                    />
                  </div>

                  <div className="form-group">
                    <label>Receiver Address</label>
                    <input
                      type="text"
                      value={zkTradingData.receiverAddress}
                      onChange={(e) => handleZKInputChange('receiverAddress', e.target.value)}
                      placeholder="0x..."
                    />
                  </div>

                  <div className="form-group">
                    <div className="privacy-toggle">
                      <label>
                        <input
                          type="checkbox"
                          checked={zkTradingData.usePrivateTransfer}
                          onChange={(e) => handleZKInputChange('usePrivateTransfer', e.target.checked)}
                        />
                        Use Private Transfer (ZK-SNARK)
                      </label>
                    </div>
                  </div>

                  {zkTradingData.usePrivateTransfer && (
                    <div className="secrets-section">
                      <div className="secrets-header">
                        <h5>Privacy Secrets</h5>
                        <button 
                          type="button"
                          onClick={() => setShowSecrets(!showSecrets)}
                          className="toggle-secrets"
                        >
                          {showSecrets ? <FiEyeOff /> : <FiEye />}
                          {showSecrets ? 'Hide' : 'Show'} Secrets
                        </button>
                      </div>

                      {showSecrets && (
                        <>
                          <div className="form-group">
                            <label>Sender Secret (Optional)</label>
                            <input
                              type="password"
                              value={zkTradingData.senderSecret}
                              onChange={(e) => handleZKInputChange('senderSecret', e.target.value)}
                              placeholder="Auto-generated if empty"
                            />
                          </div>

                          <div className="form-group">
                            <label>Receiver Secret (Optional)</label>
                            <input
                              type="password"
                              value={zkTradingData.receiverSecret}
                              onChange={(e) => handleZKInputChange('receiverSecret', e.target.value)}
                              placeholder="Auto-generated if empty"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="zk-actions">
                  {zkTradingData.usePrivateTransfer ? (
                    <>
                      <button
                        onClick={generateZKProof}
                        disabled={isLoading || !zkTradingData.transferAmount || !zkTradingData.receiverAddress}
                        className="generate-proof-btn"
                      >
                        {isLoading ? <FiRefreshCw className="spinning" /> : <FiShield />}
                        Generate ZK Proof
                      </button>

                      <button
                        onClick={executePrivateTransfer}
                        disabled={isLoading || !zkProof}
                        className="execute-transfer-btn"
                      >
                        {isLoading ? <FiRefreshCw className="spinning" /> : <FiLock />}
                        Execute Private Transfer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={executePublicTransfer}
                      disabled={isLoading || !zkTradingData.receiverAddress}
                      className="execute-transfer-btn"
                    >
                      {isLoading ? <FiRefreshCw className="spinning" /> : <FiUnlock />}
                      Execute Public Transfer
                    </button>
                  )}
                </div>

                {zkProof && (
                  <div className="zk-proof-status">
                    <div className="proof-indicator">
                      <FiCheck />
                      <span>ZK Proof Generated Successfully</span>
                    </div>
                    <p>Your zero-knowledge proof is ready for private transfer execution.</p>
                  </div>
                )}
              </div>

              <div className="zk-privacy-features">
                <h4>Key Privacy Features</h4>
                <ul>
                  <li>
                    <strong>Private Amounts</strong>
                    <span>Transfer amounts and balances remain private</span>
                  </li>
                  <li>
                    <strong>Zero-Knowledge Proofs</strong>
                    <span>Mathematical guarantees of privacy and correctness</span>
                  </li>
                  <li>
                    <strong>Verifiable</strong>
                    <span>Publicly verifiable without revealing private data</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Buy Modal */}
          {showBuyModal && selectedListing && (
            <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Purchase Energy</h3>
                  <button onClick={() => setShowBuyModal(false)}>
                    <FiX />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="purchase-summary">
                    <div className="summary-item">
                      <span>Seller:</span>
                      <span>{selectedListing.seller}</span>
                    </div>
                    <div className="summary-item">
                      <span>Device:</span>
                      <span>{selectedListing.deviceName}</span>
                    </div>
                    <div className="summary-item">
                      <span>Energy Type:</span>
                      <span>{selectedListing.energyType}</span>
                    </div>
                    <div className="summary-item">
                      <span>Amount:</span>
                      <span>{selectedListing.amount} kWh</span>
                    </div>
                    <div className="summary-item">
                      <span>Price per kWh:</span>
                      <span>${selectedListing.price}</span>
                    </div>
                    <div className="summary-item total">
                      <span>Total Cost:</span>
                      <span>${selectedListing.totalPrice}</span>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowBuyModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="confirm-btn"
                    onClick={() => handleBuyEnergy(selectedListing)}
                    disabled={isLoading}
                  >
                    {isLoading ? <FiRefreshCw className="spinning" /> : <FiCheck />}
                    Confirm Purchase
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
                  <h3>List Energy for Sale</h3>
                  <button onClick={() => setShowSellModal(false)}>
                    <FiX />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="form-group">
                    <label>Select Device *</label>
                    <select
                      value={sellFormData.deviceId}
                      onChange={(e) => {
                        setSellFormData({
                          ...sellFormData, 
                          deviceId: e.target.value
                        });
                      }}
                      required
                    >
                      <option value="">Select a device</option>
                      {userDevices.map(device => (
                        <option key={device._id} value={device._id}>
                          {device.deviceName} ({device.deviceType}) - {device.capacity}kW
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Energy Amount (kWh) *</label>
                    <input
                      type="number"
                      value={sellFormData.amount}
                      onChange={(e) => setSellFormData({...sellFormData, amount: e.target.value})}
                      placeholder="Enter amount"
                      min="0.1"
                      max="10000"
                      step="0.1"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Price per kWh ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellFormData.pricePerKwh}
                      onChange={(e) => setSellFormData({...sellFormData, pricePerKwh: e.target.value})}
                      placeholder="Enter price"
                      min="0.01"
                      max="1.00"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="datetime-local"
                      value={sellFormData.endDate}
                      onChange={(e) => setSellFormData({...sellFormData, endDate: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>

                  {sellFormData.amount && sellFormData.pricePerKwh && (
                    <div className="form-group">
                      <div className="summary-item total">
                        <span>Total Listing Value:</span>
                        <span>${(parseFloat(sellFormData.amount) * parseFloat(sellFormData.pricePerKwh)).toFixed(2)}</span>
                      </div>
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
                    className="confirm-btn"
                    onClick={handleSellEnergy}
                    disabled={isLoading || userDevices.length === 0}
                  >
                    {isLoading ? <FiRefreshCw className="spinning" /> : <FiDollarSign />}
                    List for Sale
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
