const EnergyListing = require('../models/EnergyListing');
const Transaction = require('../models/Transaction');
const Device = require('../models/Device');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get client IP address
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Create energy listing
exports.createListing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const {
      deviceId,
      amount,
      pricePerKwh,
      endDate,
      timeSlots,
      preferences
    } = req.body;

    // Verify device ownership and status
    const device = await Device.findOne({
      _id: deviceId,
      owner: userId,
      'verification.status': 'approved',
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found or not approved for trading'
      });
    }

    // Check if device already has an active listing
    const existingListing = await EnergyListing.findOne({
      device: deviceId,
      status: 'active'
    });

    if (existingListing) {
      return res.status(400).json({
        success: false,
        message: 'Device already has an active energy listing'
      });
    }

    // Check if device has enough energy to sell
    if (amount > device.energyProduction.totalProduced) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient energy production to create this listing'
      });
    }

    // Create listing
    const listing = new EnergyListing({
      seller: userId,
      device: deviceId,
      energyType: device.deviceType,
      amount: parseFloat(amount),
      pricePerKwh: parseFloat(pricePerKwh),
      location: {
        address: device.location.address,
        coordinates: device.location.coordinates
      },
      availability: {
        endDate: new Date(endDate),
        timeSlots: timeSlots || []
      },
      preferences: preferences || {},
      metadata: {
        createdIP: getClientIP(req),
        userAgent: req.get('User-Agent')
      }
    });

    await listing.save();

    // Update device with active listing
    device.trading.activeListing = listing._id;
    await device.save();

    // Populate response data
    await listing.populate([
      { path: 'seller', select: 'username fullName statistics.averageRating' },
      { path: 'device', select: 'deviceName deviceType capacity' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Energy listing created successfully',
      listing
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating listing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get marketplace listings
exports.getMarketplaceListings = async (req, res) => {
  try {
    const {
      energyType,
      minPrice,
      maxPrice,
      minAmount,
      maxAmount,
      location,
      radius = 50, // km
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      status: 'active',
      'availability.endDate': { $gt: new Date() }
    };

    // Apply filters
    if (energyType) {
      filters.energyType = energyType;
    }

    if (minPrice || maxPrice) {
      filters.pricePerKwh = {};
      if (minPrice) filters.pricePerKwh.$gte = parseFloat(minPrice);
      if (maxPrice) filters.pricePerKwh.$lte = parseFloat(maxPrice);
    }

    if (minAmount || maxAmount) {
      filters.amount = {};
      if (minAmount) filters.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filters.amount.$lte = parseFloat(maxAmount);
    }

    // Location-based filtering
    if (location) {
      const [lat, lng] = location.split(',').map(parseFloat);
      if (lat && lng) {
        filters['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [listings, total] = await Promise.all([
      EnergyListing.find(filters)
        .populate('seller', 'username fullName statistics.averageRating statistics.totalRatings')
        .populate('device', 'deviceName deviceType capacity location')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EnergyListing.countDocuments(filters)
    ]);

    // Add calculated fields
    const enhancedListings = listings.map(listing => ({
      ...listing,
      timeRemaining: calculateTimeRemaining(listing.availability.endDate),
      distance: location ? calculateDistance(location, listing.location.coordinates) : null
    }));

    res.json({
      success: true,
      listings: enhancedListings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      filters: {
        energyType,
        priceRange: { min: minPrice, max: maxPrice },
        amountRange: { min: minAmount, max: maxAmount },
        location,
        radius
      }
    });

  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching marketplace listings'
    });
  }
};

// Get user's listings
exports.getUserListings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const filters = { seller: userId };
    if (status) {
      filters.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, total] = await Promise.all([
      EnergyListing.find(filters)
        .populate('device', 'deviceName deviceType capacity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EnergyListing.countDocuments(filters)
    ]);

    // Add calculated fields
    const enhancedListings = listings.map(listing => ({
      ...listing,
      timeRemaining: calculateTimeRemaining(listing.availability.endDate)
    }));

    res.json({
      success: true,
      listings: enhancedListings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user listings'
    });
  }
};

// Purchase energy
exports.purchaseEnergy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const buyerId = req.user.userId;
    const { listingId, amount, paymentMethod = 'wallet' } = req.body;

    // Find and validate listing
    const listing = await EnergyListing.findOne({
      _id: listingId,
      status: 'active',
      'availability.endDate': { $gt: new Date() }
    }).populate('seller device');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Energy listing not found or no longer available'
      });
    }

    // Check if buyer is not the seller
    if (listing.seller._id.toString() === buyerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot purchase your own energy listing'
      });
    }

    // Validate amount
    const purchaseAmount = parseFloat(amount);
    if (purchaseAmount > listing.amount) {
      return res.status(400).json({
        success: false,
        message: 'Requested amount exceeds available energy'
      });
    }

    // Calculate costs
    const energyCost = purchaseAmount * listing.pricePerKwh;
    const platformFee = energyCost * 0.025; // 2.5% platform fee
    const totalCost = energyCost + platformFee;

    // Check buyer's wallet balance if using wallet payment
    if (paymentMethod === 'wallet') {
      const buyer = await User.findById(buyerId);
      if (buyer.wallet.balance < totalCost) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          required: totalCost,
          available: buyer.wallet.balance
        });
      }
    }

    // Create transaction
    const transaction = new Transaction({
      buyer: buyerId,
      seller: listing.seller._id,
      listing: listingId,
      device: listing.device._id,
      energy: {
        type: listing.energyType,
        amount: purchaseAmount,
        pricePerKwh: listing.pricePerKwh,
        totalPrice: energyCost
      },
      payment: {
        method: paymentMethod,
        fees: {
          platform: platformFee,
          total: platformFee
        }
      },
      metadata: {
        createdIP: getClientIP(req),
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });

    await transaction.save();

    // Process wallet payment immediately
    if (paymentMethod === 'wallet') {
      await processWalletPayment(transaction, buyerId, listing.seller._id);
    }

    // Update listing amount
    if (purchaseAmount === listing.amount) {
      listing.status = 'sold';
      // Remove active listing from device
      await Device.findByIdAndUpdate(listing.device._id, {
        $unset: { 'trading.activeListing': 1 }
      });
    } else {
      listing.amount -= purchaseAmount;
    }
    await listing.save();

    // Update user statistics
    await Promise.all([
      User.findByIdAndUpdate(buyerId, {
        $inc: { 
          'statistics.totalTrades': 1,
          'wallet.totalSpent': totalCost
        }
      }),
      User.findByIdAndUpdate(listing.seller._id, {
        $inc: { 
          'statistics.totalTrades': 1,
          'wallet.totalEarnings': energyCost
        }
      })
    ]);

    // Populate transaction for response
    await transaction.populate([
      { path: 'buyer', select: 'username fullName' },
      { path: 'seller', select: 'username fullName' },
      { path: 'device', select: 'deviceName deviceType' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Energy purchase initiated successfully',
      transaction,
      paymentStatus: paymentMethod === 'wallet' ? 'completed' : 'pending'
    });

  } catch (error) {
    console.error('Purchase energy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing energy purchase',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      role = 'both', // 'buyer', 'seller', 'both'
      status,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {};
    if (status) {
      filters.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total, stats] = await Promise.all([
      Transaction.getUserTransactions(userId, role, filters)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments({
        ...filters,
        $or: role === 'both' 
          ? [{ buyer: userId }, { seller: userId }]
          : role === 'buyer' 
            ? [{ buyer: userId }]
            : [{ seller: userId }]
      }),
      Transaction.getTransactionStats(userId, role)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      statistics: stats
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching transactions'
    });
  }
};

// Update listing
exports.updateListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const listing = await EnergyListing.findOne({
      _id: listingId,
      seller: userId,
      status: 'active'
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or cannot be updated'
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ['pricePerKwh', 'amount', 'availability', 'preferences'];
    const updateData = {};

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    Object.assign(listing, updateData);
    await listing.save();

    res.json({
      success: true,
      message: 'Listing updated successfully',
      listing
    });

  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating listing'
    });
  }
};

