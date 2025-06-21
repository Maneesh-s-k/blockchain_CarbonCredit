const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

// Validation middleware
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];


router.get('/debug/check-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    res.json({ 
      exists: !!user,
      user: user ? { 
        email: user.email, 
        username: user.username, 
        id: user._id,
        isEmailVerified: user.isEmailVerified 
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.delete('/debug/force-delete/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await User.deleteMany({ email: email });
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} users with email ${email}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Auth routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Password management
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/verify-password-reset-otp', authController.verifyPasswordResetOTP);
router.post('/resend-password-reset-otp', authController.resendPasswordResetOTP);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.post('/change-password', authenticate, validateChangePassword, authController.changePassword);

// otp related routes
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.sendOTP);


// Profile
router.get('/profile', authenticate, authController.getProfile);
router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required')
], authController.googleAuth);
module.exports = router;
