const CarbonCredit = require('../models/CarbonCredit');
const Device = require('../models/Device');
const User = require('../models/User');
const CarbonCreditBlockchain = require('../blockchain/carbonCreditContract');
const { validationResult } = require('express-validator');

const blockchain = new CarbonCreditBlockchain();

// Generate carbon credits from energy production
exports.generateCarbonCredits = async (req, res) => {
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
    const { deviceId, energyAmount, timestamp } = req.body;

    // Verify device ownership and approval
    const device = await Device.findOne({
      _id: deviceId,
      owner: userId,
      'verification.status': 'approved',
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found or not approved'
      });
    }

    // Get user's blockchain address
    const user = await User.findById(userId);
    if (!user.blockchainAddress) {
      return res.status(400).json({
        success: false,
        message: 'User blockchain address not configured'
      });
    }

    // Calculate carbon credits (example: 0.4 kg CO2 per kWh)
    const carbonAmount = Math.floor(energyAmount * 0.4);

    // Mint carbon credits on blockchain with ZK proof
    const blockchainResult = await blockchain.mintCarbonCredit(
      user.blockchainAddress,
      energyAmount,
      deviceId
    );

    // Create carbon credit record
    const carbonCredit = new CarbonCredit({
      owner: userId,
      device: deviceId,
      energyAmount: parseFloat(energyAmount),
      carbonAmount,
      blockchain: {
        transactionHash: blockchainResult.transactionHash,
        creditId: `CC-${Date.now()}-${deviceId.slice(-6)}`,
        contractAddress: process.env.CARBON_CREDIT_CONTRACT_ADDRESS
      },
      metadata: {
        projectType: device.deviceType,
        location: {
          country: device.location?.country || 'Unknown',
          region: device.location?.state || 'Unknown',
          coordinates: device.location?.coordinates
        },
        vintage: new Date().getFullYear()
      },
      verification: {
        status: 'verified', // Auto-verified with ZK proof
        verifiedAt: new Date(),
        verificationMethod: 'zk-proof',
        confidence: 95
      }
    });

    await carbonCredit.save();

    // Update device energy production
    await device.updateEnergyProduction(energyAmount, timestamp ? new Date(timestamp) : new Date());

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        'statistics.totalCarbonCredits': carbonAmount,
        'wallet.carbonCredits': carbonAmount
      }
    });

    res.status(201).json({
      success: true,
      message: 'Carbon credits generated successfully',
      carbonCredit: {
        id: carbonCredit._id,
        carbonAmount,
        energyAmount,
        transactionHash: blockchainResult.transactionHash,
        creditId: carbonCredit.blockchain.creditId,
        environmentalImpact: carbonCredit.environmentalImpact
      }
    });

  } catch (error) {
    console.error('Generate carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating carbon credits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's carbon credits
exports.getUserCarbonCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      status = 'all',
      projectType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { owner: userId };
    
    if (status !== 'all') {
      if (status === 'available') {
        query['trading.isAvailableForTrading'] = true;
        query['retirement.isRetired'] = false;
      } else if (status === 'retired') {
        query['retirement.isRetired'] = true;
      } else {
        query['verification.status'] = status;
      }
    }
    
    if (projectType) {
      query['metadata.projectType'] = projectType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [carbonCredits, total, stats] = await Promise.all([
      CarbonCredit.find(query)
        .populate('device', 'deviceName deviceType capacity')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CarbonCredit.countDocuments(query),
      CarbonCredit.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$carbonAmount' },
            totalValue: { $sum: { $multiply: ['$carbonAmount', '$trading.price'] } },
            availableCredits: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ['$trading.isAvailableForTrading', true] },
                    { $eq: ['$retirement.isRetired', false] }
                  ]},
                  '$carbonAmount',
                  0
                ]
              }
            },
            retiredCredits: {
              $sum: {
                $cond: [{ $eq: ['$retirement.isRetired', true] }, '$carbonAmount', 0]
              }
            }
          }
        }
      ])
    ]);

    const userStats = stats[0] || {
      totalCredits: 0,
      totalValue: 0,
      availableCredits: 0,
      retiredCredits: 0
    };

    res.json({
      success: true,
      carbonCredits,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      stats: userStats
    });

  } catch (error) {
    console.error('Get user carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching carbon credits'
    });
  }
};

