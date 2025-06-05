const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');

// Import the analytics controller functions
const {
  getDashboardAnalytics,
  getTradingAnalytics,
  getDeviceAnalytics,
  getCarbonCreditAnalytics,
  getMarketData
} = require('../controllers/analyticsController');

// Validation middleware
const validateTimeframe = [
  query('timeframe')
    .optional()
    .isIn(['24h', '7d', '30d', '90d', '1y'])
    .withMessage('Invalid timeframe. Must be 24h, 7d, 30d, 90d, or 1y')
];

const validateDeviceId = [
  param('deviceId')
    .isMongoId()
    .withMessage('Invalid device ID')
];

// Dashboard analytics
router.get('/dashboard', validateTimeframe, getDashboardAnalytics);

// Trading analytics
router.get('/trading', validateTimeframe, getTradingAnalytics);

// Device analytics
router.get('/devices', validateTimeframe, getDeviceAnalytics);
router.get('/devices/:deviceId', [validateDeviceId, ...validateTimeframe], getDeviceAnalytics);

// Carbon credit analytics
router.get('/carbon-credits', validateTimeframe, getCarbonCreditAnalytics);

// Market data
router.get('/market', getMarketData);

module.exports = router;
