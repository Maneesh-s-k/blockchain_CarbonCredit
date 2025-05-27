const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sellerId: {
    type: String,
    required: true
  },
  buyerId: {
    type: String,
    required: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  energyAmount: {
    type: Number,
    required: [true, 'Energy amount is required'],
    min: [0, 'Energy amount must be positive']
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price must be positive']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  sellOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradingOrder',
    required: true
  },
  buyOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradingOrder',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  blockchainData: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: String,
    confirmations: {
      type: Number,
      default: 0
    }
  },
  paymentData: {
    method: String,
    reference: String,
    paidAt: Date
  },
  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Calculate total amount before saving
transactionSchema.pre('save', function(next) {
  if (this.isModified('energyAmount') || this.isModified('pricePerUnit')) {
    this.totalAmount = this.energyAmount * this.pricePerUnit;
  }
  next();
});

// Index for efficient queries
transactionSchema.index({ sellerId: 1, status: 1 });
transactionSchema.index({ buyerId: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ 'blockchainData.transactionHash': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
