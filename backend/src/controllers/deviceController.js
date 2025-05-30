const Device = require('../models/Device');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/certifications');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `cert-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get client IP address
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Register new device
exports.registerDevice = [
  upload.single('certificationFile'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const {
        deviceName,
        deviceType,
        capacity,
        location,
        description,
        serialNumber,
        manufacturer,
        model,
        installationDate
      } = req.body;

      // Check if user already has a device with the same name
      const existingDevice = await Device.findOne({
        owner: userId,
        deviceName: deviceName.trim(),
        isActive: true
      });

      if (existingDevice) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(400).json({
          success: false,
          message: 'You already have a device with this name'
        });
      }

      // Parse location if it's a string
      let locationData = location;
      if (typeof location === 'string') {
        locationData = { address: location };
      }

      // Prepare device data
      const deviceData = {
        owner: userId,
        deviceName: deviceName.trim(),
        deviceType,
        capacity: parseFloat(capacity),
        location: locationData,
        description: description?.trim(),
        specifications: {
          serialNumber: serialNumber?.trim(),
          manufacturer: manufacturer?.trim(),
          model: model?.trim(),
          installationDate: installationDate ? new Date(installationDate) : null
        },
        metadata: {
          registrationIP: getClientIP(req),
          userAgent: req.get('User-Agent'),
          source: 'web'
        }
      };

      // Add certification file info if uploaded
      if (req.file) {
        deviceData.certificationFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimeType: req.file.mimetype
        };
      }

      // Create device
      const device = new Device(deviceData);
      await device.save();

      // Update user statistics
      await User.findByIdAndUpdate(userId, {
        $inc: { 'statistics.totalDevices': 1 }
      });

      // Populate owner info for response
      await device.populate('owner', 'username email fullName');

      res.status(201).json({
        success: true,
        message: 'Device registered successfully. It will be reviewed within 24-48 hours.',
        device: {
          id: device._id,
          deviceName: device.deviceName,
          deviceType: device.deviceType,
          capacity: device.capacity,
          location: device.location,
          verificationStatus: device.verification.status,
          createdAt: device.createdAt,
          status: device.status
        }
      });

    } catch (error) {
      console.error('Device registration error:', error);
      
      // Clean up uploaded file if there was an error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }

      res.status(500).json({
        success: false,
        message: 'Server error during device registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get user's devices
exports.getUserDevices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      status, 
      page = 1, 
      limit = 10, 
      deviceType, 
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    const query = { owner: userId, isActive: true };
    
    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      query['verification.status'] = status;
    }
    
    if (deviceType && ['solar', 'wind', 'hydro', 'geothermal', 'biomass'].includes(deviceType)) {
      query.deviceType = deviceType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [devices, total] = await Promise.all([
      Device.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('verification.reviewedBy', 'username fullName')
        .lean(),
      Device.countDocuments(query)
    ]);

    // Get device statistics
    const stats = await Device.getDeviceStats(userId);

    res.json({
      success: true,
      devices,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      stats
    });

  } catch (error) {
    console.error('Get user devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching devices'
    });
  }
};

// Get device by ID
exports.getDeviceById = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.userId;

    const device = await Device.findOne({
      _id: deviceId,
      owner: userId,
      isActive: true
    })
    .populate('owner', 'username email fullName')
    .populate('verification.reviewedBy', 'username fullName');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      device
    });

  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching device'
    });
  }
};

// Update device
exports.updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    // Find device
    const device = await Device.findOne({
      _id: deviceId,
      owner: userId,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Only allow updates if device is not approved or is approved but only certain fields
    const allowedFields = ['description', 'settings'];
    const restrictedFields = ['deviceName', 'location', 'specifications'];

    if (device.verification.status === 'approved') {
      // For approved devices, only allow certain updates
      const hasRestrictedUpdates = Object.keys(updates).some(key => 
        restrictedFields.includes(key) || 
        (key === 'specifications' && Object.keys(updates[key] || {}).length > 0)
      );

      if (hasRestrictedUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update device specifications for approved devices. Please contact support.'
        });
      }
    }

    // Update allowed fields
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) || device.verification.status !== 'approved') {
        if (key === 'specifications' && typeof updates[key] === 'object') {
          device.specifications = { ...device.specifications.toObject(), ...updates[key] };
        } else if (key === 'settings' && typeof updates[key] === 'object') {
          device.settings = { ...device.settings.toObject(), ...updates[key] };
        } else {
          device[key] = updates[key];
        }
      }
    });

    // If device was rejected and now being updated, reset to pending
    if (device.verification.status === 'rejected') {
      device.verification.status = 'pending';
      device.verification.submittedAt = new Date();
      device.verification.reviewedAt = undefined;
      device.verification.reviewedBy = undefined;
      device.verification.notes = undefined;
    }

    await device.save();

    res.json({
      success: true,
      message: 'Device updated successfully',
      device
    });

  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating device'
    });
  }
};

// Delete device (soft delete)
exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.userId;

    const device = await Device.findOne({
      _id: deviceId,
      owner: userId,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Check if device has active trades
    if (device.trading.activeListing) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete device with active energy listings'
      });
    }

    // Soft delete
    device.isActive = false;
    await device.save();

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: { 'statistics.totalDevices': -1 }
    });

    // Clean up certification file
    if (device.certificationFile && device.certificationFile.path) {
      await fs.unlink(device.certificationFile.path).catch(console.error);
    }

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting device'
    });
  }
};

