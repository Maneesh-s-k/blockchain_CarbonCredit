const User = require('../models/User');
const Device = require('../models/Device');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/avatars');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  }
});

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('-password -security.passwordResetToken -security.passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional statistics
    const [deviceStats, tradingStats, walletStats] = await Promise.all([
      Device.aggregate([
        { $match: { owner: new new mongoose.Types.ObjectId(userId), isActive: true } },
        {
          $group: {
            _id: null,
            totalDevices: { $sum: 1 },
            totalCapacity: { $sum: '$capacity' },
            totalEnergyProduced: { $sum: '$energyProduction.totalProduced' },
            approvedDevices: {
              $sum: { $cond: [{ $eq: ['$verification.status', 'approved'] }, 1, 0] }
            }
          }
        }
      ]),
      Transaction.aggregate([
        { $match: { $or: [{ buyer: new new mongoose.Types.ObjectId(userId) }, { seller: new new mongoose.Types.ObjectId(userId) }] } },
        {
          $group: {
            _id: null,
            totalTrades: { $sum: 1 },
            totalVolume: { $sum: '$energy.amount' },
            totalValue: { $sum: '$energy.totalPrice' }
          }
        }
      ]),
      WalletTransaction.aggregate([
        { $match: { user: new new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const profileData = {
      ...user.toObject(),
      statistics: {
        ...user.statistics,
        devices: deviceStats[0] || { totalDevices: 0, totalCapacity: 0, totalEnergyProduced: 0, approvedDevices: 0 },
        trading: tradingStats[0] || { totalTrades: 0, totalVolume: 0, totalValue: 0 },
        wallet: walletStats.reduce((acc, stat) => {
          acc[stat._id] = { count: stat.count, totalAmount: stat.totalAmount };
          return acc;
        }, {})
      }
    };

    res.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'bio', 'location',
      'preferences.notifications', 'preferences.privacy', 'preferences.trading'
    ];

    const updateData = {};
    
    // Handle nested updates
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key.includes('.')) {
          // Handle nested fields like preferences.notifications
          const [parent, child] = key.split('.');
          if (!updateData[parent]) updateData[parent] = {};
          updateData[parent][child] = updates[key];
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -security.passwordResetToken -security.passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// Upload avatar
exports.uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No avatar file provided'
        });
      }

      const userId = req.user.userId;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Get current user to delete old avatar
      const user = await User.findById(userId);
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../', user.avatar);
        await fs.unlink(oldAvatarPath).catch(() => {}); // Ignore errors
      }

      // Update user with new avatar
      user.avatar = avatarPath;
      await user.save();

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatar: avatarPath
      });

    } catch (error) {
      console.error('Upload avatar error:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      res.status(500).json({
        success: false,
        message: 'Server error uploading avatar'
      });
    }
  }
];

// Get user dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [
      user,
      deviceStats,
      recentTransactions,
      activeListings,
      walletTransactions
    ] = await Promise.all([
      User.findById(userId).select('wallet statistics'),
      Device.getDeviceStats(userId),
      Transaction.getUserTransactions(userId, 'both', {}).limit(5),
      EnergyListing.find({ seller: userId, status: 'active' }).limit(3),
      WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(5)
    ]);

    const dashboardData = {
      wallet: user.wallet,
      statistics: {
        devices: deviceStats,
        trading: {
          totalTrades: user.statistics.totalTrades,
          totalEnergyTraded: user.statistics.totalEnergyTraded,
          averageRating: user.statistics.averageRating
        }
      },
      recentActivity: {
        transactions: recentTransactions,
        walletTransactions: walletTransactions,
        activeListings: activeListings
      }
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notifications } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 'preferences.notifications': notifications },
      { new: true }
    ).select('preferences.notifications');

    res.json({
      success: true,
      message: 'Notification preferences updated',
      notifications: user.preferences.notifications
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating preferences'
    });
  }
};

// Update privacy settings
exports.updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { privacy } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 'preferences.privacy': privacy },
      { new: true }
    ).select('preferences.privacy');

    res.json({
      success: true,
      message: 'Privacy settings updated',
      privacy: user.preferences.privacy
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating privacy settings'
    });
  }
};

module.exports = {
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  uploadAvatar: exports.uploadAvatar,
  getDashboardData: exports.getDashboardData,
  updateNotificationPreferences: exports.updateNotificationPreferences,
  updatePrivacySettings: exports.updatePrivacySettings
};
