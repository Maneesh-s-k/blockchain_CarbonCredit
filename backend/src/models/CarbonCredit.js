const mongoose = require('mongoose');

const carbonCreditSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  energyAmount: {
    type: Number,
    required: true,
    min: 0
  },
  carbonAmount: {
    type: Number,
    required: true,
    min: 0
  },
  carbonFactor: {
    type: Number,
    default: 0.4, // kg CO2 per kWh
    min: 0,
    max: 1
  },
  blockchain: {
    transactionHash: {
      type: String,
      required: true,
      unique: true
    },
    blockNumber: Number,
    creditId: {
      type: String,
      required: true,
      unique: true
    },
    contractAddress: String,
    gasUsed: Number
  },
  zkProof: {
    proof: {
      a: [String],
      b: [[String]],
      c: [String]
    },
    publicSignals: [String],
    verificationKey: String
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationMethod: {
      type: String,
      enum: ['zk-proof', 'manual', 'iot-sensor', 'third-party'],
      default: 'zk-proof'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 95
    }
  },
  metadata: {
    projectType: {
      type: String,
      enum: ['solar', 'wind', 'hydro', 'geothermal', 'biomass'],
      required: true
    },
    location: {
      country: String,
      region: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    certificationStandard: {
      type: String,
      enum: ['VCS', 'Gold Standard', 'CAR', 'ACR'],
      default: 'VCS'
    },
    vintage: {
      type: Number,
      required: true
    },
    additionalityProof: String,
    permanence: {
      type: String,
      enum: ['permanent', 'temporary', 'long-term'],
      default: 'permanent'
    }
  },
  trading: {
    isAvailableForTrading: {
      type: Boolean,
      default: true
    },
    price: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    minimumPurchase: {
      type: Number,
      default: 1
    },
    totalTraded: {
      type: Number,
      default: 0
    },
    averagePrice: {
      type: Number,
      default: 0
    }
  },
  retirement: {
    isRetired: {
      type: Boolean,
      default: false
    },
    retiredAt: Date,
    retiredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    retirementReason: String,
    beneficiary: String
  },
  audit: {
    auditTrail: [{
      action: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: mongoose.Schema.Types.Mixed
    }],
    lastAuditDate: Date,
    nextAuditDate: Date,
    auditStatus: {
      type: String,
      enum: ['compliant', 'non-compliant', 'pending'],
      default: 'pending'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
carbonCreditSchema.index({ owner: 1, 'verification.status': 1 });
carbonCreditSchema.index({ 'blockchain.creditId': 1 });
carbonCreditSchema.index({ 'metadata.projectType': 1, 'trading.isAvailableForTrading': 1 });
carbonCreditSchema.index({ 'metadata.vintage': 1 });
carbonCreditSchema.index({ createdAt: -1 });

// Virtual for carbon credit age
carbonCreditSchema.virtual('age').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for environmental impact
carbonCreditSchema.virtual('environmentalImpact').get(function() {
  return {
    co2Offset: this.carbonAmount,
    treesEquivalent: Math.round(this.carbonAmount / 21.77), // 1 tree absorbs ~21.77 kg CO2/year
    carsOffRoad: Math.round(this.carbonAmount / 4600), // Average car emits 4.6 tons CO2/year
    energyGenerated: this.energyAmount
  };
});

// Method to retire carbon credit
carbonCreditSchema.methods.retireCredit = async function(retiredBy, reason, beneficiary) {
  this.retirement.isRetired = true;
  this.retirement.retiredAt = new Date();
  this.retirement.retiredBy = retiredBy;
  this.retirement.retirementReason = reason;
  this.retirement.beneficiary = beneficiary;
  this.trading.isAvailableForTrading = false;
  
  // Add to audit trail
  this.audit.auditTrail.push({
    action: 'credit_retired',
    performedBy: retiredBy,
    details: { reason, beneficiary }
  });
  
  return await this.save();
};

// Method to verify with ZK proof
carbonCreditSchema.methods.verifyWithZKProof = async function(verifiedBy) {
  this.verification.status = 'verified';
  this.verification.verifiedAt = new Date();
  this.verification.verifiedBy = verifiedBy;
  this.verification.verificationMethod = 'zk-proof';
  
  // Add to audit trail
  this.audit.auditTrail.push({
    action: 'zk_verification_completed',
    performedBy: verifiedBy,
    details: { method: 'zk-proof', confidence: this.verification.confidence }
  });
  
  return await this.save();
};

// Static method to get carbon credits by region
carbonCreditSchema.statics.getCreditsByRegion = function(country, region) {
  return this.find({
    'metadata.location.country': country,
    'metadata.location.region': region,
    'verification.status': 'verified',
    'trading.isAvailableForTrading': true,
    'retirement.isRetired': false
  }).populate('owner device');
};

// Static method to get market statistics
carbonCreditSchema.statics.getMarketStats = async function() {
  const stats = await this.aggregate([
    {
      $match: {
        'verification.status': 'verified',
        'retirement.isRetired': false
      }
    },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: '$carbonAmount' },
        totalValue: { $sum: { $multiply: ['$carbonAmount', '$trading.price'] } },
        averagePrice: { $avg: '$trading.price' },
        totalProjects: { $sum: 1 },
        totalEnergyGenerated: { $sum: '$energyAmount' }
      }
    }
  ]);
  
  const projectTypes = await this.aggregate([
    {
      $match: {
        'verification.status': 'verified',
        'retirement.isRetired': false
      }
    },
    {
      $group: {
        _id: '$metadata.projectType',
        count: { $sum: 1 },
        totalCredits: { $sum: '$carbonAmount' },
        averagePrice: { $avg: '$trading.price' }
      }
    }
  ]);
  
  return {
    overall: stats[0] || {
      totalCredits: 0,
      totalValue: 0,
      averagePrice: 0,
      totalProjects: 0,
      totalEnergyGenerated: 0
    },
    byProjectType: projectTypes
  };
};

module.exports = mongoose.model('CarbonCredit', carbonCreditSchema);