// Transfer carbon credits with ZK privacy
exports.transferCarbonCredits = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const fromUserId = req.user.userId;
    const { toAddress, amount, creditIds } = req.body;

    // Verify user has enough credits
    const userCredits = await CarbonCredit.find({
      _id: { $in: creditIds },
      owner: fromUserId,
      'trading.isAvailableForTrading': true,
      'retirement.isRetired': false
    });

    const totalAvailable = userCredits.reduce((sum, credit) => sum + credit.carbonAmount, 0);
    if (totalAvailable < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient carbon credits for transfer'
      });
    }

    // Get user blockchain addresses
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findOne({ blockchainAddress: toAddress });

    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient address not found'
      });
    }

    // Execute blockchain transfer with ZK proof
    const transferResult = await blockchain.transferCarbonCredit(
      fromUser.blockchainAddress,
      toAddress,
      amount
    );

    // Update credit ownership
    let remainingAmount = amount;
    for (const credit of userCredits) {
      if (remainingAmount <= 0) break;
      
      const transferAmount = Math.min(credit.carbonAmount, remainingAmount);
      
      if (transferAmount === credit.carbonAmount) {
        // Transfer entire credit
        credit.owner = toUser._id;
        credit.audit.auditTrail.push({
          action: 'ownership_transferred',
          performedBy: fromUserId,
          details: { 
            fromAddress: fromUser.blockchainAddress,
            toAddress,
            amount: transferAmount,
            transactionHash: transferResult.transactionHash
          }
        });
      } else {
        // Split credit - create new credit for recipient
        const newCredit = new CarbonCredit({
          ...credit.toObject(),
          _id: undefined,
          owner: toUser._id,
          carbonAmount: transferAmount,
          blockchain: {
            ...credit.blockchain,
            transactionHash: transferResult.transactionHash,
            creditId: `CC-${Date.now()}-${credit._id.toString().slice(-6)}`
          }
        });
        
        await newCredit.save();
        
        // Update original credit
        credit.carbonAmount -= transferAmount;
      }
      
      await credit.save();
      remainingAmount -= transferAmount;
    }

    // Update user balances
    await Promise.all([
      User.findByIdAndUpdate(fromUserId, {
        $inc: { 'wallet.carbonCredits': -amount }
      }),
      User.findByIdAndUpdate(toUser._id, {
        $inc: { 'wallet.carbonCredits': amount }
      })
    ]);

    res.json({
      success: true,
      message: 'Carbon credits transferred successfully',
      transfer: {
        amount,
        transactionHash: transferResult.transactionHash,
        fromAddress: fromUser.blockchainAddress,
        toAddress,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Transfer carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error transferring carbon credits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Retire carbon credits
exports.retireCarbonCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { creditIds, reason, beneficiary } = req.body;

    const credits = await CarbonCredit.find({
      _id: { $in: creditIds },
      owner: userId,
      'retirement.isRetired': false
    });

    if (credits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No eligible credits found for retirement'
      });
    }

    let totalRetired = 0;
    for (const credit of credits) {
      await credit.retireCredit(userId, reason, beneficiary);
      totalRetired += credit.carbonAmount;
    }

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        'statistics.totalRetiredCredits': totalRetired,
        'wallet.carbonCredits': -totalRetired
      }
    });

    res.json({
      success: true,
      message: 'Carbon credits retired successfully',
      retirement: {
        totalRetired,
        reason,
        beneficiary,
        environmentalImpact: {
          co2Offset: totalRetired,
          treesEquivalent: Math.round(totalRetired / 21.77),
          carsOffRoad: Math.round(totalRetired / 4600)
        }
      }
    });

  } catch (error) {
    console.error('Retire carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retiring carbon credits'
    });
  }
};

// Get carbon credit marketplace
exports.getCarbonCreditMarketplace = async (req, res) => {
  try {
    const {
      projectType,
      country,
      region,
      minPrice,
      maxPrice,
      vintage,
      certificationStandard,
      page = 1,
      limit = 20,
      sortBy = 'trading.price',
      sortOrder = 'asc'
    } = req.query;

    const query = {
      'verification.status': 'verified',
      'trading.isAvailableForTrading': true,
      'retirement.isRetired': false
    };

    if (projectType) query['metadata.projectType'] = projectType;
    if (country) query['metadata.location.country'] = country;
    if (region) query['metadata.location.region'] = region;
    if (vintage) query['metadata.vintage'] = parseInt(vintage);
    if (certificationStandard) query['metadata.certificationStandard'] = certificationStandard;
    
    if (minPrice || maxPrice) {
      query['trading.price'] = {};
      if (minPrice) query['trading.price'].$gte = parseFloat(minPrice);
      if (maxPrice) query['trading.price'].$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [credits, total, marketStats] = await Promise.all([
      CarbonCredit.find(query)
        .populate('owner', 'username fullName statistics.averageRating')
        .populate('device', 'deviceName deviceType capacity location')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CarbonCredit.countDocuments(query),
      CarbonCredit.getMarketStats()
    ]);

    res.json({
      success: true,
      carbonCredits: credits,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      marketStats
    });

  } catch (error) {
    console.error('Get carbon credit marketplace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching marketplace'
    });
  }
};

// Verify carbon credit with blockchain
exports.verifyCarbonCredit = async (req, res) => {
  try {
    const { creditId } = req.params;

    const credit = await CarbonCredit.findById(creditId)
      .populate('owner device');

    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Carbon credit not found'
      });
    }

    // Verify on blockchain
    const blockchainVerification = await blockchain.verifyCarbonCredit(
      credit.blockchain.creditId
    );

    res.json({
      success: true,
      verification: {
        creditId: credit._id,
        blockchainCreditId: credit.blockchain.creditId,
        isValid: blockchainVerification.verified,
        carbonAmount: credit.carbonAmount,
        energyAmount: credit.energyAmount,
        projectType: credit.metadata.projectType,
        vintage: credit.metadata.vintage,
        verificationMethod: credit.verification.verificationMethod,
        confidence: credit.verification.confidence,
        transactionHash: credit.blockchain.transactionHash,
        environmentalImpact: credit.environmentalImpact,
        blockchain: blockchainVerification
      }
    });

  } catch (error) {
    console.error('Verify carbon credit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying carbon credit'
    });
  }
};

module.exports = {
  generateCarbonCredits: exports.generateCarbonCredits,
  getUserCarbonCredits: exports.getUserCarbonCredits,
  transferCarbonCredits: exports.transferCarbonCredits,
  retireCarbonCredits: exports.retireCarbonCredits,
  getCarbonCreditMarketplace: exports.getCarbonCreditMarketplace,
  verifyCarbonCredit: exports.verifyCarbonCredit
};