// Cancel listing
exports.cancelListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.userId;

    const listing = await EnergyListing.findOne({
      _id: listingId,
      seller: userId,
      status: 'active'
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or already cancelled'
      });
    }

    listing.status = 'cancelled';
    await listing.save();

    // Remove active listing from device
    await Device.findByIdAndUpdate(listing.device, {
      $unset: { 'trading.activeListing': 1 }
    });

    res.json({
      success: true,
      message: 'Listing cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling listing'
    });
  }
};

// Get trading analytics
exports.getTradingAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
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
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get analytics data
    const [
      buyerStats,
      sellerStats,
      recentTransactions,
      activeListings,
      marketOverview
    ] = await Promise.all([
      Transaction.getTransactionStats(userId, 'buyer'),
      Transaction.getTransactionStats(userId, 'seller'),
      Transaction.getUserTransactions(userId, 'both', {
        createdAt: { $gte: startDate }
      }).limit(10),
      EnergyListing.find({
        seller: userId,
        status: 'active'
      }).populate('device', 'deviceName deviceType'),
      getMarketOverview()
    ]);

    const analytics = {
      period: {
        start: startDate,
        end: endDate,
        label: period
      },
      trading: {
        buyer: buyerStats,
        seller: sellerStats,
        combined: {
          totalTransactions: buyerStats.totalTransactions + sellerStats.totalTransactions,
          totalVolume: buyerStats.totalVolume + sellerStats.totalVolume,
          totalValue: buyerStats.totalValue + sellerStats.totalValue
        }
      },
      recentActivity: recentTransactions,
      activeListings: {
        count: activeListings.length,
        listings: activeListings
      },
      market: marketOverview
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get trading analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trading analytics'
    });
  }
};

