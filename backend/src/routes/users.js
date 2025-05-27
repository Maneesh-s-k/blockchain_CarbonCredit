const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation middleware
const validateUserId = [
  param('userId').isMongoId().withMessage('Invalid user ID')
];

const validateProfileUpdate = [
  body('profile.firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
  body('profile.lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
  body('profile.phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('walletAddress').optional().matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum address')
];

const validateBalanceUpdate = [
  body('energyBalance').optional().isNumeric().isFloat({ min: 0 }).withMessage('Energy balance must be positive'),
  body('creditBalance').optional().isNumeric().isFloat({ min: 0 }).withMessage('Credit balance must be positive'),
  body('action').optional().isIn(['set', 'add', 'subtract']).withMessage('Invalid action')
];

// Routes
router.get('/:userId', validateUserId, userController.getUserProfile);
router.put('/:userId', authenticate, validateUserId, validateProfileUpdate, userController.updateUserProfile);
router.get('/:userId/devices', validateUserId, userController.getUserDevices);
router.get('/:userId/transactions', validateUserId, userController.getUserTransactions);
router.put('/:userId/balance', authenticate, authorize('admin'), validateUserId, validateBalanceUpdate, userController.updateUserBalance);
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

module.exports = router;
