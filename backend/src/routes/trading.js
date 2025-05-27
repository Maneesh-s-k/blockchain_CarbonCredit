const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const tradingController = require('../controllers/tradingController');

// Validation middleware
const validateSellOrder = [
  body('deviceId').isMongoId().withMessage('Invalid device ID'),
  body('energyAmount').isNumeric().isFloat({ min: 0 }).withMessage('Energy amount must be positive'),
  body('pricePerUnit').isNumeric().isFloat({ min: 0 }).withMessage('Price must be positive'),
];

const validateBuyOrder = [
  body('energyAmount').isNumeric().isFloat({ min: 0 }).withMessage('Energy amount must be positive'),
  body('maxPricePerUnit').isNumeric().isFloat({ min: 0 }).withMessage('Max price must be positive'),
];

// Routes
router.post('/sell', validateSellOrder, tradingController.createSellOrder);
router.post('/buy', validateBuyOrder, tradingController.createBuyOrder);
router.get('/market', tradingController.getMarketData);
router.get('/orders/:userId?', tradingController.getUserOrders);
router.delete('/orders/:orderId', tradingController.cancelOrder);

module.exports = router;
