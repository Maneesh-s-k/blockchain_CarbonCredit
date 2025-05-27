const User = require('../models/User');
const Device = require('../models/Device');
const { validationResult } = require('express-validator');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.role;
    delete updates.isVerified;
    delete updates.energyBalance;
    delete updates.creditBalance;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user devices
exports.getUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // For now, return empty array since Device model might not be fully implemented
    res.status(200).json({
      success: true,
      count: 0,
      devices: []
    });

  } catch (error) {
    console.error('Get user devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user devices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // For now, return empty array since Transaction model might not be fully implemented
    res.status(200).json({
      success: true,
      transactions: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user balance (admin only)
exports.updateUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { energyBalance, creditBalance, action = 'set' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (action === 'add') {
      if (energyBalance) user.energyBalance += energyBalance;
      if (creditBalance) user.creditBalance += creditBalance;
    } else if (action === 'subtract') {
      if (energyBalance) user.energyBalance = Math.max(0, user.energyBalance - energyBalance);
      if (creditBalance) user.creditBalance = Math.max(0, user.creditBalance - creditBalance);
    } else {
      if (energyBalance !== undefined) user.energyBalance = energyBalance;
      if (creditBalance !== undefined) user.creditBalance = creditBalance;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User balance updated successfully',
      user: {
        id: user._id,
        energyBalance: user.energyBalance,
        creditBalance: user.creditBalance
      }
    });

  } catch (error) {
    console.error('Update user balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -verificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
