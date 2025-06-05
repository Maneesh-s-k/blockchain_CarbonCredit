const Device = require('../models/Device');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require('express-validator');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certifications/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Get client IP address
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Register new device
exports.registerDevice = async (req, res) => {
  console.log('[Device Registration] Starting process');
  console.log('Authenticated user:', req.user);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Uploaded file:', req.file);

  let cleanupFile = null;
  
  try {
    // Cleanup guard clause
    if (req.file) cleanupFile = req.file.path;

    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[Validation Failed] Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    console.log('[Validation] Passed');

    const userId = req.user.userId;
    const { deviceName } = req.body;

    // Existing device check
    console.log(`[Duplicate Check] Looking for ${deviceName} for user ${userId}`);
    const existingDevice = await Device.findOne({
      owner: userId,
      deviceName: deviceName.trim(),
      isActive: true
    });

    if (existingDevice) {
      console.warn('[Duplicate Device] Conflict detected:', existingDevice);
      return res.status(400).json({
        success: false,
        message: 'You already have an active device with this name'
      });
    }

    // Data preparation
    console.log('[Data Preparation] Parsing input data');
    const deviceData = {
      owner: userId,
      deviceName: req.body.deviceName.trim(),
      deviceType: req.body.deviceType,
      capacity: parseFloat(req.body.capacity),
      location: parseLocation(req.body.location),
      description: req.body.description?.trim(),
      specifications: {
        serialNumber: req.body.serialNumber?.trim(),
        manufacturer: req.body.manufacturer?.trim(),
        model: req.body.model?.trim(),
        installationDate: req.body.installationDate 
          ? new Date(req.body.installationDate)
          : null
      },
      metadata: {
        registrationIP: getClientIP(req),
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    };

    // File handling
    if (req.file) {
      deviceData.certificationFile = createFileMetadata(req.file);
      console.log('File metadata added:', deviceData.certificationFile);
    }

    // Database operations
    console.log('[Database] Creating new device');
    const device = new Device(deviceData);
    await device.save();
    console.log('Device created:', device._id);

    console.log('[User Update] Incrementing device count');
    await User.findByIdAndUpdate(userId, {
      $inc: { 'statistics.totalDevices': 1 }
    });

    console.log('[Population] Adding owner details');
    await device.populate('owner', 'username email fullName');

    // Success response
    console.log('[Success] Device registration complete');
    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      device: formatDeviceResponse(device)
    });

    // Clear cleanup marker after successful save
    cleanupFile = null;

  } catch (error) {
    console.error('[Registration Error]', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Server error during registration';

    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } finally {
    // Cleanup uploaded file if something failed
    if (cleanupFile) {
      console.log('[Cleanup] Removing orphaned file:', cleanupFile);
      await fs.unlink(cleanupFile).catch(cleanupError => {
        console.error('[Cleanup Error] Failed to remove file:', cleanupError);
      });
    }
  }
};



//helper functions 



function parseLocation(locationInput) {
  try {
    return typeof locationInput === 'string' 
      ? JSON.parse(locationInput)
      : locationInput;
  } catch (error) {
    console.warn('[Location Parse] Using fallback address parsing');
    return { address: locationInput.toString() };
  }
}

function createFileMetadata(file) {
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date()
  };
}

function formatDeviceResponse(device) {
  return {
    id: device._id,
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    capacity: device.capacity,
    location: device.location,
    status: device.status,
    verification: device.verification,
    createdAt: device.createdAt
  };
}

// helper functions

/////////////////////////////


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


