const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');
const smsService = require('../utils/smsService');

// Check if emails should be sent (disabled in development)
const shouldSendEmails = process.env.NODE_ENV === 'production' && process.env.DISABLE_EMAILS !== 'true';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Get client IP address
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Register user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, phone, walletAddress } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Check if phone number is already registered
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already registered'
        });
      }
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      phone,
      walletAddress
    });

    // Generate email verification token
    const emailVerificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Send verification email (with error handling)
    if (shouldSendEmails) {
      try {
        await emailService.sendEmailVerification(email, username, emailVerificationToken);
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        // Continue with registration even if email fails
      }
    } else {
      console.log('📧 [DEV] Email Verification would be sent:', {
        to: email,
        username,
        verificationUrl: `http://localhost:3000/verify-email/${emailVerificationToken}`
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Add login history
    const clientIP = getClientIP(req);
    user.addLoginHistory(clientIP, req.get('User-Agent'), 'Registration');
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      token,
      refreshToken,
      user,
      requiresEmailVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
      });
    }

    // Update last login and add to history
    const clientIP = getClientIP(req);
    user.lastLogin = new Date();
    user.addLoginHistory(clientIP, req.get('User-Agent'), 'Login');
    await user.save();

    // Generate tokens
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: tokenExpiry
    });
    const refreshToken = generateRefreshToken(user._id);

    // Send security alert if enabled (with error handling)
    if (shouldSendEmails && user.preferences.notifications.email) {
      try {
        await emailService.sendSecurityAlert(
          user.email, 
          user.username, 
          'New Login', 
          `Login from IP: ${clientIP} at ${new Date().toLocaleString()}`
        );
      } catch (error) {
        console.error('Security alert email failed:', error.message);
        // Continue with login even if email fails
      }
    } else {
      console.log('🔐 [DEV] Security Alert would be sent:', {
        user: user.username,
        type: 'New Login',
        ip: clientIP,
        time: new Date().toLocaleString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user,
      requiresEmailVerification: !user.isEmailVerified
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email (with error handling)
    if (shouldSendEmails) {
      try {
        await emailService.sendWelcomeEmail(user.email, user.username);
      } catch (error) {
        console.error('Welcome email failed:', error.message);
      }
    } else {
      console.log('🎉 [DEV] Welcome Email would be sent:', {
        to: user.email,
        username: user.username
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// Resend email verification
exports.resendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const emailVerificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email (with error handling)
    if (shouldSendEmails) {
      try {
        await emailService.sendEmailVerification(user.email, user.username, emailVerificationToken);
      } catch (emailError) {
        console.error('Resend email verification failed:', emailError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to resend verification email'
        });
      }
    } else {
      console.log('📧 [DEV] Resend Email Verification would be sent:', {
        to: user.email,
        username: user.username,
        verificationUrl: `http://localhost:3000/verify-email/${emailVerificationToken}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};

// Send phone verification
exports.sendPhoneVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if phone is already verified
    if (user.phone === phone && user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Generate verification code
    const verificationCode = user.generatePhoneVerificationCode();
    user.phone = phone;
    await user.save();

    // Send SMS (with error handling)
    try {
      await smsService.sendPhoneVerification(phone, verificationCode, user.username);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your phone'
    });

  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
};

// Verify phone
exports.verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if code is valid and not expired
    if (!user.phoneVerificationCode || 
        user.phoneVerificationCode !== code || 
        user.phoneVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    // Send welcome SMS (with error handling)
    try {
      await smsService.sendWelcomeSMS(user.phone, user.username);
    } catch (error) {
      console.error('Welcome SMS failed:', error.message);
    }

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully',
      user
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone verification'
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email (with error handling)
    if (shouldSendEmails) {
      try {
        await emailService.sendPasswordReset(user.email, user.username, resetToken);
        
        // Send SMS notification if phone is verified
        if (user.phone && user.isPhoneVerified && user.preferences.notifications.sms) {
          try {
            await smsService.sendPasswordResetNotification(user.phone, user.username);
          } catch (smsError) {
            console.error('Password reset SMS failed:', smsError.message);
          }
        }
      } catch (error) {
        console.error('Password reset email failed:', error.message);
      }
    } else {
      console.log('🔒 [DEV] Password Reset would be sent:', {
        to: user.email,
        username: user.username,
        resetUrl: `http://localhost:3000/reset-password/${resetToken}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Reset login attempts if any
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    // Send security alert (with error handling)
    if (shouldSendEmails) {
      try {
        await emailService.sendSecurityAlert(
          user.email, 
          user.username, 
          'Password Reset', 
          'Your password has been successfully reset'
        );
      } catch (error) {
        console.error('Security alert failed:', error.message);
      }
    } else {
      console.log('🔐 [DEV] Security Alert would be sent:', {
        user: user.username,
        type: 'Password Reset',
        message: 'Password successfully reset'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    user.password = newPassword;
    await user.save();

    // Send security alert (with error handling)
    if (shouldSendEmails) {
      try {
        await emailService.sendSecurityAlert(
          user.email, 
          user.username, 
          'Password Changed', 
          'Your password has been successfully changed'
        );
      } catch (error) {
        console.error('Security alert failed:', error.message);
      }
    } else {
      console.log('🔐 [DEV] Security Alert would be sent:', {
        user: user.username,
        type: 'Password Changed',
        message: 'Password successfully changed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

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
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

// Get login history
exports.getLoginHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('loginHistory');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      loginHistory: user.loginHistory
    });

  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
