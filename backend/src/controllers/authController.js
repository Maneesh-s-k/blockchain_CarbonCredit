const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const EmailService = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id,
      username: user.username,
      email: user.email 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Helper to generate 6-digit OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Register new user (NO tokens issued here!)
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('Found existing user:', {
        email: existingUser.email,
        username: existingUser.username,
        id: existingUser._id
      });
      
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
        debug: process.env.NODE_ENV === 'development' ? {
          foundEmail: existingUser.email,
          foundUsername: existingUser.username
        } : undefined
      });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('🔢 Generated OTP for', email, ':', otp);

    // Create new user with OTP
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      verification: {
        email: {
          verificationOTP: otp,
          verificationExpires: Date.now() + 600000 // 10 minutes
        }
      }
    });

    await user.save();
    console.log('💾 User saved with OTP verification fields');

    // Send OTP email
    try {
      const emailService = new EmailService();
      console.log('📧 Attempting to send OTP email to:', email);
      await emailService.sendOTPEmail(user.email, user.username, otp);
      console.log('✅ OTP email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Delete the user if email sending fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.security;

    res.status(201).json({
      success: true,
      message: 'Registration successful! Check email for OTP',
      user: userResponse
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

// Login user - FIXED to check email verification
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

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // ✅ Check if email is verified (prevents unverified users from logging in)
    if (!user.isEmailVerified && !user.verification?.email?.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresEmailVerification: true
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (user.security && user.security.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update login info
    user.lastLogin = new Date();
    user.ipAddress = req.ip;
    user.userAgent = req.get('User-Agent');
    await user.save();

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.security;

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
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

// Send OTP (resend) - ONLY sends OTP, does NOT verify user
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    console.log('🔄 Resending OTP for', email, ':', otp);

    // ✅ ONLY update OTP fields, DON'T verify user
    user.verification.email.verificationOTP = otp;
    user.verification.email.verificationExpires = Date.now() + 600000; // 10 mins
    // ❌ DON'T DO THIS: user.verification.email.isVerified = true;
    // ❌ DON'T DO THIS: user.isEmailVerified = true;
    
    await user.save();

    const emailService = new EmailService();
    await emailService.sendOTPEmail(user.email, user.username, otp);
    console.log('✅ OTP resent successfully');

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
};

// OTP Verification (issues tokens after verification)
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('🔍 Verifying OTP for', email, ':', otp);

    const user = await User.findOne({ 
      email,
      'verification.email.verificationExpires': { $gt: Date.now() },
      'verification.email.verificationOTP': otp
    }).select('+verification.email.verificationOTP');

    if (!user) {
      console.log('❌ Invalid or expired OTP for', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    console.log('✅ OTP verified successfully for', email);

    // ✅ Mark BOTH verification fields as true for compatibility
    user.verification.email.isVerified = true;
    user.isEmailVerified = true; // For backward compatibility
    user.verification.email.verificationOTP = undefined;
    user.verification.email.verificationExpires = undefined;

    // Generate tokens AFTER verification
    const { accessToken, refreshToken } = generateTokens(user);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.security;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: userResponse,
      tokens: { accessToken, refreshToken }
    });

  } catch (error) {
    console.error('❌ OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed. Please try again.'
    });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
    );

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('statistics')
      .select('-security.passwordResetToken -security.passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// Forgot password
// Forgot password with OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset code.'
      });
    }

    const otp = generateOTP();
    console.log('🔑 Generated password reset OTP for', email, ':', otp);

    // ✅ CRITICAL: Ensure security object exists
    if (!user.security) {
      user.security = {};
    }
    
    user.security.passwordResetOTP = otp;
    user.security.passwordResetExpires = Date.now() + 600000; // 10 minutes
    
    await user.save();
    
    // ✅ VERIFY: Check if OTP was saved correctly
    const savedUser = await User.findOne({ email });
    console.log('🔍 Saved OTP data:', {
      email: savedUser.email,
      storedOTP: savedUser.security?.passwordResetOTP,
      expiresAt: savedUser.security?.passwordResetExpires,
      currentTime: Date.now()
    });

    // Send email...
    const emailService = new EmailService();
    await emailService.sendPasswordResetOTP(user.email, user.username, otp);

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset code.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing request'
    });
  }
};


