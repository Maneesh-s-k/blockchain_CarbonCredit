const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['card', 'bank', 'paypal', 'crypto'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Card details
  card: {
    stripePaymentMethodId: String,
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    holderName: String
  },
  // Bank account details
  bankAccount: {
    accountNumber: String,
    routingNumber: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings']
    },
    bankName: String,
    holderName: String
  },
  // PayPal details
  paypal: {
    email: String,
    paypalId: String
  },
  // Crypto wallet
  crypto: {
    address: String,
    currency: {
      type: String,
      enum: ['BTC', 'ETH', 'USDC']
    }
  },
  metadata: {
    addedIP: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes
paymentMethodSchema.index({ user: 1, isActive: 1 });
paymentMethodSchema.index({ user: 1, isDefault: 1 });

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
