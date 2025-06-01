const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    index: true
  },
  
  period: {
    start: {
      type: Date,
      required: true,
      index: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  
  energyMetrics: {
    totalProduced: {
      type: Number,
      default: 0
    },
    totalConsumed: {
      type: Number,
      default: 0
    },
    netProduction: {
      type: Number,
      default: 0
    },
    efficiency: {
      type: Number,
      default: 0
    },
    peakProduction: {
      value: Number,
      timestamp: Date
    }
  },
  
  tradingMetrics: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    expenses: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    averageSellingPrice: {
      type: Number,
      default: 0
    },
    averageBuyingPrice: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    }
  },
  
  carbonMetrics: {
    creditsEarned: {
      type: Number,
      default: 0
    },
    creditsTraded: {
      type: Number,
      default: 0
    },
    co2Offset: {
      type: Number,
      default: 0
    },
    environmentalImpact: {
      treesEquivalent: Number,
      carsOffRoad: Number
    }
  },
  
  deviceMetrics: {
    activeDevices: {
      type: Number,
      default: 0
    },
    totalCapacity: {
      type: Number,
      default: 0
    },
    utilizationRate: {
      type: Number,
      default: 0
    },
    maintenanceAlerts: {
      type: Number,
      default: 0
    }
  },
  
  marketMetrics: {
    marketShare: {
      type: Number,
      default: 0
    },
    ranking: {
      type: Number,
      default: 0
    },
    competitivePosition: {
      type: String,
      enum: ['leader', 'challenger', 'follower', 'niche']
    }
  },
  
  trends: {
    energyProduction: [{
      date: Date,
      value: Number
    }],
    tradingVolume: [{
      date: Date,
      value: Number
    }],
    prices: [{
      date: Date,
      value: Number
    }]
  },
  
  metadata: {
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    dataPoints: {
      type: Number,
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 95
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
analyticsSchema.index({ user: 1, type: 1, 'period.start': -1 });
analyticsSchema.index({ type: 1, 'period.start': -1 });
analyticsSchema.index({ 'period.start': -1, 'period.end': -1 });

// Virtual for ROI calculation
analyticsSchema.virtual('roi').get(function() {
  if (this.tradingMetrics.expenses === 0) return 0;
  return ((this.tradingMetrics.profit / this.tradingMetrics.expenses) * 100);
});

// Virtual for energy efficiency
analyticsSchema.virtual('overallEfficiency').get(function() {
  if (this.deviceMetrics.totalCapacity === 0) return 0;
  const theoreticalMax = this.deviceMetrics.totalCapacity * 24 * this.getPeriodDays();
  return (this.energyMetrics.totalProduced / theoreticalMax) * 100;
});

// Method to get period duration in days
analyticsSchema.methods.getPeriodDays = function() {
  const diffTime = Math.abs(this.period.end - this.period.start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to aggregate user analytics
analyticsSchema.statics.aggregateUserAnalytics = async function(userId, type, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: type,
        'period.start': { $gte: startDate },
        'period.end': { $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEnergyProduced: { $sum: '$energyMetrics.totalProduced' },
        totalRevenue: { $sum: '$tradingMetrics.revenue' },
        totalProfit: { $sum: '$tradingMetrics.profit' },
        totalCO2Offset: { $sum: '$carbonMetrics.co2Offset' },
        averageEfficiency: { $avg: '$energyMetrics.efficiency' },
        totalTransactions: { $sum: '$tradingMetrics.transactionCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Analytics', analyticsSchema);
