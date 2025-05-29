const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const tradingController = require('../controllers/tradingController');

// Validation middleware
const validateListing = [
  body('deviceId').isMongoId().withMessage('Invalid device ID'),
  body('amount').isFloat({ min: 0.1, max: 10000 }).withMessage('Amount must be between 0.1 and 10,000 kWh'),
  body('pricePerKwh').isFloat({ min: 0.01, max: 1.00 }).withMessage('Price must be between $0.01 and $1.00 per kWh'),
  body('endDate').isISO8601().withMessage('Invalid end date format'),
  body('timeSlots').optional().isArray().withMessage('Time slots must be an array'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
];

const validatePurchase = [
  body('listingId').isMongoId().withMessage('Invalid listing ID'),
  body('amount').isFloat({ min: 0.1 }).withMessage('Amount must be at least 0.1 kWh'),
  body('paymentMethod').optional().isIn(['wallet', 'card', 'bank_transfer']).withMessage('Invalid payment method')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Listing routes
router.post('/listings', validateListing, tradingController.createListing);
router.get('/marketplace', validatePagination, tradingController.getMarketplaceListings);
router.get('/listings', validatePagination, tradingController.getUserListings);
router.put('/listings/:listingId', param('listingId').isMongoId(), tradingController.updateListing);
router.delete('/listings/:listingId', param('listingId').isMongoId(), tradingController.cancelListing);

// Transaction routes
router.post('/purchase', validatePurchase, tradingController.purchaseEnergy);
router.get('/transactions', validatePagination, tradingController.getUserTransactions);

// Analytics routes
router.get('/analytics', tradingController.getTradingAnalytics);

module.exports = router;
