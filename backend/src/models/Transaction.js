const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnergyListing',
    required: true
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  energy: {
    type: {
      type: String,
      required: true,
      enum: ['solar', 'wind', 'hydro', 'geothermal', 'biomass']
    },
    amount: {
      type: Number,
      required: true,
      min: 0.1
    },
    pricePerKwh: {
      type: Number,
      required: true,
      min: 0.01
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0.01
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['wallet', 'card', 'bank_transfer', 'crypto'],
      default: 'wallet'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    transactionId: String,
    paymentGateway: String,
    fees: {
      platform: {
        type: Number,
        default: 0
      },
      payment: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      }
    },
    processedAt: Date,
    failureReason: String
  },
  delivery: {
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'failed'],
      default: 'scheduled',
      index: true
    },
    scheduledDate: Date,
    completedDate: Date,
    method: {
      type: String,
      enum: ['grid_transfer', 'direct_supply', 'certificate'],
      default: 'grid_transfer'
    },
    trackingId: String,
    notes: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending',
    index: true
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  ratings: {
    buyerRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    },
    sellerRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    }
  },
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    description: String,
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed']
    },
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  metadata: {
    createdIP: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
transactionSchema.index({ buyer: 1, status: 1 });
transactionSchema.index({ seller: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ 'payment.status': 1 });
transactionSchema.index({ 'delivery.status': 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for total amount including fees
transactionSchema.virtual('totalAmount').get(function() {
  return this.energy.totalPrice + this.payment.fees.total;
});

// Virtual for seller amount after fees
transactionSchema.virtual('sellerAmount').get(function() {
  return this.energy.totalPrice - this.payment.fees.platform;
});

// Virtual for transaction age
transactionSchema.virtual('transactionAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
});

// Method to update status
transactionSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    note,
    updatedBy
  });
  
  // Update specific status fields
  if (newStatus === 'completed') {
    this.delivery.status = 'completed';
    this.delivery.completedDate = new Date();
    this.payment.status = 'completed';
    this.payment.processedAt = new Date();
  }
  
  return this.save();
};

// Method to process payment
transactionSchema.methods.processPayment = async function(paymentData) {
  this.payment.status = 'processing';
  this.payment.transactionId = paymentData.transactionId;
  this.payment.paymentGateway = paymentData.gateway;
  
  // Add timeline entry
  this.timeline.push({
    status: 'payment_processing',
    note: 'Payment processing initiated'
  });
  
  return await this.save();
};

// Method to complete payment
transactionSchema.methods.completePayment = async function() {
  this.payment.status = 'completed';
  this.payment.processedAt = new Date();
  this.status = 'confirmed';
  
  this.timeline.push({
    status: 'payment_completed',
    note: 'Payment completed successfully'
  });
  
  return await this.save();
};

// Method to initiate dispute
transactionSchema.methods.initiateDispute = async function(disputeData, initiatedBy) {
  this.dispute = {
    isDisputed: true,
    initiatedBy,
    reason: disputeData.reason,
    description: disputeData.description,
    status: 'open'
  };
  
  this.status = 'disputed';
  
  this.timeline.push({
    status: 'disputed',
    note: `Dispute initiated: ${disputeData.reason}`,
    updatedBy: initiatedBy
  });
  
  return await this.save();
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, role = 'both', filters = {}) {
  let query = { ...filters };
  
  if (role === 'buyer') {
    query.buyer = userId;
  } else if (role === 'seller') {
    query.seller = userId;
  } else {
    query.$or = [{ buyer: userId }, { seller: userId }];
  }
  
  return this.find(query)
    .populate('buyer', 'username fullName')
    .populate('seller', 'username fullName')
    .populate('listing', 'energyType amount pricePerKwh')
    .populate('device', 'deviceName deviceType')
    .sort({ createdAt: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = async function(userId, role = 'both') {
  const matchStage = {};
  
  if (role === 'buyer') {
    matchStage.buyer = mongoose.Types.ObjectId(userId);
  } else if (role === 'seller') {
    matchStage.seller = mongoose.Types.ObjectId(userId);
  } else {
    matchStage.$or = [
      { buyer: mongoose.Types.ObjectId(userId) },
      { seller: mongoose.Types.ObjectId(userId) }
    ];
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalVolume: { $sum: '$energy.amount' },
        totalValue: { $sum: '$energy.totalPrice' },
        completedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        averageTransactionValue: { $avg: '$energy.totalPrice' },
        averageEnergyAmount: { $avg: '$energy.amount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalVolume: 0,
    totalValue: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    averageTransactionValue: 0,
    averageEnergyAmount: 0
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