// Helper functions
async function processWalletPayment(transaction, buyerId, sellerId) {
  try {
    const totalAmount = transaction.energy.totalPrice + transaction.payment.fees.total;
    const sellerAmount = transaction.energy.totalPrice;

    // Deduct from buyer's wallet
    await User.findByIdAndUpdate(buyerId, {
      $inc: { 
        'wallet.balance': -totalAmount,
        'wallet.totalSpent': totalAmount
      }
    });

    // Add to seller's wallet (minus platform fee)
    await User.findByIdAndUpdate(sellerId, {
      $inc: { 
        'wallet.balance': sellerAmount,
        'wallet.totalEarnings': sellerAmount
      }
    });

    // Update transaction status
    await transaction.completePayment();

    return true;
  } catch (error) {
    console.error('Wallet payment processing error:', error);
    throw error;
  }
}

function calculateTimeRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

function calculateDistance(location1, coordinates2) {
  if (!coordinates2 || coordinates2.length !== 2) return null;
  
  const [lat1, lng1] = location1.split(',').map(parseFloat);
  const [lng2, lat2] = coordinates2;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

async function getMarketOverview() {
  try {
    const [
      totalListings,
      totalVolume,
      averagePrice,
      activeTraders
    ] = await Promise.all([
      EnergyListing.countDocuments({ status: 'active' }),
      EnergyListing.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      EnergyListing.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, avg: { $avg: '$pricePerKwh' } } }
      ]),
      EnergyListing.distinct('seller', { status: 'active' })
    ]);

    return {
      totalListings,
      totalVolume: totalVolume[0]?.total || 0,
      averagePrice: averagePrice[0]?.avg || 0,
      activeTraders: activeTraders.length
    };
  } catch (error) {
    console.error('Market overview error:', error);
    return {
      totalListings: 0,
      totalVolume: 0,
      averagePrice: 0,
      activeTraders: 0
    };
  }
}

module.exports = exports;