// Verify password reset OTP
exports.verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('🔍 Verifying password reset OTP for', email, ':', otp);

    const user = await User.findOne({
      email,
      'security.passwordResetExpires': { $gt: Date.now() },
      'security.passwordResetOTP': otp
    });

    if (!user) {
      console.log('❌ Invalid or expired password reset OTP for', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    console.log('✅ Password reset OTP verified successfully for', email);

    // ✅ CRITICAL: Generate a NEW reset token for password step
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log('🔑 Generated new reset token:', resetToken.substring(0, 10) + '...');
    console.log('🔑 Hashed token stored:', hashedToken.substring(0, 10) + '...');

    // ✅ IMPORTANT: Set NEW expiration time (15 minutes from now)
    user.security.passwordResetToken = hashedToken;
    user.security.passwordResetExpires = Date.now() + 900000; // 15 minutes
    user.security.passwordResetOTP = undefined; // Clear OTP after verification
    
    await user.save();

    // ✅ VERIFY: Check what was actually saved
    const savedUser = await User.findById(user._id);
    console.log('🔍 Saved token data:', {
      hasToken: !!savedUser.security?.passwordResetToken,
      expiresAt: savedUser.security?.passwordResetExpires,
      currentTime: Date.now(),
      timeLeft: savedUser.security?.passwordResetExpires - Date.now()
    });

    res.status(200).json({
      success: true,
      message: 'Reset code verified successfully',
      resetToken // ✅ Send unhashed token to frontend
    });

  } catch (error) {
    console.error('❌ Password reset OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset verification failed. Please try again.'
    });
  }
};



// Resend password reset OTP
exports.resendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'If your email is registered, you will receive a new reset code.' 
      });
    }

    const otp = generateOTP();
    console.log('🔄 Resending password reset OTP for', email, ':', otp);

    user.security = user.security || {};
    user.security.passwordResetOTP = otp;
    user.security.passwordResetExpires = Date.now() + 600000; // 10 mins
    await user.save();

    const emailService = new EmailService();
    await emailService.sendPasswordResetOTP(user.email, user.username, otp);
    console.log('✅ Password reset OTP resent successfully');

    res.status(200).json({ 
      success: true, 
      message: 'If your email is registered, you will receive a new reset code.' 
    });
  } catch (error) {
    console.error('❌ Error resending password reset OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending reset code' 
    });
  }
};


// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log('🔍 Reset password request:', {
      tokenReceived: token ? token.substring(0, 10) + '...' : 'MISSING',
      passwordLength: newPassword?.length || 0,
      currentTime: Date.now()
    });

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // ✅ Hash the received token to match stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('🔍 Looking for hashed token:', hashedToken.substring(0, 10) + '...');

    const user = await User.findOne({
      'security.passwordResetToken': hashedToken,
      'security.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      console.log('❌ No user found with valid reset token');
      
      // ✅ DEBUG: Check if user exists with any token
      const userWithToken = await User.findOne({
        'security.passwordResetToken': hashedToken
      });
      
      if (userWithToken) {
        console.log('🔍 User found but token expired:', {
          expiresAt: userWithToken.security?.passwordResetExpires,
          currentTime: Date.now(),
          expired: userWithToken.security?.passwordResetExpires < Date.now()
        });
      } else {
        console.log('🔍 No user found with this token at all');
      }
      
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    console.log('✅ Valid user found, updating password for:', user.email);

    // Password validation
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Update password
    user.password = newPassword;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    user.security.passwordResetOTP = undefined;
    user.security.loginAttempts = 0;
    user.security.lockUntil = undefined;

    await user.save();
    console.log('✅ Password reset successful for', user.email);

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
};



// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// Google OAuth
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'No credential sent' });
    }

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Google token invalid' });
    }

    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = new User({
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        isEmailVerified: true,
        authMethod: 'google',
        avatar: payload.picture
      });
      await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.security;

    res.json({
      success: true,
      message: 'Google authentication successful',
      user: userResponse,
      tokens: { accessToken, refreshToken }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
};

module.exports = exports;
