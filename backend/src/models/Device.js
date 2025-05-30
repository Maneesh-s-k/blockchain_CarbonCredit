const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceName: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  deviceType: {
    type: String,
    required: [true, 'Device type is required'],
    enum: {
      values: ['solar', 'wind', 'hydro', 'geothermal', 'biomass'],
      message: 'Device type must be solar, wind, hydro, geothermal, or biomass'
    },
    index: true
  },
  capacity: {
    type: Number,
    required: [true, 'Device capacity is required'],
    min: [0.1, 'Capacity must be at least 0.1 kW'],
    max: [10000, 'Capacity cannot exceed 10,000 kW']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Device location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    timezone: String
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  specifications: {
    serialNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Serial number cannot exceed 50 characters']
    },
    manufacturer: {
      type: String,
      trim: true,
      maxlength: [100, 'Manufacturer name cannot exceed 100 characters']
    },
    model: {
      type: String,
      trim: true,
      maxlength: [100, 'Model name cannot exceed 100 characters']
    },
    installationDate: Date,
    warrantyExpiry: Date,
    efficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    }
  },
  certificationFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Verification notes cannot exceed 1000 characters']
    },
    documents: [{
      type: String,
      filename: String,
      uploadDate: Date
    }]
  },
  energyProduction: {
    totalProduced: {
      type: Number,
      default: 0,
      min: 0
    },
    currentMonthProduction: {
      type: Number,
      default: 0,
      min: 0
    },
    lastMonthProduction: {
      type: Number,
      default: 0,
      min: 0
    },
    averageDailyProduction: {
      type: Number,
      default: 0,
      min: 0
    },
    peakProduction: {
      value: {
        type: Number,
        default: 0
      },
      date: Date
    },
    lastReading: {
      value: Number,
      timestamp: Date,
      source: String
    }
  },
  maintenance: {
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceHistory: [{
      date: Date,
      type: {
        type: String,
        enum: ['routine', 'repair', 'upgrade', 'inspection']
      },
      description: String,
      cost: Number,
      performedBy: String
    }],
    maintenanceAlerts: [{
      type: String,
      message: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },
  trading: {
    isAvailableForTrading: {
      type: Boolean,
      default: true
    },
    totalEnergyTraded: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    averagePrice: {
      type: Number,
      default: 0,
      min: 0
    },
    activeListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnergyListing'
    }
  },
  monitoring: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastOnline: Date,
    connectionType: {
      type: String,
      enum: ['wifi', 'ethernet', 'cellular', 'satellite']
    },
    firmwareVersion: String,
    dataCollectionInterval: {
      type: Number,
      default: 300 // 5 minutes in seconds
    }
  },
  settings: {
    autoSell: {
      enabled: {
        type: Boolean,
        default: false
      },
      minimumPrice: Number,
      maximumQuantity: Number
    },
    alerts: {
      lowProduction: {
        enabled: {
          type: Boolean,
          default: true
        },
        threshold: Number
      },
      maintenance: {
        enabled: {
          type: Boolean,
        default: true
        },
        daysBeforeAlert: {
          type: Number,
          default: 30
        }
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    registrationIP: String,
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

// Indexes for efficient queries
deviceSchema.index({ owner: 1, 'verification.status': 1 });
deviceSchema.index({ deviceType: 1, 'verification.status': 1 });
deviceSchema.index({ 'location.coordinates': '2dsphere' });
deviceSchema.index({ createdAt: -1 });
deviceSchema.index({ 'verification.status': 1, createdAt: -1 });
deviceSchema.index({ 'trading.isAvailableForTrading': 1, 'verification.status': 1 });

// Virtual for device age in days
deviceSchema.virtual('deviceAge').get(function() {
  if (!this.specifications.installationDate) return null;
  const now = new Date();
  const installed = new Date(this.specifications.installationDate);
  const diffTime = Math.abs(now - installed);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for energy efficiency percentage
deviceSchema.virtual('energyEfficiency').get(function() {
  if (!this.energyProduction.totalProduced || !this.capacity || !this.deviceAge) return 0;
  const theoreticalMax = this.capacity * 24 * this.deviceAge; // kWh
  return Number(((this.energyProduction.totalProduced / theoreticalMax) * 100).toFixed(2));
});

// Virtual for monthly revenue
deviceSchema.virtual('monthlyRevenue').get(function() {
  if (!this.energyProduction.currentMonthProduction || !this.trading.averagePrice) return 0;
  return Number((this.energyProduction.currentMonthProduction * this.trading.averagePrice).toFixed(2));
});

// Virtual for device status
deviceSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.verification.status !== 'approved') return this.verification.status;
  if (!this.monitoring.isOnline) return 'offline';
  if (this.maintenance.maintenanceAlerts.some(alert => !alert.resolved && alert.severity === 'critical')) {
    return 'maintenance_required';
  }
  return 'operational';
});

// Method to update energy production
deviceSchema.methods.updateEnergyProduction = async function(energyAmount, timestamp = new Date()) {
  this.energyProduction.totalProduced += energyAmount;
  this.energyProduction.lastReading = {
    value: energyAmount,
    timestamp,
    source: 'manual'
  };
  
  // Update monthly production
  const currentMonth = new Date().getMonth();
  const readingMonth = new Date(timestamp).getMonth();
  
  if (currentMonth === readingMonth) {
    this.energyProduction.currentMonthProduction += energyAmount;
  }
  
  // Update peak production
  if (energyAmount > this.energyProduction.peakProduction.value) {
    this.energyProduction.peakProduction = {
      value: energyAmount,
      date: timestamp
    };
  }
  
  return await this.save();
};

// Method to add maintenance record
deviceSchema.methods.addMaintenanceRecord = async function(maintenanceData) {
  this.maintenance.maintenanceHistory.push({
    ...maintenanceData,
    date: maintenanceData.date || new Date()
  });
  
  this.maintenance.lastMaintenanceDate = maintenanceData.date || new Date();
  
  // Calculate next maintenance date (default 6 months)
  const nextDate = new Date(this.maintenance.lastMaintenanceDate);
  nextDate.setMonth(nextDate.getMonth() + 6);
  this.maintenance.nextMaintenanceDate = nextDate;
  
  return await this.save();
};

// Method to add maintenance alert
deviceSchema.methods.addMaintenanceAlert = async function(alertData) {
  this.maintenance.maintenanceAlerts.push({
    ...alertData,
    createdAt: new Date()
  });
  
  return await this.save();
};

// Method to resolve maintenance alert
deviceSchema.methods.resolveMaintenanceAlert = async function(alertId) {
  const alert = this.maintenance.maintenanceAlerts.id(alertId);
  if (alert) {
    alert.resolved = true;
  }
  
  return await this.save();
};

// Static method to get user's devices
deviceSchema.statics.getUserDevices = function(userId, filters = {}) {
  const query = { 
    owner: userId, 
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('owner', 'username email fullName');
};

// Static method to get devices by type and location
deviceSchema.statics.getAvailableDevices = function(filters = {}) {
  const query = {
    'verification.status': 'approved',
    'trading.isAvailableForTrading': true,
    isActive: true,
    ...filters
  };
  
  return this.find(query)
    .populate('owner', 'username fullName averageRating totalRatings')
    .sort({ 'energyProduction.totalProduced': -1 });
};

// Static method to get device statistics
deviceSchema.statics.getDeviceStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalDevices: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' },
        totalEnergyProduced: { $sum: '$energyProduction.totalProduced' },
        totalRevenue: { $sum: '$trading.totalRevenue' },
        approvedDevices: {
          $sum: { $cond: [{ $eq: ['$verification.status', 'approved'] }, 1, 0] }
        },
        pendingDevices: {
          $sum: { $cond: [{ $eq: ['$verification.status', 'pending'] }, 1, 0] }
        },
        rejectedDevices: {
          $sum: { $cond: [{ $eq: ['$verification.status', 'rejected'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalDevices: 0,
    totalCapacity: 0,
    totalEnergyProduced: 0,
    totalRevenue: 0,
    approvedDevices: 0,
    pendingDevices: 0,
    rejectedDevices: 0
  };
};

module.exports = mongoose.model('Device', deviceSchema);
