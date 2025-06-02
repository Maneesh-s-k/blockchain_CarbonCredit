const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location.address').optional().isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),
  body('location.city').optional().isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('location.state').optional().isLength({ max: 100 }).withMessage('State cannot exceed 100 characters'),
  body('location.country').optional().isLength({ max: 100 }).withMessage('Country cannot exceed 100 characters')
];

// Profile routes - ALL ROUTES NOW REQUIRE AUTHENTICATION
router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, validateProfileUpdate, profileController.updateProfile);
router.post('/avatar', authenticate, profileController.uploadAvatar);
router.get('/dashboard', authenticate, profileController.getDashboardData); // FIXED: Added authentication
router.put('/notifications', authenticate, profileController.updateNotificationPreferences);
router.put('/privacy', authenticate, profileController.updatePrivacySettings);

module.exports = router;
