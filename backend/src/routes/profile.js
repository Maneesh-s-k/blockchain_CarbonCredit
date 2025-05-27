const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateProfileUpdate = [
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters'),
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters'),
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('walletAddress')
    .optional()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address')
];

const validatePreferences = [
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be boolean'),
  body('preferences.notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be boolean'),
  body('preferences.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'zh'])
    .withMessage('Invalid language'),
  body('preferences.currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'CNY'])
    .withMessage('Invalid currency'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be light or dark')
];

const validateDeactivation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deactivation')
];

// Routes
router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, validateProfileUpdate, profileController.updateProfile);
router.put('/preferences', authenticate, validatePreferences, profileController.updatePreferences);
router.post('/deactivate', authenticate, validateDeactivation, profileController.deactivateAccount);

module.exports = router;
