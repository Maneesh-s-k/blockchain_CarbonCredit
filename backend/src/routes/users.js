const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validationResult } = require('express-validator');
const User = require('../models/User');


//console debug
console.log('📍 Users routes file loaded');
router.get('/test', (req, res) => {
  res.json({ message: 'Users route is working!' });
});



// fix idk what
router.get('/:userId/public', async (req, res) => {
  console.log('🔍 PUBLIC PROFILE ROUTE HIT for:', req.params.userId);
  
  try {
    const user = await User.findById(req.params.userId)
      .select('username firstName lastName fullName avatar bio location statistics createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      profile: {
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        statistics: user.statistics,
        memberSince: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// Get public user profile - FIXED
router.get('/:userId/public', [
  param('userId').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
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
    
    const user = await User.findById(userId)
      .select('username firstName lastName fullName avatar bio location statistics createdAt lastLogin preferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy settings - FIXED: Use correct path
    if (user.preferences && user.preferences.privacy && !user.preferences.privacy.profileVisible) {
      return res.status(403).json({
        success: false,
        message: 'Profile is private'
      });
    }

    // Use the model method to get public profile
    const publicProfile = user.getPublicProfile();

    res.json({
      success: true,
      profile: publicProfile
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// Search users
router.get('/search', [
  query('q').optional().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(q, 'i');
    
    const filters = {
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex }
      ],
      isActive: true,
      'preferences.privacy.profileVisible': { $ne: false } // Default to visible if not set
    };

    const [users, total] = await Promise.all([
      User.find(filters)
        .select('username firstName lastName fullName avatar bio statistics.averageRating statistics.totalTrades')
        .sort({ 'statistics.totalTrades': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filters)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalEnergyProduced: { $sum: '$statistics.totalEnergyProduced' },
          totalTrades: { $sum: '$statistics.totalTrades' },
          averageRating: { $avg: '$statistics.averageRating' }
        }
      }
    ]);

    const platformStats = stats[0] || {
      totalUsers: 0,
      totalEnergyProduced: 0,
      totalTrades: 0,
      averageRating: 0
    };

    res.json({
      success: true,
      stats: platformStats
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

module.exports = router;
