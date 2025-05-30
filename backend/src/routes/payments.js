const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const paymentController = require('../controllers/paymentController');

// Validation middleware
const validatePaymentMethod = [
  body('type').isIn(['card', 'bank', 'paypal']).withMessage('Invalid payment method type'),
  body('cardData').optional().isObject().withMessage('Card data must be an object'),
  body('bankData').optional().isObject().withMessage('Bank data must be an object')
];

const validateDeposit = [
  body('amount').isFloat({ min: 1, max: 10000 }).withMessage('Amount must be between $1 and $10,000'),
  body('paymentMethodId').isMongoId().withMessage('Invalid payment method ID')
];

const validateWithdrawal = [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum withdrawal amount is $10'),
  body('paymentMethodId').isMongoId().withMessage('Invalid payment method ID')
];

// Payment routes
router.get('/wallet', paymentController.getWalletInfo);
router.post('/methods', validatePaymentMethod, paymentController.addPaymentMethod);
router.post('/deposit', validateDeposit, paymentController.depositFunds);
router.post('/withdraw', validateWithdrawal, paymentController.withdrawFunds);
router.get('/history', paymentController.getTransactionHistory);

module.exports = router;