// Update energy production
exports.updateEnergyProduction = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { energyAmount, timestamp } = req.body;
    const userId = req.user.userId;

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

    if (!energyAmount || energyAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid energy amount is required'
      });
    }

    await device.updateEnergyProduction(
      parseFloat(energyAmount), 
      timestamp ? new Date(timestamp) : new Date()
    );

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: { 'statistics.totalEnergyProduced': parseFloat(energyAmount) }
    });

    res.json({
      success: true,
      message: 'Energy production updated successfully',
      device: {
        id: device._id,
        totalProduced: device.energyProduction.totalProduced,
        currentMonthProduction: device.energyProduction.currentMonthProduction,
        lastReading: device.energyProduction.lastReading
      }
    });

  } catch (error) {
    console.error('Update energy production error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating energy production'
    });
  }
};

// Add maintenance record
exports.addMaintenanceRecord = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type, description, cost, performedBy, date } = req.body;
    const userId = req.user.userId;

    const device = await Device.findOne({
      _id: deviceId,
      owner: userId,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    await device.addMaintenanceRecord({
      type,
      description,
      cost: cost ? parseFloat(cost) : undefined,
      performedBy,
      date: date ? new Date(date) : new Date()
    });

    res.json({
      success: true,
      message: 'Maintenance record added successfully',
      maintenanceHistory: device.maintenance.maintenanceHistory
    });

  } catch (error) {
    console.error('Add maintenance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding maintenance record'
    });
  }
};

// Get device analytics
exports.getDeviceAnalytics = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { period = '30d' } = req.query;
    const userId = req.user.userId;

    const device = await Device.findOne({
      _id: deviceId,
      owner: userId,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Calculate period dates
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

    // In a real application, you would have time-series data
    // For now, we'll return calculated analytics
    const analytics = {
      device: {
        id: device._id,
        name: device.deviceName,
        type: device.deviceType,
        capacity: device.capacity,
        status: device.status
      },
      production: {
        total: device.energyProduction.totalProduced,
        currentMonth: device.energyProduction.currentMonthProduction,
        lastMonth: device.energyProduction.lastMonthProduction,
        average: device.energyProduction.averageDailyProduction,
        peak: device.energyProduction.peakProduction,
        efficiency: device.energyEfficiency
      },
      trading: {
        totalTraded: device.trading.totalEnergyTraded,
        totalRevenue: device.trading.totalRevenue,
        averagePrice: device.trading.averagePrice,
        monthlyRevenue: device.monthlyRevenue
      },
      maintenance: {
        lastMaintenance: device.maintenance.lastMaintenanceDate,
        nextMaintenance: device.maintenance.nextMaintenanceDate,
        totalRecords: device.maintenance.maintenanceHistory.length,
        activeAlerts: device.maintenance.maintenanceAlerts.filter(alert => !alert.resolved).length
      },
      period: {
        start: startDate,
        end: endDate,
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      }
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get device analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching device analytics'
    });
  }
};

// Get available devices for trading
exports.getAvailableDevices = async (req, res) => {
  try {
    const { 
      deviceType, 
      location, 
      minCapacity, 
      maxCapacity,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      'verification.status': 'approved',
      'trading.isAvailableForTrading': true,
      isActive: true
    };

    if (deviceType) filters.deviceType = deviceType;
    if (minCapacity) filters.capacity = { $gte: parseFloat(minCapacity) };
    if (maxCapacity) {
      filters.capacity = { 
        ...filters.capacity, 
        $lte: parseFloat(maxCapacity) 
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [devices, total] = await Promise.all([
      Device.find(filters)
        .populate('owner', 'username fullName statistics.averageRating statistics.totalRatings')
        .sort({ 'energyProduction.totalProduced': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Device.countDocuments(filters)
    ]);

    res.json({
      success: true,
      devices,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get available devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available devices'
    });
  }
};


// Get device statistics
exports.getDeviceStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const stats = await Device.aggregate([
      { $match: { owner: new new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          totalEnergyProduced: { $sum: '$energyProduction.totalProduced' },
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

    const deviceStats = stats[0] || {
      totalDevices: 0,
      totalCapacity: 0,
      totalEnergyProduced: 0,
      approvedDevices: 0,
      pendingDevices: 0,
      rejectedDevices: 0
    };

    res.json({
      success: true,
      stats: deviceStats
    });

  } catch (error) {
    console.error('Get device stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching device statistics'
    });
  }
};


module.exports = {
  registerDevice: exports.registerDevice,
  getUserDevices: exports.getUserDevices,
  getDeviceById: exports.getDeviceById,
  updateDevice: exports.updateDevice,
  deleteDevice: exports.deleteDevice,
  updateEnergyProduction: exports.updateEnergyProduction,
  addMaintenanceRecord: exports.addMaintenanceRecord,
  getDeviceAnalytics: exports.getDeviceAnalytics,
  getAvailableDevices: exports.getAvailableDevices,
  getDeviceStats: exports.getDeviceStats
};


