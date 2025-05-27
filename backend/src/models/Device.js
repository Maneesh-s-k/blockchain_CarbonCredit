const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  deviceType: {
    type: String,
    required: [true, 'Device type is required'],
    enum: ['solar', 'wind', 'hydro', 'battery', 'other']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [0, 'Capacity must be positive']
  },
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  manufacturer: String,
  installationDate: Date,
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'maintenance'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  energyProduction: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      default: 'kWh'
    }
  }],
  totalEnergyProduced: {
    type: Number,
    default: 0,
    min: 0
  },
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date
}, {
  timestamps: true
});

// Index for efficient queries
deviceSchema.index({ serialNumber: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ deviceType: 1 });

module.exports = mongoose.model('Device', deviceSchema);
