const mongoose = require('mongoose');

const energyListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  energyType: {
    type: String,
    required: true,
    enum: ['solar', 'wind', 'hydro', 'geothermal', 'biomass'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Energy amount is required'],
    min: [0.1, 'Minimum amount is 0.1 kWh'],
    max: [10000, 'Maximum amount is 10,000 kWh']
  },
  pricePerKwh: {
    type: Number,
    required: [true, 'Price per kWh is required'],
    min: [0.01, 'Minimum price is $0.01 per kWh'],
    max: [1.00, 'Maximum price is $1.00 per kWh']
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  availability: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    timeSlots: [{
      start: String, // "09:00"
      end: String    // "17:00"
    }]
  },
  preferences: {
    buyerRating: {
      minimum: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      }
    },
    autoAccept: {
      type: Boolean,
      default: false
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    createdIP: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
energyListingSchema.index({ seller: 1, status: 1 });
energyListingSchema.index({ energyType: 1, status: 1 });
energyListingSchema.index({ pricePerKwh: 1, status: 1 });
energyListingSchema.index({ 'location.coordinates': '2dsphere' });
energyListingSchema.index({ createdAt: -1 });
energyListingSchema.index({ status: 1, 'availability.endDate': 1 });

// Virtual for time remaining
energyListingSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return null;
  
  const now = new Date();
  const end = new Date(this.availability.endDate);
  const diff = end - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
});

// Virtual for is expired
energyListingSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.availability.endDate);
});

// Pre-save middleware
energyListingSchema.pre('save', function(next) {
  // Calculate total price
  this.totalPrice = Number((this.amount * this.pricePerKwh).toFixed(2));
  
  // Check if expired
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Method to increment views
energyListingSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

// Method to increment inquiries
energyListingSchema.methods.incrementInquiries = function() {
  this.metadata.inquiries += 1;
  return this.save();
};

// Static method to get active listings
energyListingSchema.statics.getActiveListings = function(filters = {}) {
  return this.find({
    status: 'active',
    'availability.endDate': { $gt: new Date() },
    ...filters
  })
  .populate('seller', 'username fullName statistics.averageRating')
  .populate('device', 'deviceName deviceType capacity location')
  .sort({ createdAt: -1 });
};

// Static method to expire old listings
energyListingSchema.statics.expireOldListings = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      'availability.endDate': { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('EnergyListing', energyListingSchema);
