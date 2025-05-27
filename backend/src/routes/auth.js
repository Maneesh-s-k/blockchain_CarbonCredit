const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional({ checkFalsy: true }) // Make phone optional
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('walletAddress')
    .optional({ checkFalsy: true }) // Make wallet optional
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address')
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

const validatePasswordReset = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validatePhoneVerification = [
  body('phone')
    .isMobilePhone()
    .withMessage('Please enter a valid phone number')
];

const validatePhoneCode = [
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits')
];

const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
];

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', validateEmail, authController.resendEmailVerification);
router.post('/forgot-password', validateEmail, authController.forgotPassword);
router.post('/reset-password/:token', validatePasswordReset, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/change-password', authenticate, validatePasswordChange, authController.changePassword);
router.post('/send-phone-verification', authenticate, validatePhoneVerification, authController.sendPhoneVerification);
router.post('/verify-phone', authenticate, validatePhoneCode, authController.verifyPhone);
router.get('/login-history', authenticate, authController.getLoginHistory);
router.post('/logout', authController.logout);

module.exports = router;
