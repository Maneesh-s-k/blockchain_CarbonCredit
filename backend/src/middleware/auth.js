const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a refresh token (shouldn't be used for authentication)
    if (decoded.type === 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked'
      });
    }

    req.user = decoded;
    req.userDoc = user; // Include full user document for convenience
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = req.userDoc || await User.findById(req.user.userId);
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error during authorization'
      });
    }
  };
};

// Middleware to check if email is verified
exports.requireEmailVerification = (req, res, next) => {
  if (!req.userDoc.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      requiresEmailVerification: true
    });
  }
  next();
};

// Middleware to check if phone is verified
exports.requirePhoneVerification = (req, res, next) => {
  if (!req.userDoc.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required',
      requiresPhoneVerification: true
    });
  }
  next();
};
